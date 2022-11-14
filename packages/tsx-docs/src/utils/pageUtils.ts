import { basename, dirname, join, relative, resolve } from "path";
import slugify from "slug";
import { MarkdownModule } from "@lusito/require-libs";

import { getAllFiles } from "./fileUtils";
import { CombinedFrontMatter, PageInfo } from "./types";
import { applyAdjustPaths } from "./adjustPaths";

function slugFromFilename(filename: string) {
    const slug = slugify(basename(filename, ".md"));

    return slug === "readme" ? "index" : slug;
}

function getParentFrontMatter(key: string, byKey: Record<string, PageInfo>) {
    const parts = key.split("/");

    if (parts.length > 1) {
        parts.pop();
        const parentKey = parts.join("/");
        return byKey[parentKey]?.frontMatter;
    }

    return undefined;
}

async function loadPage(rootPath: string, file: string): Promise<PageInfo> {
    const data: MarkdownModule = await import(relative(__dirname, file));

    const relativePath = relative(rootPath, file);
    const dir = dirname(relativePath);
    const pathPrefix = dir === "." ? "" : `/${dir.replaceAll("\\", "/")}`;
    const slug = slugFromFilename(relativePath);

    const key = slug === "index" ? pathPrefix : `${pathPrefix}/${slug}`;
    return {
        dir,
        file,
        depth: key.split("/").length,
        key,
        frontMatter: data.frontMatter as CombinedFrontMatter,
        path: `${pathPrefix}/${slug}.html`,
        body: data.html,
    };
}

export async function getDocsPages(rootPath: string, docsPath: string, parentFrontMatter: CombinedFrontMatter) {
    const byKey: Record<string, PageInfo> = {};

    const files = await getAllFiles(docsPath, /\.md$/, []);
    const pages = await Promise.all(
        files.map(async (file) => {
            const pageInfo = await loadPage(rootPath, file);

            byKey[pageInfo.key] = pageInfo;

            return pageInfo;
        })
    );
    pages.sort((a, b) => a.depth - b.depth);

    for (const page of pages) {
        adjustFrontMatter(rootPath, page, getParentFrontMatter(page.key, byKey) ?? parentFrontMatter);
    }

    return pages;
}

export async function getProjectPages(rootPath: string, project: string, rootFrontMatter: CombinedFrontMatter) {
    const projectPath = dirname(project);
    const indexPage = await loadPage(rootPath, project);
    adjustFrontMatter(rootPath, indexPage, rootFrontMatter);
    indexPage.projectIndex = indexPage;

    const pages = await getDocsPages(rootPath, resolve(projectPath, indexPage.frontMatter.docs), indexPage.frontMatter);

    for (const page of pages) {
        page.projectIndex = indexPage;
    }

    return [indexPage, ...pages];
}

const defaultFrontMatter: CombinedFrontMatter = {
    siteName: "Unnamed Documentation",
    description: "",
    siteUrl: "",
    footer: [],
    keywords: [],
    links: [],
    projects: [],
    sidebar: [],
    title: "",
    subHeadings: [],
    adjustPaths: [],
    textContent: "",
    docs: "docs",
};

function adjustFrontMatter(rootPath: string, page: PageInfo, baseFrontMatter: CombinedFrontMatter) {
    page.path = applyAdjustPaths(page.path, baseFrontMatter.adjustPaths);
    const { sidebar, projects } = page.frontMatter;
    page.frontMatter = {
        ...baseFrontMatter,
        ...page.frontMatter,
    };

    const { dir, frontMatter } = page;
    const basePath = resolve(rootPath, dir);
    const docsPath = resolve(basePath, frontMatter.docs);
    if (sidebar) {
        for (let i = 0; i < sidebar.length; i++) {
            sidebar[i] = join(docsPath, `${sidebar[i]}.md`);
        }
        sidebar.unshift(page.file);
        frontMatter.sidebar = sidebar;
    }

    if (projects) {
        for (let i = 0; i < projects.length; i++) {
            projects[i] = join(rootPath, `${projects[i]}/README.md`);
        }
        frontMatter.projects = projects;
    }
}

export async function getPages(rootPath: string): Promise<PageInfo[]> {
    const rootPage = await loadPage(rootPath, resolve(rootPath, "README.md"));
    adjustFrontMatter(rootPath, rootPage, defaultFrontMatter);

    // Monorepo setup
    if (rootPage.frontMatter.projects.length) {
        const subPages = await Promise.all(
            rootPage.frontMatter.projects.map((project) => getProjectPages(rootPath, project, rootPage.frontMatter))
        );

        return [rootPage, ...subPages.flat()];
    }

    // Non-monorepo setup
    const pages = await getDocsPages(rootPath, resolve(rootPath, rootPage.frontMatter.docs), rootPage.frontMatter);

    return [rootPage, ...pages];
}
