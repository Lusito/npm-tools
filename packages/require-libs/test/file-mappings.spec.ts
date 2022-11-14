import { css, describeBlock } from "./utils";

const source = css`
    .foo {
        background: url("./asset-1.png");
    }

    .bar {
        background: url("./asset-2.png");
    }

    .baz {
        background: url("./subFolder/asset-3.png");
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("file-mappings (%s)", describeBlock);
