import { ComponentThis } from "tsx-dom-ssr";

import { withCss } from "../../utils/withCss";
import { Search } from "../Search/Search";
import classes from "./Header.module.scss";

export const Header = withCss(classes, function Header(this: ComponentThis) {
    const { siteUrl } = this;

    return (
        <header class={classes.header}>
            <div class={classes.left}>
                <a href={`${siteUrl}${this.pages[0].path}`}>{this.currentPage.frontMatter.siteName}</a>
            </div>
            <div class={classes.right}>
                <Search />
                <div class={classes.links}>
                    {this.currentPage.frontMatter.links.map((link) => (
                        <a href={link.split("|")[1].trim()}>{link.split("|")[0].trim()}</a>
                    ))}
                </div>
            </div>
        </header>
    );
});
