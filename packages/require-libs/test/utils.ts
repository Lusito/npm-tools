import { relative, resolve, extname, basename } from "path";
import { readFileSync } from "fs";
import crypto from "crypto";

import { createScssCompiler } from "../src/scss-modules/createCompiler";

function hashFile(filename: string) {
    const fileBuffer = readFileSync(filename);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex").substring(0, 8);
}

export function css(literals: TemplateStringsArray, ...placeholders: string[]) {
    let result = "";
    for (let i = 0; i < placeholders.length; i++) {
        result += literals[i];
        result += placeholders[i];
    }
    return result.replace(/^[\r\n]+/, "") + literals[literals.length - 1];
}

export const describeBlock = (_: string, generateScopedNames: boolean, source: string): void => {
    const compile = createScssCompiler({
        generateScopedNames,
        style: "expanded",
        mapFileUrl(fileUrl: string) {
            const hash = hashFile(fileUrl);
            const ext = extname(fileUrl);
            const newFile = `${basename(fileUrl, ext)}-${hash}${ext}`;
            return `./assets/${newFile}`;
        },
    });

    const filename = resolve(__dirname, "test.module.scss");

    it("produces the correct css", () => {
        expect(compile(source, filename).css).toMatchSnapshot();
    });

    it("produces the correct tokens", () => {
        expect(compile(source, filename).tokens).toMatchSnapshot();
    });

    it("produces the correct file mappings", () => {
        const cleaned = compile(source, filename).fileMappings.map((mapping) => ({
            source: relative(process.cwd(), mapping.source),
            destination: mapping.destination,
        }));
        expect(cleaned).toMatchSnapshot();
    });
};
