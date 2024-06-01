import markdownLinkCheck from "markdown-link-check";
import ignore from "ignore";
import path from "path";
import fs from "fs";

import { MonoLintOptions, chalkSymbols, log, logLintStart } from "./utils";
import type { LinterContext } from "./mono-lint";

const ig = ignore().add(fs.readFileSync(path.resolve(process.cwd(), ".lintignore"), "utf-8"));

const statusLabels = {
    alive: chalkSymbols.success,
    dead: chalkSymbols.error,
    ignored: chalkSymbols.ignored,
    error: chalkSymbols.warn,
};

const options = {
    retryOn429: true,
    retryCount: 2,
    fallbackRetryDelay: "30s",
    aliveStatusCodes: [200, 206],
};

function getFiles(dir: string, extension: string, result: string[] = []) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (ig.ignores(path.relative(process.cwd(), res))) continue;

        if (dirent.isDirectory()) getFiles(res, extension, result);
        else if (res.endsWith(extension)) result.push(res);
    }

    return result;
}

function checkFile(file: string, monoLintOptions: MonoLintOptions | undefined) {
    return new Promise<void>((resolve, reject) => {
        const opts = {
            ...options,
            baseUrl: `file://${path.dirname(file)}`,
        };
        markdownLinkCheck(fs.readFileSync(file, "utf-8"), opts, (err, results) => {
            const relativeFile = path.relative(process.cwd(), file);
            if (err) {
                log.error(relativeFile, err);
                reject(err);
                return;
            }
            if (results.length) {
                const failed = results.filter((result) => result.status !== "alive" && result.status !== "ignored");
                if (failed.length) {
                    log.warn(relativeFile);
                    const warnOnlyPatterns =
                        monoLintOptions?.lintMarkdownLinks?.warnOnlyPatterns?.map((p) => new RegExp(p)) ?? [];

                    let failHard = false;
                    for (const result of failed) {
                        const warnOnly = warnOnlyPatterns.some((p) => p.test(result.link));
                        const statusLabel = warnOnly ? statusLabels.ignored : statusLabels[result.status];
                        log(`${statusLabel} ${result.link}`);

                        if (!warnOnly) failHard = true;
                    }

                    if (failHard) {
                        reject();
                        return;
                    }
                }
            }

            resolve();
        });
    });
}

export async function lintMarkdownLinks({ project }: LinterContext) {
    const monoLintOptions = project.monoLint;

    logLintStart("lint-markdown-links");
    const results = await Promise.allSettled(getFiles(".", ".md").map((file) => checkFile(file, monoLintOptions)));
    if (results.some(({ status }) => status !== "fulfilled")) {
        throw new Error("Some markdown files have invalid links");
    }

    return true;
}
