import { BaseProps } from "tsx-dom-ssr";

import { withCss } from "../../utils/withCss";
import classes from "./Container.module.scss";

export const Container = withCss(classes, ({ children }: BaseProps) => <div class={classes.container}>{children}</div>);
