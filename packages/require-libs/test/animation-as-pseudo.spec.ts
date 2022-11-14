import { css, describeBlock } from "./utils";

const source = css`
    @keyframes hover {
        0% {
            opacity: 0;
        }

        100% {
            opacity: 0.5;
        }
    }

    @media (max-width: 480px) {
        .animation:hover {
            background: green;
        }
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("animation-as-pseudo (%s)", describeBlock);
