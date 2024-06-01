/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { addAbortSignal, ComponentChildren, toDom } from "tsx-dom-ssr";
import { domHelmet } from "dom-helmet";
import imageSize from "image-size";
import type { ISizeCalculationResult } from "image-size/dist/types/interface";
import { join, resolve } from "path";

import { fakeDocument } from "./fakeDocument";
import globalCss from "../style/global.scss";
import highlightCss from "../style/highlight.scss";
import { RenderContext } from "./types";
import { applyAdjustPaths } from "./adjustPaths";
import markdownClasses from "../components/MarkdownContent/MarkdownContent.module.scss";

const protocolPattern = /^https?:\/\//;

const imageSizes: Record<string, ISizeCalculationResult> = {};
function cachedImageSize(assetPath: string) {
    let result = imageSizes[assetPath];
    if (!result) {
        result = imageSize(assetPath);
        imageSizes[assetPath] = result;
    }
    return result;
}

function adjustHref(href: string, targetUrl: string, dir: string, adjustPaths: string[]) {
    let newHref = href.replace(/\/README\.md$/, "/").replace(/\.md$/, ".html");

    if (!newHref.startsWith("./")) newHref = `./${newHref}`;
    newHref = join("/", dir, newHref);

    newHref = applyAdjustPaths(newHref, adjustPaths);

    return `${targetUrl}${newHref}`;
}

export async function renderHTML(renderContext: RenderContext, children: ComponentChildren, dest: string) {
    const cssModules = [globalCss];
    const abortController = new AbortController();

    let dom: DocumentFragment;
    try {
        dom = await toDom(fakeDocument, children, addAbortSignal({ ...renderContext, cssModules }, abortController));
    } catch (e) {
        if (!abortController.signal.aborted) abortController.abort();
        throw e;
    }

    // Since the dom might be a fragment or just a text node, we need a wrapper to render it
    const wrapper = fakeDocument.createElement("div");
    wrapper.appendChild(dom);

    if (
        wrapper.childNodes.length !== 1 ||
        wrapper.childNodes[0].nodeType !== 1 ||
        (wrapper.childNodes[0] as Element).tagName !== "HTML"
    ) {
        throw new Error("Expected one html node at the root level");
    }

    const head = wrapper.querySelector("html > head") as HTMLHeadElement;
    domHelmet({
        html: wrapper.querySelector("html")!,
        head,
        body: wrapper.querySelector("html > body")!,
    });

    if (wrapper.querySelector("code.hljs")) {
        cssModules.push(highlightCss);
    }

    for (const cssModule of cssModules) {
        const style = fakeDocument.createElement("style");
        // eslint-disable-next-line no-underscore-dangle
        style.innerHTML = cssModule.__CSS;
        head.appendChild(style);
    }

    const { siteUrl, targetUrl, currentPage, devMode } = renderContext;
    const { dir, docsConfig } = currentPage;
    const { adjustPaths } = docsConfig;
    wrapper.querySelectorAll("a").forEach((link) => {
        let href = link.getAttribute("href");

        if (href) {
            // In dev-mode, replace siteUrls with local ones
            if (devMode && href.startsWith(siteUrl)) {
                href = href.replace(siteUrl, targetUrl);
                link.setAttribute("href", href);
            }

            if (protocolPattern.test(href)) {
                if (!href.startsWith(targetUrl)) {
                    const rel = link.getAttribute("rel");
                    if (!rel) {
                        link.setAttribute("rel", "noopener nofollow");
                    }

                    const target = link.getAttribute("target");
                    if (!target) {
                        link.setAttribute("target", "_blank");
                    }
                }
            } else if (href.endsWith(".md")) {
                link.setAttribute("href", adjustHref(href, targetUrl, dir, adjustPaths));
            } else if (href.endsWith(".html")) {
                link.setAttribute("href", href.replace(/\/index\.html$/, "/"));
            }
        }
    });

    // Add width/height attributes to all img tags, which don't have it yet
    wrapper.querySelectorAll("img").forEach((img) => {
        if (!img.hasAttribute("width") && !img.hasAttribute("height") && img.src.startsWith("/assets/")) {
            const { width, height } = cachedImageSize(resolve(dest, img.src.replace(/^\//, "")));
            if (width && height) {
                img.setAttribute("width", width.toString());
                img.setAttribute("height", height.toString());

                if (width >= 800) {
                    img.classList.add(markdownClasses.largeImage);
                }
            }
        }
    });

    return `<!DOCTYPE html>${wrapper.innerHTML}`;
}
