import { ComponentThis } from "tsx-dom-ssr";

export function MetaTags(this: ComponentThis) {
    const { frontMatter, path } = this.currentPage;
    const { siteName, keywords, description, siteUrl, title } = frontMatter;

    return (
        <>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords.join(", ")} />}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:locale" content="en_US" />
            <meta property="og:url" content={`${siteUrl}${path}`} />
        </>
    );
}
