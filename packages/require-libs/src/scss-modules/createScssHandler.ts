import { propertyDescriptor } from "../utils/propertyDescriptor";
import { ScssCompilerOptions, createScssCompiler } from "./createCompiler";

export function createScssHandler(options: ScssCompilerOptions) {
    const compile = createScssCompiler(options);

    return (code: string, filename: string): string => {
        const { css, tokens, fileMappings } = compile(code, filename);

        return `
            module.exports = ${JSON.stringify(tokens)};
            Object.defineProperty(module.exports, "__CSS", ${JSON.stringify(propertyDescriptor(css))});
            Object.defineProperty(module.exports, "__FILES", ${JSON.stringify(propertyDescriptor(fileMappings))});
        `;
    };
}
