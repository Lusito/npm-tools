import { css, describeBlock } from "./utils";

const source = css`
    :global(.foo) {
        content: "simple class";
    }

    :global(.foo .bar) {
        content: "selector with multiple classes";
    }

    :global(.foo),
    :global(.bar) {
        content: "multiple class selectors";
    }

    .foo,
    :global(.bar) {
        content: "local and global selectors";
    }

    :global(.bar),
    .foo {
        content: "local and global selectors 2";
    }

    .foo :global(.foo .bar) {
        content: "local and global combined nested";
    }

    .foo :global(.foo:not(.bar)) {
        content: "local and global (with :not selector) combined nested";
    }

    .foo:global(.foo.bar) {
        content: "local and global combined";
    }

    .foo :global(.a_value) .bar {
        content: "local, global and local combined nested";
    }

    .foo:global(.a_value).bar {
        content: "local, global and local combined";
    }

    @-global-webkit-keyframes bar-anim {
        from {
            content: "webkit keyframes from";
        }
        to {
            content: "webkit keyframes to";
        }
    }

    @-global-keyframes foo-anim {
        from {
            content: "keyframes from";
        }
        to {
            content: "keyframes to";
        }
    }

    .foo {
        animation: bar-anim 1s ease;
    }

    .bar {
        animation: foo-anim 1s ease;
    }

    :global(.foo).bar,
    [type=\"radio\"] ~ .label,
    :not(.foo),
    #bar {
        content: "complex selector";
    }
`;

describe.each([
    ["unscoped", false, source],
    ["scoped", true, source],
])("global (%s)", describeBlock);
