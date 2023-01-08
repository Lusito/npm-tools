import { copyFileSync, mkdirSync, readFileSync } from "fs";
import { createHash } from "crypto";
import { basename, extname, resolve } from "path";

export function createCopyAsset(assetDir: string, prefix: string) {
    const assetCache: Record<string, string | undefined> = {};
    mkdirSync(assetDir, { recursive: true });

    return function copyAsset(filename: string) {
        let destination = assetCache[filename];
        if (!destination) {
            const fileBuffer = readFileSync(filename);
            const hashSum = createHash("sha256");
            hashSum.update(fileBuffer);
            const hash = hashSum.digest("hex").substring(0, 8);
            const ext = extname(filename);

            const newFilename = `${basename(filename, ext)}-${hash}${ext}`;

            destination = prefix + newFilename;
            assetCache[filename] = destination;

            copyFileSync(filename, resolve(assetDir, newFilename));
        }
        return destination;
    };
}
