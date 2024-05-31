#!/usr/bin/env node
import { dirname } from "path";

import { die, loadPackages, prompt, PublicPackageJson, run } from "./utils";

async function main() {
    const packages = await loadPackages();

    const isWorkspace = Array.isArray(packages)
    const workspaces = isWorkspace ? packages : [packages];

    const publicPackages = workspaces.filter((p) => !p.private && p.name && p.version) as PublicPackageJson[];

    if (publicPackages.length === 0) {
        die("No public packages found!");
    }

    const project = publicPackages.length === 1 ? publicPackages[0] : await promptProject(publicPackages);
    await bumpVersion(project, publicPackages);
    buildProject(project, isWorkspace);
    const publishMethod = await promptPublishMethod();
    releaseProject(project, publishMethod === "dry-run");
}

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

function buildProject(project: PublicPackageJson, isWorkspace: boolean) {
    if (!project.scripts?.build) {
        console.warn(`No build script found for ${project.name}!`);
    } else {
        console.log("Starting build");
        const buildFlags = isWorkspace ? "-w" : "";
        run(`npm run build ${buildFlags} ${project.name}`);
        console.log("Build done");
    }
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
            die(`Unexpected change ${bumpType}`);
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
    dependencyType: "dependencies" | "devDependencies",
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
