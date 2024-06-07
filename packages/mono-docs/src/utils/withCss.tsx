import { CssModule } from "@lusito/require-libs";
import { FC } from "tsx-dom-ssr";

export function withCss<T>(cssModule: CssModule, factory: FC<T>): FC<T> {
    return function WithCss(props) {
        if (!this.cssModules.includes(cssModule)) {
            this.cssModules.push(cssModule);
        }
        return factory.call(this, props);
    };
}
