import fs from "fs";
import { basename, dirname, resolve } from "path";
import { ComponentChildren } from "tsx-dom-ssr";

import { NotFoundPage } from "./pages/NotFoundPage";
import { getAllFiles } from "./utils/fileUtils";
import { ListAllPage } from "./pages/ListAllPage";
import { MarkdownPage } from "./pages/MarkdownPage";
import { getPages } from "./utils/pageUtils";
import { renderHTML } from "./utils/renderHTML";
import { renderSitemap, SiteMapConfig } from "./utils/renderSitemap";
import { PageInfo, RenderContext, SearchEntry } from "./utils/types";

type GenerateConfig = {
    src: string;
    dest: string;
    devMode: boolean;
    siteUrl: string;
};

async function writeSitemap(config: SiteMapConfig, dest: string) {
    const xml = renderSitemap(config);
    await fs.promises.writeFile(`${dest}/sitemap.xml`, xml);
}

async function writeSearchData(pages: PageInfo[], dest: string, siteUrl: string) {
    const data: SearchEntry[] = pages.map((p) => ({
        url: `${siteUrl}${p.path.replace(/\/index\.html$/, "/")}`,
        content: p.frontMatter.textContent,
        title: p.frontMatter.title || p.frontMatter.siteName,
        projectIndex: p.projectIndex
            ? {
                  title: p.projectIndex.frontMatter.title || p.projectIndex.frontMatter.siteName,
                  url: `${siteUrl}${p.projectIndex.path.replace(/\/index\.html$/, "/")}`,
              }
            : undefined,
    }));

    await fs.promises.writeFile(`${dest}/search-data.json`, JSON.stringify(data));
}

async function writeHTML(renderContext: RenderContext, children: ComponentChildren, dest: string) {
    const html = await renderHTML(renderContext, children, dest);

    const fullPath = resolve(dest, renderContext.currentPage.path.substring(1));
    await createHTMLPath(dirname(fullPath));
    await fs.promises.writeFile(fullPath, html);
}

async function createHTMLPath(fullPath: string) {
    if (!fs.existsSync(fullPath)) await fs.promises.mkdir(fullPath, { recursive: true });
}

async function copyAssets(config: GenerateConfig) {
    const files = await getAllFiles(resolve(__dirname, "assets"), /(?<!\.gitkeep)$/, []);
    await createHTMLPath(resolve(config.dest, "assets"));
    await Promise.all(
        files.map((file) => {
            const target = `${config.dest}/assets/${basename(file)}`;
            return fs.promises.copyFile(file, target);
        })
    );

    if (
        config.devMode &&
        !files.find((v) => basename(v) === "custom-elements.js") &&
        fs.existsSync("./dist/assets/custom-elements.js")
    ) {
        const target = `${config.dest}/assets/custom-elements.js`;
        await fs.promises.copyFile("./dist/assets/custom-elements.js", target);
    }
}

function buildPageInfo(slug: string, title: string, description: string, indexPage: PageInfo): PageInfo {
    return {
        dir: ".",
        file: "",
        key: `/${slug}`,
        path: `/${slug}.html`,
        body: "",
        depth: 1,
        frontMatter: {
            ...indexPage.frontMatter,
            title,
            description,
        },
    };
}

export async function createFiles(config: GenerateConfig) {
    const pages = await getPages(config.src);
    const indexPage = pages[0];

    const partialContext: Omit<RenderContext, "currentPage"> = {
        pages,
        devMode: config.devMode,
        siteUrl: config.siteUrl,
    };

    const notFoundPage = buildPageInfo("404", "404", "File Not Found", indexPage);
    const allPagesPage = buildPageInfo("all-pages", "All Pages", "All pages on this site.", indexPage);

    await Promise.all([
        copyAssets(config),
        writeHTML({ ...partialContext, currentPage: notFoundPage }, <NotFoundPage />, config.dest),
        writeHTML({ ...partialContext, currentPage: allPagesPage }, <ListAllPage />, config.dest),
        ...pages.map((currentPage) => writeHTML({ ...partialContext, currentPage }, <MarkdownPage />, config.dest)),
        writeSitemap({ pages, siteUrl: config.siteUrl }, config.dest),
        writeSearchData(pages, config.dest, config.siteUrl),
    ]);

    console.log("Done");
}
