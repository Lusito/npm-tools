import classnames from "classnames";
import { ComponentThis } from "tsx-dom-ssr";

import { isTruthy } from "../../utils/filterUtils";
import { withCss } from "../../utils/withCss";
import classes from "./SideBarMenu.module.scss";

type NavItemProps = {
    label: string;
    ariaLabel?: string;
    path: string;
    nested?: boolean;
};

function NavItem(this: ComponentThis, { label, ariaLabel, path, nested }: NavItemProps) {
    const isCurrent = path === this.currentPage.path;
    return (
        <li class={classnames({ [classes.selected]: isCurrent, [classes.nested]: nested })}>
            {isCurrent ? (
                <a href={path} aria-label={`Current page, ${ariaLabel ?? label}`} aria-current="page">
                    {label}
                </a>
            ) : (
                <a href={path} aria-label={ariaLabel}>
                    {label}
                </a>
            )}
        </li>
    );
}

export const SideBarMenu = withCss(classes, function SideBarMenu() {
    const { projectIndex, frontMatter } = this.currentPage;
    const { sidebar, projects } = frontMatter;
    const { pages } = this;

    const findPage = (file: string) => pages.find((p) => p.file === file);

    return (
        <nav role="navigation" aria-label="Main Menu">
            <ul class={classes.sideBarMenu}>
                <li class={classes.projectSelector}>
                    <link-select tsxTag="select" autoComplete="off">
                        {projects
                            .map(findPage)
                            .filter(isTruthy)
                            .map((page) => (
                                <option value={page.path} selected={page.projectIndex === projectIndex}>
                                    Project: {page.frontMatter.title}
                                </option>
                            ))}
                    </link-select>
                </li>
                {sidebar
                    .map(findPage)
                    .filter(isTruthy)
                    .map((page) => (
                        <>
                            <NavItem
                                path={page.path}
                                label={page.file.endsWith("README.md") ? "Readme" : page.frontMatter.title}
                            />
                            {!page.file.endsWith("README.md") &&
                                page.frontMatter.subHeadings.map(({ id, text }) => (
                                    <NavItem path={`${page.path}#${id}`} label={text} nested />
                                ))}
                        </>
                    ))}
            </ul>
        </nav>
    );
});
