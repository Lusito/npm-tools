import { css, describeBlock } from "./utils";

const source = css`
    .foo {
        color: red;
    }

    @media (max-width: 480px) {
        .foo {
            color: blue;
        }
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("media-query (%s)", describeBlock);
