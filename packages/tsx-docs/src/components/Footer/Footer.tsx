import { ComponentThis } from "tsx-dom-ssr";

import { withCss } from "../../utils/withCss";
import classes from "./Footer.module.scss";

export const Footer = withCss(classes, function Footer(this: ComponentThis) {
    return (
        <footer class={classes.footer}>
            {this.currentPage.frontMatter.footer?.map((text) =>
                text.includes("|") ? (
                    <a href={text.split("|")[1].trim()}>{text.split("|")[0].trim()}</a>
                ) : (
                    <span>{text}</span>
                )
            )}
            <span>
                Powered by <a href="https://github.com/lusito/tsx-dom">tsx-docs</a>
            </span>
        </footer>
    );
});
