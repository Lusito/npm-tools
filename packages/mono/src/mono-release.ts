#!/usr/bin/env node
import chalk from "chalk";

import { die, loadPackages, log, PackageJson, prompt, PublicPackageJson, run } from "./utils";

async function main() {
    const packages = await loadPackages();

    const isWorkspace = Array.isArray(packages);
    const allPackages = isWorkspace ? packages : [packages];

    const publicPackages = allPackages.filter((p) => !p.private && p.name && p.version) as PublicPackageJson[];

    if (publicPackages.length === 0) {
        die("No public packages found!");
    }

    const projects = !isWorkspace ? [publicPackages[0]] : await promptProjects(publicPackages);
    const publishMethod = await promptPublishMethod();

    for (const project of projects) {
        // eslint-disable-next-line no-await-in-loop
        await bumpVersion(project, allPackages);
    }

    for (const project of projects) {
        buildProject(project, isWorkspace);
    }
    releaseProjects(projects, publishMethod);
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

function promptProjects(packages: PublicPackageJson[]) {
    return prompt<PublicPackageJson[]>({
        type: "multiselect",
        message: "Select the project",
        hint: "- Space to select. A to select all. Return to submit",
        instructions: false,
        choices: packages.map((value) => ({ title: value.name, value })),
        min: 1,
    });
}

function buildProject(project: PublicPackageJson, isWorkspace: boolean) {
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

async function releaseProjects(projects: PublicPackageJson[], publishMethod: "normal" | "dry-run") {
    const params = projects.map((p) => `-w ${p.name}`);
    if (publishMethod === "dry-run") {
        params.push("--dry-run");
    } else {
        const otp = await prompt<string>({ type: "text", message: "Enter One Time Password" });
        params.push(`--otp ${otp}`);
    }

    log("Publishing");
    run(`npm publish --access public ${params.join(" ")}`);
}

async function bumpVersion(project: PublicPackageJson, allPackages: PackageJson[]) {
    const [major, minor, patch] = project.version.split(".").map(parseFloat);

    const newVersions = {
        major: `${major + 1}.0.0`,
        minor: `${major}.${minor + 1}.0`,
        patch: `${major}.${minor}.${patch + 1}`,
    };

    const bumpType = await prompt({
        type: "select",
        message: `What increment would you like to perform on ${chalk.cyan(project.name)}?`,
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
        log(`Changing version of ${project.name} to ${newVersion}`);
        project.version = newVersion;
        run(`cat <<< $(jq '.version="${newVersion}"' ${project.path}) > ${project.path}`);
        log.success("Done");

        // Adjust dependent projects as well
        for (const otherProject of allPackages) {
            if (otherProject !== project) {
                adjustVersionAfterBump(otherProject, project.name, project.version, "dependencies");
                adjustVersionAfterBump(otherProject, project.name, project.version, "devDependencies");
                adjustVersionAfterBump(otherProject, project.name, project.version, "peerDependencies");
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
    project: PackageJson,
    name: string,
    newVersion: string,
    dependencyType: "dependencies" | "devDependencies" | "peerDependencies",
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
