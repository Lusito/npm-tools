import { withCss } from "../../utils/withCss";
import { SideBarMenu } from "../SideBarMenu/SideBarMenu";
import classes from "./SideBar.module.scss";

export const SideBar = withCss(classes, function SideBar() {
    return (
        <>
            <div class={`${classes.sideBar} scatman-container`}>
                <div class={classes.content}>
                    <div class={classes.links}>
                        {this.currentPage.frontMatter.links.map((link) => (
                            <a href={link.split("|")[1].trim()}>{link.split("|")[0].trim()}</a>
                        ))}
                    </div>
                    <SideBarMenu />
                </div>
                <div class={classes.trigger}>
                    <div />
                    <div />
                    <div />
                </div>
            </div>
            <div class={classes.sideBarOverlay} />
        </>
    );
});
