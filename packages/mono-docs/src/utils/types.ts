import { CssModule } from "@lusito/require-libs";

export type PageMeta = {
    title: string;
    textContent: string;
    subHeadings: Array<{ id: string; text: string }>;
};

export type BuildOptions = {
    out: string;
    siteUrl: string;
    static?: Record<string, string>;
};

export type DocsConfig = {
    docs?: string;
    title?: string;
    description?: string;
    footer?: string[];
    keywords?: string[];
    links?: string[];
    sidebar?: string[];
    adjustPaths?: string[];
    buildOptions?: BuildOptions;
};

export type RootDocsConfig = DocsConfig & {
    siteName?: string;
    projects?: string[];
};

export type CombinedDocsConfig = Required<Omit<RootDocsConfig, "buildOptions">>;

export type PageInfo = {
    dir: string;
    file: string;
    depth: number;
    key: string;
    docsConfig: CombinedDocsConfig;
    meta: PageMeta;
    path: string;
    body: string;
    projectIndex?: PageInfo;
};

export type SiteInfo = {
    keywords: string[];
    name: string;
    url: string;
    copyright: string;
    description: string;
};

export type SearchEntry = {
    url: string;
    title: string;
    content: string;
    projectIndex?: {
        url: string;
        title: string;
    };
};

export type RenderContext = {
    readonly devMode: boolean;
    readonly currentPage: PageInfo;
    readonly pages: PageInfo[];
    readonly targetUrl: string;
    readonly siteUrl: string;
};

// Extend ComponentThis
declare module "tsx-dom-ssr" {
    export interface ComponentThis extends RenderContext {
        readonly cssModules: CssModule[];
    }
}
