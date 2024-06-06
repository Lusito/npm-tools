import prompts from "prompts";
import type { PackageJson as BasePackageJson } from "type-fest";
import { readFile } from "fs/promises";
import { readdirSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, relative } from "path";
import chalk from "chalk";
import ignore, { Ignore } from "ignore";

export const chalkSymbols = {
    success: `[${chalk.green("success")}]`,
    error: `[${chalk.red("error")}]`,
    ignored: `[${chalk.gray("ignored")}]`,
    warn: `[${chalk.yellow("warn")}]`,
};

export const log = Object.assign(
    (message?: any, ...optionalParams: any[]) => {
        console.log(message, ...optionalParams);
    },
    {
        error(message?: any, ...optionalParams: any[]) {
            console.error(`${chalkSymbols.error} ${message}`, ...optionalParams);
        },
        success(message?: any, ...optionalParams: any[]) {
            console.log(`${chalkSymbols.success} ${message}`, ...optionalParams);
        },
        warn(message?: any, ...optionalParams: any[]) {
            console.warn(`${chalkSymbols.warn} ${message}`, ...optionalParams);
        },
        ignored(message?: any, ...optionalParams: any[]) {
            console.log(`${chalkSymbols.ignored} ${message}`, ...optionalParams);
        },
    },
);

export async function loadPackage(path: string) {
    const data = await readFile(path);

    return Object.assign(JSON.parse(data.toString()), { path }) as PackageJson;
}

export async function loadPackages(): Promise<PackageJson | PackageJson[]> {
    const project = await loadPackage(resolve(process.cwd(), "./package.json"));

    const workspaceNames = Array.isArray(project.workspaces) ? project.workspaces : project.workspaces?.packages;

    if (!workspaceNames) return project;

    return Promise.all(
        workspaceNames.map((workspace) => loadPackage(resolve(process.cwd(), workspace, "package.json"))),
    );
}

export async function prompt<T = string>(question: Omit<prompts.PromptObject<"value">, "name">): Promise<T> {
    const result = await prompts(
        {
            name: "value",
            ...question,
        },
        {
            onCancel() {
                die("Aborting");
            },
        },
    );

    return result.value;
}

export const run = (command: string) => execSync(command, { stdio: [0, 1, 2] });

export function die(message: string) {
    log("");
    log.error(message);
    process.exit(1);
}

export type LinterType =
    | "eslint"
    | "prettier"
    | "stylelint"
    | "sort-package-json"
    | "lint-markdown-links"
    | "lint-markdown-titles";

export const logLintStart = (linter: LinterType) => {
    log("");
    log(`--------- Starting ${linter} ---------`);
};

export type MonoLintOptions = {
    lintMarkdownLinks?: {
        warnOnlyPatterns?: string[];
    };
    lintMarkdownTitles?: {
        ignorePatterns?: string[];
    };
};

export type PackageJson = BasePackageJson & {
    path: string;
    monoLint?: MonoLintOptions;
};

let ignoreInstance: Ignore | undefined;
function getIgnore() {
    if (!ignoreInstance) {
        ignoreInstance = ignore().add(readFileSync(resolve(process.cwd(), ".lintignore"), "utf-8"));
    }
    return ignoreInstance;
}

export function getFilesToLint(extension: string, dir = ".", result: string[] = []) {
    const ig = getIgnore();
    const dirents = readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (ig.ignores(relative(process.cwd(), res))) continue;

        if (dirent.isDirectory()) getFilesToLint(extension, res, result);
        else if (res.endsWith(extension)) result.push(res);
    }

    return result;
}
