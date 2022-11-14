import { css, describeBlock } from "./utils";

const source = css`
    .foo {
        font-size: 1.3em;
    }

    .bar {
        font-size: 12.5px;
    }

    .baz {
        width: 33.3%;
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("dot-in-values (%s)", describeBlock);
