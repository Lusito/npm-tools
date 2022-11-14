export type ImageHandlerOptions = {
    copyAsset(filename: string): string;
};

export function createImageHandler({ copyAsset }: ImageHandlerOptions) {
    return (filename: string): string => `module.exports = ${JSON.stringify(copyAsset(filename))}`;
}
