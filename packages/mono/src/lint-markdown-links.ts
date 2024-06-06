import markdownLinkCheck from "markdown-link-check";
import path from "path";
import { readFile } from "fs/promises";

import { MonoLintOptions, chalkSymbols, getFilesToLint, log, logLintStart } from "./utils";
import type { LinterContext } from "./mono-lint";

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

async function checkFile(file: string, monoLintOptions: MonoLintOptions | undefined) {
    const fileContent = await readFile(file, "utf-8");

    return new Promise<void>((resolve, reject) => {
        const opts = {
            ...options,
            baseUrl: `file://${path.dirname(file)}`,
        };
        markdownLinkCheck(fileContent, opts, (err, results) => {
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
                        monoLintOptions?.lintMarkdownLinks?.warnOnlyPatterns?.map((p) => new RegExp(p, "i")) ?? [];

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
    const results = await Promise.allSettled(getFilesToLint(".md").map((file) => checkFile(file, monoLintOptions)));
    if (results.some(({ status }) => status !== "fulfilled")) {
        throw new Error("Some markdown files have invalid links");
    }

    return true;
}
