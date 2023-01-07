import classnames from "classnames";

import { withCss } from "../../utils/withCss";
import { Search } from "../Search/Search";
import classes from "./Header.module.scss";

type HeaderProps = {
    withSideBar: boolean;
};

export const Header = withCss(classes, function Header({ withSideBar }: HeaderProps) {
    const { siteUrl } = this;

    return (
        <header class={classnames({ [classes.header]: true, [classes.withSideBar]: withSideBar })}>
            <div class={classes.left}>
                <a href={`${siteUrl}${this.pages[0].path}`}>{this.currentPage.docsConfig.siteName}</a>
            </div>
            <div class={classes.right}>
                <Search />
                <div class={classes.links}>
                    {this.currentPage.docsConfig.links.map((link) => (
                        <a href={link.split("|")[1].trim()}>{link.split("|")[0].trim()}</a>
                    ))}
                </div>
            </div>
        </header>
    );
});
