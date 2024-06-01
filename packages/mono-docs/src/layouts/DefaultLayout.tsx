import { BaseProps } from "tsx-dom-ssr";

import { Footer } from "../components/Footer/Footer";
import { Header } from "../components/Header/Header";
import { withCss } from "../utils/withCss";
import classes from "./DefaultLayout.module.scss";
import { ReloadScript } from "../utils/ReloadScript";
import { SideBar } from "../components/SideBar/SideBar";
import { MetaTags } from "../components/MetaTags/MetaTags";
import { getPageTitle } from "../utils/pageUtils";

export const DefaultLayout = withCss(classes, function DefaultLayout({ children }: BaseProps) {
    const { targetUrl, currentPage } = this;
    const { docsConfig } = currentPage;
    const { siteName, sidebar } = docsConfig;
    const title = getPageTitle(currentPage);
    const finalTitle = !title || title === siteName ? siteName : `${title} - ${siteName}`;

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="apple-touch-icon" sizes="180x180" href={`${targetUrl}/assets/apple-touch-icon.png`} />
                <link rel="icon" type="image/png" sizes="32x32" href={`${targetUrl}/assets/favicon-32x32.png`} />
                <link rel="icon" type="image/png" sizes="16x16" href={`${targetUrl}/assets/favicon-16x16.png`} />
                <link rel="shortcut icon" href={`${targetUrl}/assets/favicon.ico`} />
                <base href="/" />
                <title>{finalTitle}</title>
                <MetaTags title={title} />
                <ReloadScript />
                <script src={`${targetUrl}/assets/custom-elements.js`} defer />
            </head>
            <body>
                <Header withSideBar={sidebar.length > 0} />
                {sidebar.length > 0 && <SideBar />}
                <div class={`${classes.mainwrapper} scatman-container scatman-scroll-area`}>
                    <main>{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
});
