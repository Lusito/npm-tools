import { dirname, resolve } from "path";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import frontMatter from "front-matter";

export type MarkdownModule = {
    html: string;
    frontMatter: unknown;
    meta: Record<string, unknown>;
};

export type MarkdownPostProcessData = {
    filename: string;
    dir: string;
    frontMatter: unknown;
    dom: HTMLElement;
};

export type MarkdownCompilerOptions = {
    copyAsset(filename: string): string;
    createElement: typeof document.createElement;
    postProcess(data: MarkdownPostProcessData): Record<string, unknown> | undefined;
    setup?(md: MarkdownIt): void;
};

const protocolPattern = /^https?:\/\//;

export function createMarkdownCompiler({ copyAsset, createElement, postProcess, setup }: MarkdownCompilerOptions) {
    const md: MarkdownIt = new MarkdownIt({
        linkify: true,
        html: true,
        highlight(str, lang) {
            let code: string | undefined;
            if (lang && hljs.getLanguage(lang)) {
                try {
                    code = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
                } catch (e) {
                    console.error("Failed highlighting", e);
                }
            }

            return `<pre><code class="hljs">${code ?? md.utils.escapeHtml(str)}</code></pre>`;
        },
    });
    setup?.(md);

    return (code: string, filename: string): MarkdownModule => {
        const dir = dirname(filename);
        const dom = createElement("div");
        const result = frontMatter(code);

        dom.innerHTML = md.render(result.body);
        dom.querySelectorAll("img").forEach((img) => {
            if (!protocolPattern.test(img.src)) {
                img.src = copyAsset(resolve(dir, img.src));
            }
        });

        const meta = postProcess({
            filename,
            dir,
            dom,
            frontMatter: result.attributes,
        });

        return {
            html: dom.innerHTML,
            meta: meta ?? {},
            frontMatter: result.attributes,
        };
    };
}

export function createMarkdownHandler(options: MarkdownCompilerOptions) {
    const compile = createMarkdownCompiler(options);

    return (code: string, filename: string): string => `module.exports = ${JSON.stringify(compile(code, filename))}`;
}
