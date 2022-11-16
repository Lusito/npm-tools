import { CssModule } from "@lusito/require-libs";

export type FrontMatter = {
    docs?: string;
    title?: string;
    textContent?: string;
    subHeadings?: Array<{ id: string; text: string }>;
    description?: string;
    footer?: string[];
    keywords?: string[];
    links?: string[];
    sidebar?: string[];
    adjustPaths?: string[];
};

export type RootPageFrontMatter = FrontMatter & {
    siteName?: string;
    projects?: string[];
};

export type CombinedFrontMatter = Required<RootPageFrontMatter>;

export type PageInfo = {
    dir: string;
    file: string;
    depth: number;
    key: string;
    frontMatter: CombinedFrontMatter;
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
    readonly siteUrl: string;
};

// Extend ComponentThis
declare module "tsx-dom-ssr" {
    export interface ComponentThis extends RenderContext {
        readonly cssModules: CssModule[];
    }
}
