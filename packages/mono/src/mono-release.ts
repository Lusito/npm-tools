#!/usr/bin/env node
import chalk from "chalk";

import { die, loadPackages, log, PackageJson, prompt, run } from "./utils";

export type PublishableProject = PackageJson & {
    name: string;
    version: string;
    private: false;
    // Merely here to store our state
    bumpTo?: { version: string; type: "patch" | "minor" | "major" } | null;
};

async function main() {
    const packages = await loadPackages();

    const isWorkspace = Array.isArray(packages);
    const allPackages = isWorkspace ? packages : [packages];

    const publishableProject = allPackages.filter((p) => !p.private && p.name && p.version) as PublishableProject[];

    if (publishableProject.length === 0) {
        die("No publishable packages found!");
    }

    await promptProjectBumps(publishableProject);
    const bumpedProjects = publishableProject.filter((p) => p.bumpTo);
    if (bumpedProjects.length === 0) {
        die("No packages selected!");
    }
    const publishMethod = await promptPublishMethod();

    bumpedProjects.forEach((project) => bumpVersion(project, allPackages));
    bumpedProjects.forEach((project) => buildProject(project, isWorkspace));

    await releaseProjects(bumpedProjects, publishMethod);
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

const bumpColors = {
    major: chalk.red,
    minor: chalk.green,
    patch: chalk.blue,
};

function getPackageLabel(project: PublishableProject, maxLabelLength: number) {
    if (!project.bumpTo) return project.name;

    const { name, version, bumpTo } = project;

    const pad = " ".repeat(maxLabelLength - name.length);
    const type = bumpColors[bumpTo.type](`[${bumpTo.type.toUpperCase()}]`);
    const bumpHint = `: ${pad}${type} ${chalk.reset(version)} -> ${chalk.blue(bumpTo.version)}`;
    return `${name}${chalk.reset(bumpHint)}`;
}

function getInitialBumpTo(
    bumpProject: PublishableProject,
    newVersions: { major: string; minor: string; patch: string },
) {
    // Undefined is only on first change
    if (bumpProject.bumpTo === undefined) return 1;

    return bumpProject.bumpTo ? Object.keys(newVersions).indexOf(bumpProject.bumpTo.type) : 3;
}

async function promptProjectBumps(projects: PublishableProject[], initial = 0) {
    const maxLabelLength = Math.max(...projects.map((p) => p.name.length));
    const bumpProject = await prompt<PublishableProject | null>({
        type: "select",
        message: "Configure version changes",
        hint: "Select a project to configure a version change",
        choices: [
            ...projects.map((p) => ({ title: getPackageLabel(p, maxLabelLength), value: p })),
            { title: "[Start publishing]", value: null },
        ],
        initial,
    });

    // Start publishing?
    if (!bumpProject) return;

    await promptProjectVersionBump(bumpProject);

    await promptProjectBumps(projects, projects.indexOf(bumpProject));
}

async function promptProjectVersionBump(bumpProject: PublishableProject) {
    const [major, minor, patch] = bumpProject.version.split(".").map(parseFloat);

    const newVersions = {
        major: `${major + 1}.0.0`,
        minor: `${major}.${minor + 1}.0`,
        patch: `${major}.${minor}.${patch + 1}`,
    };

    const type = await prompt<keyof typeof newVersions | null>({
        type: "select",
        message: `What increment would you like to perform on ${chalk.cyan(bumpProject.name)}?`,
        choices: [
            ...Object.keys(newVersions).map((value) => ({
                title: `${value}: ${bumpProject.version} -> ${newVersions[value as keyof typeof newVersions]}`,
                value,
            })),
            { title: "no increment", value: null },
        ],
        initial: getInitialBumpTo(bumpProject, newVersions),
    });

    bumpProject.bumpTo = type && { type, version: newVersions[type] };
}

function buildProject(project: PublishableProject, isWorkspace: boolean) {
    if (!project.scripts?.build) {
        log.warn(`No build script found for ${project.name}!`);
    } else {
        log(`Starting build for ${project.name}.`);
        run(isWorkspace ? `npm run build -w ${project.name}` : "npm run build");

        log.success(`Build for ${project.name} complete.`);
    }
}

async function releaseProjects(projects: PublishableProject[], publishMethod: "normal" | "dry-run") {
    const params = projects.map((p) => `-w ${p.name}`);
    if (publishMethod === "dry-run") {
        params.push("--dry-run");
    } else {
        const otp = await prompt<string>({ type: "text", message: "Enter One Time Password" });
        params.push(`--otp ${otp}`);
    }

    const projectNames = projects.map((p) => p.name).join(", ");
    log(`Publishing ${projectNames}`);
    run(`npm publish --access public ${params.join(" ")}`);

    if (publishMethod === "normal") log.success(`Successfully published ${projectNames}`);
    else log.success(`Successfully ran dry-run publish on ${projectNames}`);
}

function bumpVersion(project: PublishableProject, allPackages: PackageJson[]) {
    const { bumpTo } = project;
    if (!bumpTo) return;

    // Edit package.json in-place
    log(`Changing version of ${project.name} to ${bumpTo.version}`);
    project.version = bumpTo.version;

    run(`cat <<< $(jq '.version="${bumpTo.version}"' ${project.path}) > ${project.path}`);
    log.success(`Changed version of ${project.name} to ${bumpTo.version}`);

    // Adjust dependent projects as well
    for (const otherProject of allPackages) {
        if (otherProject !== project) {
            adjustVersionAfterBump(otherProject, project.name, project.version, "dependencies");
            adjustVersionAfterBump(otherProject, project.name, project.version, "devDependencies");
            adjustVersionAfterBump(otherProject, project.name, project.version, "peerDependencies");
        }
    }
}

function adjustDependencyVersion(project: PackageJson, name: string, oldVersion: string, newVersion: string) {
    if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return newVersion;
    if (/^~[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return `~${newVersion}`;
    if (/^\^[0-9]+\.[0-9]+\.[0-9]+$/.test(oldVersion)) return `^${newVersion}`;

    throw new Error(`Unexpected version format "${oldVersion}" for ${name} in ${project.name ?? "unnamed project"}`);
}

function adjustVersionAfterBump(
    project: PackageJson,
    name: string,
    newVersion: string,
    dependencyType: "dependencies" | "devDependencies" | "peerDependencies",
) {
    const deps = project[dependencyType];
    const oldVersion = deps?.[name];
    if (oldVersion) {
        const adjustedVersion = adjustDependencyVersion(project, name, oldVersion, newVersion);
        // Edit package.json in-place
        log(`Changing ${project.name}'s ${dependencyType} version of ${name} to ${newVersion}`);
        deps[name] = adjustedVersion;
        run(`cat <<< $(jq '.${dependencyType}["${name}"]="${adjustedVersion}"' ${project.path}) > ${project.path}`);
        log.success(`Changed ${project.name}'s ${dependencyType} version of ${name} to ${newVersion}`);
    }
}

main();
