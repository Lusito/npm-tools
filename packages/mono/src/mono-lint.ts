#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve, join } from "path";

import { LinterType, PackageJson, die, loadPackage, log, logLintStart, run } from "./utils";
import { lintMarkdownLinks } from "./lint-markdown-links";
import { lintMarkdownTitles } from "./lint-markdown-titles";

const lint = (linter: "eslint" | "prettier" | "stylelint" | "sort-package-json", params: string) => {
    logLintStart(linter);
    const command = `${linter} ${params}`;
    log(command);
    run(`npx ${command}`);
};

export type LinterContext = {
    project: PackageJson;
    dependencies: string[];
    fix: boolean;
};

const linters: Record<LinterType, (context: LinterContext) => Promise<boolean> | boolean> = {
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
    stylelint({ project, dependencies, fix }) {
        if (project.name === "@lusito/npm-tools" || dependencies.includes("@lusito/stylelint-config")) {
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
                : (project.workspaces?.packages ?? ["."]);

            const files = [".", ...workspaces].map((ws) => `"${join(ws, "package.json")}"`).join(" ");
            lint("sort-package-json", `${files} ${fix ? "" : "--check"}`);

            return true;
        }
        return false;
    },
    "lint-markdown-titles": lintMarkdownTitles,
    "lint-markdown-links": lintMarkdownLinks,
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
            // eslint-disable-next-line no-await-in-loop
            const result = await fn(context);
            if (result) runs.push(key);
        } catch (e) {
            log.error(String(e));
            failed = true;
        }
    }

    if (!runs.length) die("No linter has run");
    else if (failed) die("Please fix the above issues");

    log("");
    log.success(`Successfully ran linters: ${runs.join(", ")}`);
}

main();
