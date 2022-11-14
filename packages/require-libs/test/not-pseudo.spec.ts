import { css, describeBlock } from "./utils";

const source = css`
    @media screen and (min-width: 769px) {
        .foo:not(.bar) {
            display: flex;
        }
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("not-pseudo (%s)", describeBlock);
