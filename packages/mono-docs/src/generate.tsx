import { copyFile, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { basename, dirname, resolve } from "path";
import { ComponentChildren } from "tsx-dom-ssr";

import { NotFoundPage } from "./pages/NotFoundPage";
import { getAllFiles } from "./utils/fileUtils";
import { ListAllPage } from "./pages/ListAllPage";
import { MarkdownPage } from "./pages/MarkdownPage";
import { getPages, getPageTitle } from "./utils/pageUtils";
import { renderHTML } from "./utils/renderHTML";
import { renderSitemap, SiteMapConfig } from "./utils/renderSitemap";
import { CombinedDocsConfig, PageInfo, RenderContext, SearchEntry } from "./utils/types";
import { loadConfigs } from "./utils/configUtils";

type GenerateConfig = {
    src: string;
    dest: string;
    devMode: boolean;
    targetUrl: string;
    siteUrl: string;
};

async function writeSitemap(config: SiteMapConfig, dest: string) {
    const xml = renderSitemap(config);
    await writeFile(`${dest}/sitemap.xml`, xml);
}

async function writeSearchData(pages: PageInfo[], dest: string, targetUrl: string) {
    const data: SearchEntry[] = pages.map((p) => ({
        url: `${targetUrl}${p.path.replace(/\/index\.html$/, "/")}`,
        content: p.meta.textContent,
        title: getPageTitle(p, false),
        projectIndex: p.projectIndex
            ? {
                  title: getPageTitle(p.projectIndex, false),
                  url: `${targetUrl}${p.projectIndex.path.replace(/\/index\.html$/, "/")}`,
              }
            : undefined,
    }));

    await writeFile(`${dest}/search-data.json`, JSON.stringify(data));
}

async function writeHTML(renderContext: RenderContext, children: ComponentChildren, dest: string) {
    const html = await renderHTML(renderContext, children, dest);

    const fullPath = resolve(dest, renderContext.currentPage.path.substring(1));
    await createHTMLPath(dirname(fullPath));
    await writeFile(fullPath, html);
}

async function createHTMLPath(fullPath: string) {
    if (!existsSync(fullPath)) await mkdir(fullPath, { recursive: true });
}

async function copyAssets(config: GenerateConfig) {
    const files = await getAllFiles(resolve(__dirname, "assets"), /(?<!\.gitkeep)$/, []);
    await createHTMLPath(resolve(config.dest, "assets"));
    await Promise.all(
        files.map((file) => {
            const target = `${config.dest}/assets/${basename(file)}`;
            return copyFile(file, target);
        }),
    );

    if (
        config.devMode &&
        !files.find((v) => basename(v) === "custom-elements.js") &&
        existsSync("./dist/assets/custom-elements.js")
    ) {
        const target = `${config.dest}/assets/custom-elements.js`;
        await copyFile("./dist/assets/custom-elements.js", target);
    }
}

function buildPageInfo(slug: string, title: string, description: string, rootConfig: CombinedDocsConfig): PageInfo {
    return {
        dir: ".",
        file: "",
        key: `/${slug}`,
        path: `/${slug}.html`,
        body: "",
        depth: 1,
        docsConfig: {
            ...rootConfig,
            title,
            description,
        },
        meta: {
            title,
            textContent: "",
            subHeadings: [],
        },
    };
}

export async function createFiles(config: GenerateConfig) {
    const { rootConfig, getConfig } = await loadConfigs(config.src);
    const pages = await getPages(config.src, rootConfig, getConfig);

    const partialContext: Omit<RenderContext, "currentPage"> = {
        pages,
        devMode: config.devMode,
        siteUrl: config.siteUrl,
        targetUrl: config.targetUrl,
    };

    const notFoundPage = buildPageInfo("404", "404", "File Not Found", rootConfig);
    const allPagesPage = buildPageInfo("all-pages", "All Pages", "All pages on this site.", rootConfig);

    await Promise.all([
        copyAssets(config),
        writeHTML({ ...partialContext, currentPage: notFoundPage }, <NotFoundPage />, config.dest),
        writeHTML({ ...partialContext, currentPage: allPagesPage }, <ListAllPage />, config.dest),
        ...pages.map((currentPage) => writeHTML({ ...partialContext, currentPage }, <MarkdownPage />, config.dest)),
        writeSitemap({ pages, targetUrl: config.targetUrl }, config.dest),
        writeSearchData(pages, config.dest, config.targetUrl),
    ]);

    console.log("Done");
}
