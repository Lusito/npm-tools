import { css, describeBlock } from "./utils";

const source = css`
    @keyframes woot {
        0% {
            opacity: 0;
        }

        33.3% {
            opacity: 0.333;
        }

        100% {
            opacity: 1;
        }
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("keyframes-with-decimal (%s)", describeBlock);
