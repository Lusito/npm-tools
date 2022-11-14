import { css, describeBlock } from "./utils";

const source = css`
    .foo {
        color: red;
    }

    .foo-bar {
        color: green;
    }

    .fooBar2k {
        color: blue;
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("basic (%s)", describeBlock);
