import { BaseProps } from "tsx-dom-ssr";

import { Footer } from "../components/Footer/Footer";
import { Header } from "../components/Header/Header";
import { withCss } from "../utils/withCss";
import classes from "./DefaultLayout.module.scss";
import { ReloadScript } from "../utils/ReloadScript";
import { SideBar } from "../components/SideBar/SideBar";
import { MetaTags } from "../components/MetaTags/MetaTags";

export const DefaultLayout = withCss(classes, function DefaultLayout({ children }: BaseProps) {
    const { siteName, title, sidebar } = this.currentPage.frontMatter;

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
                <link rel="shortcut icon" href="/assets/favicon.ico" />
                <base href="/" />
                <title>{title ? `${title} - ${siteName}` : siteName}</title>
                <MetaTags />
                <ReloadScript />
                <script src={`${this.siteUrl}/assets/custom-elements.js`} defer />
            </head>
            <body>
                <Header />
                {sidebar.length > 0 && <SideBar />}
                <div class={`${classes.mainwrapper} scatman-container scatman-scroll-area`}>
                    <main>{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
});
