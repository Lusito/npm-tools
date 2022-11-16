import "tsx-dom-ssr";

declare module "tsx-dom-ssr" {
    export interface TsxConfig {
        svg: false;
    }
}
