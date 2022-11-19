import { createCopyAsset, createImageHandler, createMarkdownHandler, createScssHandler } from "@lusito/require-libs";
import MarkdownIt from "markdown-it";
import { addHook } from "pirates";
import slugify from "slug";

import { FrontMatter } from "./utils/types";
import { createElement } from "./utils/fakeDocument";
import { isTruthy } from "./utils/filterUtils";

export async function setupPirates(assetDir: string, siteUrl: string, devMode: boolean) {
    const copyAsset = createCopyAsset(assetDir, `${siteUrl}/assets/`);

    // Images
    const imageHandler = createImageHandler({ copyAsset });
    addHook((_, filename) => imageHandler(filename), {
        exts: [".png", ".webp", ".jpg", ".jpeg", ".gif", ".svg"],
        ignoreNodeModules: false,
    });

    // SCSS Modules
    const scssHandler = createScssHandler({
        style: devMode ? "expanded" : "compressed",
        mapFileUrl: copyAsset,
    });

    addHook(scssHandler, { exts: [".css", ".scss"], ignoreNodeModules: false });

    // Markdown
    const { enhancedCopyButton } = (await import("./components/MarkdownContent/MarkdownContent.module.scss")).default;
    const markdownHandler = createMarkdownHandler({
        copyAsset,
        createElement,
        postProcess({ frontMatter, dom }) {
            const fm = frontMatter as FrontMatter;
            fm.subHeadings = Array.from(dom.querySelectorAll("h2"))
                .map((h) => {
                    if (h.textContent) {
                        h.id = slugify(h.textContent);
                        return { id: h.id, text: h.textContent };
                    }
                    return null;
                })
                .filter(isTruthy);

            if (fm.title === undefined) {
                const heading = dom.querySelector("h1");
                fm.title = heading?.textContent ?? "Unknown";
            }
            fm.textContent = dom.textContent ?? "";
        },
        setup(md) {
            md.use(copyButtonPlugin(enhancedCopyButton));
        },
    });

    addHook(markdownHandler, { exts: [".md"], ignoreNodeModules: false });
}

function copyButtonPlugin(enhancedClass: string) {
    return (md: MarkdownIt) => {
        for (const rule of ["code_block", "fence"]) {
            const original = md.renderer.rules[rule];
            if (original) {
                md.renderer.rules[rule] = (...args) => {
                    const [tokens, idx] = args;
                    const { content } = tokens[idx];
                    const html = original(...args);

                    if (content.length === 0) return html;

                    const title = "Copy the code snippet to the clipboard";
                    const el = createElement("code-copy-button");
                    el.setAttribute("role", "button");
                    el.setAttribute("code", content.trimEnd());
                    el.setAttribute("title", title);
                    el.setAttribute("aria-label", title);
                    el.setAttribute("enhancedClass", enhancedClass);

                    return html.replace("</pre>", () => `${el.outerHTML}</pre>`);
                };
            }
        }
    };
}
