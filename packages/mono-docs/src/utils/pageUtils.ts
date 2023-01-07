import { basename, dirname, relative, resolve } from "path";
import slugify from "slug";
import { MarkdownModule } from "@lusito/require-libs";

import { getAllFiles } from "./fileUtils";
import { CombinedDocsConfig, PageInfo, PageMeta } from "./types";
import { applyAdjustPaths } from "./adjustPaths";
import { ConfigGetter } from "./configUtils";

function slugFromFilename(filename: string) {
    const slug = slugify(basename(filename, ".md"));

    return slug === "readme" ? "index" : slug;
}

async function loadPage(rootPath: string, file: string, getConfig: ConfigGetter): Promise<PageInfo> {
    const data: MarkdownModule = await import(relative(__dirname, file));

    const relativePath = relative(rootPath, file);
    const dir = dirname(relativePath);
    const pathPrefix = dir === "." ? "" : `/${dir.replaceAll("\\", "/")}`;
    const slug = slugFromFilename(relativePath);

    const key = slug === "index" ? pathPrefix : `${pathPrefix}/${slug}`;

    const docsConfig = getConfig(dir);

    return {
        dir,
        file,
        depth: key.split("/").length,
        key,
        meta: data.meta as PageMeta,
        docsConfig,
        path: applyAdjustPaths(`${pathPrefix}/${slug}.html`, docsConfig.adjustPaths),
        body: data.html,
    };
}

async function getDocsPages(rootPath: string, docsPath: string, getConfig: ConfigGetter) {
    const files = await getAllFiles(docsPath, /\.md$/, []);
    const pages = await Promise.all(files.map((file) => loadPage(rootPath, file, getConfig)));
    pages.sort((a, b) => a.depth - b.depth);

    return pages;
}

async function getProjectPages(rootPath: string, project: string, getConfig: ConfigGetter) {
    const projectPath = dirname(project);
    const indexPage = await loadPage(rootPath, project, getConfig);
    indexPage.projectIndex = indexPage;

    const projectConfig = getConfig(relative(rootPath, projectPath));

    const pages = await getDocsPages(rootPath, projectConfig.docs, getConfig);

    for (const page of pages) {
        page.projectIndex = indexPage;
    }

    return [indexPage, ...pages];
}

export async function getPages(
    rootPath: string,
    rootConfig: CombinedDocsConfig,
    getConfig: ConfigGetter
): Promise<PageInfo[]> {
    const rootPage = await loadPage(rootPath, resolve(rootPath, "README.md"), getConfig);

    // Monorepo setup
    if (rootConfig.projects.length) {
        const subPages = await Promise.all(
            rootConfig.projects.map((project) => getProjectPages(rootPath, project, getConfig))
        );

        return [rootPage, ...subPages.flat()];
    }

    // Non-monorepo setup
    const pages = await getDocsPages(rootPath, rootConfig.docs, getConfig);
    rootPage.projectIndex = rootPage;

    return [rootPage, ...pages];
}

export const getPageTitle = (currentPage: PageInfo) => {
    const { docsConfig, projectIndex, meta } = currentPage;
    const title = projectIndex === currentPage ? docsConfig.title || meta.title : meta.title || docsConfig.title;
    return title || docsConfig.siteName;
};
