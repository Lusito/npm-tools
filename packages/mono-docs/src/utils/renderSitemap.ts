import { PageInfo } from "./types";

export type SiteMapConfig = {
    pages: PageInfo[];
    siteUrl: string;
};

export function renderSitemap({ pages, siteUrl }: SiteMapConfig) {
    const paths: string[] = ["/", "/all.html", ...pages.map((p) => p.path.replace(/\/index\.html$/, "/"))];
    const urls = paths.map((loc) => `<url><loc>${siteUrl}${loc}</loc></url>`);

    return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    ${urls.join("\n    ")}
</urlset>`;
}
