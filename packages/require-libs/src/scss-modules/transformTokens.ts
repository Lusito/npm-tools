export type TokenTransformer = (key: string) => string;
export type TokenTransformerConfig = {
    transform: TokenTransformer;
    only?: boolean;
};

export const camelCaseTokenTransformer: TokenTransformer = (key) =>
    key.replace(/[-_]+(\w)/g, (_, letter) => letter.toUpperCase());

export function transformTokens(tokens: Record<string, string>, { transform, only }: TokenTransformerConfig) {
    const result = only ? {} : tokens;

    return Object.entries(tokens).reduce((acc, [key, value]) => {
        acc[transform(key)] = value;
        return acc;
    }, result);
}
