// eslint-disable-next-line import/no-extraneous-dependencies
require("esbuild-register/dist/node").register({
    target: "node12",
    jsx: "automatic",
    jsxImportSource: "tsx-dom-ssr",
});
