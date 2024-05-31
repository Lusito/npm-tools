#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve, join } from "path";
import { PackageJson } from "type-fest";

import { die, loadPackage, run } from "./utils";

const lint = (linter: "eslint" | "prettier" | "stylelint" | "sort-package-json", params: string) => {
    console.log("");
    console.log(`--------- Starting ${linter} ---------`);
    const command = `${linter} ${params}`;
    console.log(`${command}`);
    run(`npx ${command}`);
};

type LinterContext = {
    project: PackageJson;
    dependencies: string[];
    fix: boolean;
};
const linters: Record<string, (context: LinterContext) => boolean> = {
    eslint({ project, dependencies, fix }) {
        if (
            project.name === "@lusito/npm-tools" ||
            dependencies.includes("@lusito/eslint-config-react") ||
            dependencies.includes("@lusito/eslint-config")
        ) {
            lint("eslint", `"./**/*.{ts,tsx,js}" --ext ".js,.ts,.tsx" --ignore-path .lintignore ${fix ? "--fix" : ""}`);

            return true;
        }

        return false;
    },
    prettier({ project, dependencies, fix }) {
        if (project.name === "@lusito/npm-tools" || dependencies.includes("@lusito/prettier-config")) {
            lint(
                "prettier",
                `"./**/*.{ts,tsx,js,css,scss,json,yml,md}" --ignore-path .lintignore ${fix ? "--write" : "--check"}`,
            );

            return true;
        }

        return false;
    },
    stylelint({ dependencies, fix }) {
        if (dependencies.includes("@lusito/stylelint-config")) {
            lint("stylelint", `"./**/*.{css,scss}" --ignore-path .lintignore ${fix ? "--fix" : ""}`);

            return true;
        }

        return false;
    },
    // eslint-disable-next-line object-shorthand
    "sort-package-json"({ project, dependencies, fix }) {
        if (dependencies.includes("sort-package-json")) {
            const workspaces = Array.isArray(project.workspaces)
                ? project.workspaces
                : project.workspaces?.packages ?? ["."];

            const files = [".", ...workspaces].map((ws) => `"${join(ws, "package.json")}"`).join(" ");
            lint("sort-package-json", `${files} ${fix ? "" : "--check"}`);

            return true;
        }
        return false;
    },
};

async function main() {
    const { fix } = await yargs(hideBin(process.argv))
        .command("$0", "Run linters")
        .option("fix", {
            default: false,
            type: "boolean",
            description: "Fix",
        })
        .parseAsync();

    const project = await loadPackage(resolve(process.cwd(), "package.json"));
    const dependencies = Object.keys(project.dependencies ?? {}).concat(Object.keys(project.devDependencies ?? {}));
    const context: LinterContext = {
        project,
        dependencies,
        fix,
    };

    const runs: string[] = [];
    let failed = false;
    for (const [key, fn] of Object.entries(linters)) {
        try {
            if (fn(context)) runs.push(key);
        } catch (e) {
            failed = true;
        }
    }

    if (!runs.length) die("No linter has run");
    else if (failed) die("Please fix the above issues");

    console.log("");
    console.log(`✅ Successfully ran linters: ${runs.join(", ")}`);
}

main();
