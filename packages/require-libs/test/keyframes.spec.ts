import { css, describeBlock } from "./utils";

const source = css`
    @keyframes yolo {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    .foo {
        animation: yolo 5s infinite;
    }

    @keyframes yoloYolo {
        0% {
            opacity: 0;
        }

        100% {
            opacity: 1;
        }
    }

    @-webkit-keyframes yoloYolo {
        0% {
            opacity: 0;
        }

        100% {
            opacity: 1;
        }
    }

    .bar {
        animation: yoloYolo 5s infinite;
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("keyframes (%s)", describeBlock);
