import { withCss } from "../../utils/withCss";
import classes from "./Banner.module.scss";

export const Banner = withCss(classes, function Header() {
    const { title } = this.currentPage.meta;

    return (
        <div class={classes.banner}>
            <h1>{title}</h1>
        </div>
    );
});
