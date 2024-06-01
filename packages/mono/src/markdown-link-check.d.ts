declare module "markdown-link-check" {
    type ReplacementPattern = {
        pattern: RegExp | string;
        replacement: string;
        global?: boolean;
    };
    type IgnorePattern = {
        pattern: RegExp | string;
    };
    type MarkdownLinkCheckOptions = {
        baseUrl: string;
        replacementPatterns?: ReplacementPattern[];
        ignorePatterns?: IgnorePattern[];
        retryOn429: boolean;
        retryCount: number;
        fallbackRetryDelay: string;
        aliveStatusCodes: number[];
    };
    type Result = {
        status: "alive" | "dead" | "ignored" | "error";
        link: string;
    };
    export default function markdownLinkCheck(
        markdown: string,
        opts: MarkdownLinkCheckOptions,
        callback: (err: unknown, results: Result[]) => void,
    ): void;
}
