#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve } from "path";

import { die, loadPackage, run } from "./utils";

async function main() {
    const { fix, src, pkg, type } = await yargs(hideBin(process.argv))
        .command("$0", "Lint monorepo")
        .option("fix", {
            default: false,
            type: "boolean",
            description: "Fix",
        })
        .option("src", {
            default: "packages/*/src/**",
            type: "string",
            description: "source path pattern",
        })
        .option("pkg", {
            default: "packages/*",
            type: "string",
            description: "package path pattern",
        })
        .option("type", {
            alias: "t",
            default: ["auto"],
            type: "array",
            description: "type of linter to use",
        })
        .parseAsync();

    const project = await loadPackage(resolve(process.cwd(), "./package.json"));

    const dependencies = Object.keys(project.dependencies ?? {}).concat(Object.keys(project.devDependencies ?? {}));
    const runs: string[] = [];
    let failed = false;

    const hasType = (t: "eslint" | "prettier" | "stylelint" | "package") => type.includes(t) || type.includes("auto");

    const typesEnabled = {
        eslint:
            hasType("eslint") &&
            (dependencies.includes("@lusito/eslint-config-react") || dependencies.includes("@lusito/eslint-config")),
        prettier: hasType("prettier") && dependencies.includes("@lusito/prettier-config"),
        stylelint: hasType("stylelint") && dependencies.includes("@lusito/stylelint-config"),
        "sort-package-json": hasType("package") && dependencies.includes("sort-package-json"),
    };

    const lint = (linter: "eslint" | "prettier" | "stylelint" | "sort-package-json", params: string) => {
        if (typesEnabled[linter]) {
            console.log("");
            console.log(`--------- Starting ${linter} ---------`);
            try {
                run(`npx ${linter} ${params}`);
            } catch (e) {
                failed = true;
            }
            runs.push(linter);
        }
    };

    lint("eslint", `"${src}/*.{js,ts,tsx}" --ext ".js,.ts,.tsx" --ignore-path .prettierignore ${fix ? "--fix" : ""}`);
    lint(
        "prettier",
        `"${src}/*.{ts,tsx,js,json,css,scss}" "${pkg}/*.{ts,tsx,js,json,css,scss}" ${fix ? "--write" : "--check"}`
    );
    lint("stylelint", `--ignore-path .prettierignore "${src}/*.{css,scss}" ${fix ? "--fix" : ""}`);
    lint("sort-package-json", `package.json ${pkg === "." ? "" : `"${pkg}/package.json"`} ${fix ? "" : "--check"}`);

    if (!runs.length) die("No linter has run");
    else if (failed) die("Please fix the above issues");

    console.log("");
    console.log(`✅ Successfully ran linters: ${runs.join(", ")}`);
}

main();
