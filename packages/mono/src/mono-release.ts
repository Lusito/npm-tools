#!/usr/bin/env node
import { dirname } from "path";

import { die, loadPackages, log, PackageJson, prompt, PublicPackageJson, run } from "./utils";

type ReleaseContext = {
    project: PublicPackageJson;
    isWorkspace: boolean;
    allPackages: PackageJson[];
    publicPackages: PublicPackageJson[];
    isDryRun: boolean;
};

async function main() {
    const packages = await loadPackages();

    const isWorkspace = Array.isArray(packages);
    const allPackages = isWorkspace ? packages : [packages];

    const publicPackages = allPackages.filter((p) => !p.private && p.name && p.version) as PublicPackageJson[];

    if (publicPackages.length === 0) {
        die("No public packages found!");
    }

    const publishMethod = await promptPublishMethod();
    const isDryRun = publishMethod === "dry-run";

    const baseContext: Omit<ReleaseContext, "project"> = {
        isWorkspace,
        isDryRun,
        allPackages,
        publicPackages,
    };

    if (!isWorkspace) {
        return runForProject({ ...baseContext, project: publicPackages[0] });
    }

    const processedProjects: PublicPackageJson[] = [];
    while (processedProjects.length !== publicPackages.length) {
        /* eslint-disable no-await-in-loop */
        const project = await promptProject(publicPackages.filter((v) => !processedProjects.includes(v)));
        if (!project) break;
        await runForProject({ ...baseContext, project });
        processedProjects.push(project);
        /* eslint-enable no-await-in-loop */
    }
}

async function runForProject(context: ReleaseContext) {
    await bumpVersion(context);
    buildProject(context);
    releaseProject(context);
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
    return prompt<PublicPackageJson | null>({
        type: "select",
        message: "Select the project",
        choices: [...packages.map((value) => ({ title: value.name, value })), { title: "[Exit]", value: null }],
    });
}

function buildProject({ project, isWorkspace }: ReleaseContext) {
    if (!project.scripts?.build) {
        log.warn(`No build script found for ${project.name}!`);
    } else {
        log("Starting build");
        if (isWorkspace) {
            run(`npm run build -w ${project.name}`);
        } else {
            run("npm run build");
        }
        log.success("Build done");
    }
}

function releaseProject({ project, isDryRun }: ReleaseContext) {
    log("Publishing");
    process.chdir(dirname(project.path));
    run(`npm publish --access public ${isDryRun ? "--dry-run" : ""}`);
}

async function bumpVersion({ project, publicPackages }: ReleaseContext) {
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
        log.success(`Changing version of ${project.name} to ${newVersion}`);
        project.version = newVersion;
        run(`cat <<< $(jq '.version="${newVersion}"' ${project.path}) > ${project.path}`);

        // Adjust dependent projects as well
        for (const otherProject of publicPackages) {
            if (otherProject !== project) {
                adjustVersionAfterBump(otherProject, project.name, project.version, "dependencies");
                adjustVersionAfterBump(otherProject, project.name, project.version, "devDependencies");
            }
        }
    } else {
        log.ignored(`No version change performed on ${project.name}`);
    }
}

function adjustDependencyVersion(oldVersion: string, newVersion: string) {
    if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return newVersion;
    if (/^~[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return `~${newVersion}`;
    if (/^\^[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return `^${newVersion}`;

    log.warn(`Unexpected dependency version format "${oldVersion}", manual adjustment needed`);
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
            log(`Changing ${project.name}'s ${dependencyType} version of ${name} to ${newVersion}`);
            deps[name] = adjustedVersion;
            run(`cat <<< $(jq '.${dependencyType}["${name}"]="${adjustedVersion}"' ${project.path}) > ${project.path}`);
        }
    }
}

main();
