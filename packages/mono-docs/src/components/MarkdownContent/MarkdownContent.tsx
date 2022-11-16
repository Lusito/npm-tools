import { withCss } from "../../utils/withCss";
import classes from "./MarkdownContent.module.scss";

type MarkdownContentProps = {
    html: string;
};

export const MarkdownContent = withCss(classes, ({ html }: MarkdownContentProps) => (
    <div class={classes.markdownContent} dangerouslySetInnerHTML={html} />
));
