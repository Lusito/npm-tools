import "./scatman";
/* eslint-disable import/no-duplicates */
import "./elements/CodeCopyButton";
import "./elements/SearchContainer";
import "./elements/LinkSelect";

import { CodeCopyButtonProps } from "./elements/CodeCopyButton";
import { SearchContainerProps } from "./elements/SearchContainer";
import { LinkSelectProps } from "./elements/LinkSelect";

type ExtendProps<T> = T & import("tsx-dom-types").SVGAttributes & import("tsx-dom-ssr").HTMLComponentProps;

declare module "tsx-dom-ssr" {
    interface CustomElementsHTML {
        "code-copy-button": ExtendProps<CodeCopyButtonProps>;
        "search-container": ExtendProps<SearchContainerProps>;
        "link-select": ExtendProps<LinkSelectProps>;
    }
}
