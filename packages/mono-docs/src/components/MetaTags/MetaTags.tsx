import { ComponentThis } from "tsx-dom-ssr";

type MetaTagsProps = {
    title: string;
};

export function MetaTags(this: ComponentThis, { title }: MetaTagsProps) {
    const { docsConfig, path } = this.currentPage;
    const { siteName, keywords, description } = docsConfig;

    return (
        <>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords.join(", ")} />}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:locale" content="en_US" />
            <meta property="og:url" content={`${this.targetUrl}${path}`} />
        </>
    );
}
