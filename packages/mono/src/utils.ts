import prompts from "prompts";
import type { PackageJson } from "type-fest";
import { readFile } from "fs/promises";
import { execSync } from "child_process";
import { resolve } from "path";
import chalk from "chalk";

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

export type PublicPackageJson = PackageJson & {
    path: string;
    name: string;
    version: string;
    private: false;
};

export async function loadPackage(path: string) {
    const data = await readFile(path);

    return Object.assign(JSON.parse(data.toString()), { path }) as PackageJson;
}

export async function loadPackages() {
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

export const logLintStart = (
    linter: "eslint" | "prettier" | "stylelint" | "sort-package-json" | "lint-markdown-links",
) => {
    log("");
    log(`--------- Starting ${linter} ---------`);
};
