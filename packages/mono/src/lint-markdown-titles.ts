import { readFile } from "fs/promises";
import { titleCase } from "title-case";
import MarkdownIt from "markdown-it";
import { Window } from "happy-dom";

import { getFilesToLint, log, logLintStart } from "./utils";
import type { LinterContext } from "./mono-lint";

const window = new Window();
const createElement = window.document.createElement.bind(window.document);
const createTextNode = window.document.createTextNode.bind(window.document);
const md: MarkdownIt = new MarkdownIt({ linkify: true, html: true });

function markdownToDom(content: string) {
    const div = createElement("div");
    div.innerHTML = md.render(content);
    return div;
}

const IGNORED = "{IGNORED}";

async function checkFile(file: string, ignorePatterns: Array<string | RegExp>) {
    const fileContent = await readFile(file, "utf-8");
    const dom = markdownToDom(fileContent);

    let failed = false;
    const triggerError = (message: string) => {
        if (!failed) {
            failed = true;
            log.error(file);
        }
        log.error(message);
    };

    const headings = Array.from(dom.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    for (const heading of headings) {
        const originalText = heading.textContent;

        // Replace all code blocks with placeholders
        heading.querySelectorAll("code").forEach((v) => v.replaceWith(createTextNode(IGNORED)));
        let text = heading.textContent;
        for (const pattern of ignorePatterns) {
            text = text.replaceAll(pattern, IGNORED);
        }

        const expected = titleCase(text);
        if (expected !== text) triggerError(` - Expected "${expected}", but got "${originalText}"`);
    }

    if (failed) throw new Error("Please fix the above issues!");
}

export async function lintMarkdownTitles({ project }: LinterContext) {
    logLintStart("lint-markdown-titles");
    const configPatterns = project.monoLint?.lintMarkdownTitles?.ignorePatterns?.map((v) => new RegExp(v, "gi"));
    const ignorePatterns = [project.name!, ...(configPatterns ?? [])];
    const results = await Promise.allSettled(getFilesToLint(".md").map((file) => checkFile(file, ignorePatterns)));
    if (results.some(({ status }) => status !== "fulfilled")) {
        throw new Error("Some markdown files have invalid titles");
    }

    return true;
}
