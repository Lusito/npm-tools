#!/usr/bin/env node
import prompts from "prompts";
import type { PackageJson } from "type-fest";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { execSync } from "child_process";

type PublicPackageJson = PackageJson & {
    path: string;
    name: string;
    version: string;
    private: false;
};

async function main() {
    let { workspaces } = await loadPackage(join(process.cwd(), "./package.json"));

    workspaces = Array.isArray(workspaces) ? workspaces : workspaces?.packages;

    if (!workspaces) throw new Error("No workspaces found");

    const workspacePackages = await Promise.all(
        workspaces.map((workspace) => loadPackage(join(process.cwd(), workspace, "package.json")))
    );

    const publicPackages = workspacePackages.filter((p) => !p.private && p.name && p.version) as PublicPackageJson[];

    const project = await promptProject(publicPackages);
    await bumpVersion(project, publicPackages);
    buildProject(project);
    const publishMethod = await promptPublishMethod();
    releaseProject(project, publishMethod === "dry-run");
}

async function loadPackage(path: string) {
    const data = await readFile(path);

    return Object.assign(JSON.parse(data.toString()), { path }) as PackageJson;
}

async function prompt<T = string>(question: Omit<prompts.PromptObject<"value">, "name">): Promise<T> {
    const result = await prompts(
        {
            name: "value",
            ...question,
        },
        {
            onCancel() {
                console.error("Aborting");
                process.exit(-1);
            },
        }
    );

    return result.value;
}

const run = (command: string) => execSync(command, { stdio: [0, 1, 2] });

async function promptPublishMethod() {
    return prompt<"normal" | "dry-run">({
        type: "select",
        message: "Select publish method",
        choices: [
            { title: "Normal", value: "normal" },
            { title: "Dry Run", value: "dry-run" },
        ],
    });
}

async function promptProject(packages: PublicPackageJson[]) {
    return prompt<PublicPackageJson>({
        type: "select",
        message: "Select the project",
        choices: packages.map((value) => ({ title: value.name, value })),
    });
}

function buildProject(project: PublicPackageJson) {
    console.log("Starting build");
    run(`npm run build -w ${project.name}`);
    console.log("Build done");
}

function releaseProject(project: PublicPackageJson, dryRun: boolean) {
    console.log("Publishing");
    process.chdir(dirname(project.path));
    run(`npm publish --access public ${dryRun ? "--dry-run" : ""}`);
}

async function bumpVersion(project: PublicPackageJson, allProjects: PublicPackageJson[]) {
    const [major, minor, patch] = project.version.split(".").map(parseFloat);

    const newVersions = {
        major: `${major + 1}.0.0`,
        minor: `${major}.${minor + 1}.0`,
        patch: `${major}.${minor}.${patch + 1}`,
    };

    const bumpType = await prompt({
        type: "select",
        message: "What increment would you like to perform?",
        choices: [
            ...Object.keys(newVersions).map((value) => ({
                title: `${value}: ${project.version} -> ${newVersions[value as keyof typeof newVersions]}`,
                value,
            })),
            { title: "no increment", value: "" },
        ],
        initial: 1,
    });

    if (bumpType) {
        const newVersion = newVersions[bumpType as keyof typeof newVersions];

        if (!newVersion) {
            throw new Error(`Unexpected change ${bumpType}`);
        }

        // Edit package.json in-place
        console.log(`Changing version of ${project.name} to ${newVersion}`);
        project.version = newVersion;
        run(`cat <<< $(jq '.version="${newVersion}"' ${project.path}) > ${project.path}`);

        // Adjust dependent projects as well
        for (const otherProject of allProjects) {
            if (otherProject !== project) {
                adjustVersionAfterBump(otherProject, project.name, project.version, "dependencies");
                adjustVersionAfterBump(otherProject, project.name, project.version, "devDependencies");
            }
        }
    } else {
        console.log(`No version change performed on ${project.name}`);
    }
}

function adjustDependencyVersion(oldVersion: string, newVersion: string) {
    if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return newVersion;
    if (/^~[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return `~${newVersion}`;
    if (/^\^[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return `^${newVersion}`;

    console.warn(`❌ Unexpected dependency version format "${oldVersion}", manual adjustment needed`);
    return null;
}

function adjustVersionAfterBump(
    project: PublicPackageJson,
    name: string,
    newVersion: string,
    dependencyType: "dependencies" | "devDependencies"
) {
    const deps = project[dependencyType];
    if (deps) {
        const oldVersion = deps[name];
        const adjustedVersion = oldVersion && adjustDependencyVersion(oldVersion, newVersion);
        if (adjustedVersion) {
            // Edit package.json in-place
            console.log(`Changing ${project.name}'s ${dependencyType} version of ${name} to ${newVersion}`);
            deps[name] = adjustedVersion;
            run(`cat <<< $(jq '.${dependencyType}["${name}"]="${adjustedVersion}"' ${project.path}) > ${project.path}`);
        }
    }
}

main();
