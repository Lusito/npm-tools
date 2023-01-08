import prompts from "prompts";
import type { PackageJson } from "type-fest";
import { readFile } from "fs/promises";
import { execSync } from "child_process";
import { resolve } from "path";

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

    if (!workspaceNames) throw new Error("No workspaces found");

    const workspaces = await Promise.all(
        workspaceNames.map((workspace) => loadPackage(resolve(process.cwd(), workspace, "package.json")))
    );

    return {
        project,
        workspaces,
    };
}

export async function prompt<T = string>(question: Omit<prompts.PromptObject<"value">, "name">): Promise<T> {
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

export const run = (command: string) => execSync(command, { stdio: [0, 1, 2] });

export function die(message: string) {
    console.log("");
    console.error(`❌ ${message}`);
    process.exit(-1);
}
