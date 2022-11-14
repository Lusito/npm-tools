import { css, describeBlock } from "./utils";

const source = css`
    #foo {
        color: red;
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("non-class (%s)", describeBlock);
