import sass, { OutputStyle } from "sass";
import { dirname, resolve } from "path";
import { existsSync, statSync } from "fs";

import { camelCaseTokenTransformer, TokenTransformerConfig, transformTokens } from "./transformTokens";
import { getScopedNameGenerator, ScopedNameGeneratorFactory } from "./scopedNameGenerator";
import { addScopes } from "./addScopes";
import { extractGlobals } from "./extractGlobals";

const identity = <T>(value: T) => value;

export type ScssCompilerOptions = {
    style: OutputStyle;
    generateScopedNames?: boolean | ScopedNameGeneratorFactory;
    preprocessCss?: (code: string, filename: string) => string;
    processCss?: (code: string, filename: string) => string;
    mapFileUrl?: (fileUrl: string) => string;
    transformToken?: null | TokenTransformerConfig;
};

export type MappedFile = {
    source: string;
    destination: string;
};

export type CssModule = { __CSS: string; __FILES: MappedFile[] } & Record<string, string>;

export type CompiledResult = {
    css: string;
    tokens: Record<string, string>;
    fileMappings: MappedFile[];
};
type Compiler = (code: string, filename: string) => CompiledResult;

function getNodeModules() {
    const result: string[] = [];

    let path = process.cwd();
    for (;;) {
        const abs = resolve(path, "node_modules");
        if (existsSync(abs) && statSync(abs).isDirectory()) {
            result.push(abs);
        }
        const newPath = dirname(path);
        if (newPath === path) {
            break;
        }
        path = newPath;
    }

    return result;
}

export function createScssCompiler({
    generateScopedNames = true,
    preprocessCss = identity,
    processCss = identity,
    mapFileUrl,
    style,
    transformToken = { transform: camelCaseTokenTransformer },
}: ScssCompilerOptions): Compiler {
    const nodeModulesPaths = getNodeModules();

    function getNodeModulesFile(file: string) {
        for (const path of nodeModulesPaths) {
            const abs = resolve(path, file);
            if (existsSync(abs)) {
                return abs;
            }
        }

        return null;
    }

    return (code, filename) => {
        try {
            const extracted = extractGlobals(code);
            const sassResult = sass.compileString(preprocessCss(extracted.code, filename), {
                loadPaths: [dirname(filename), ...nodeModulesPaths],
                style,
                charset: false,
            });
            const fileMappings: MappedFile[] = [];

            const getFileSource = (dir: string, file: string) => {
                const source = file.startsWith("~") ? getNodeModulesFile(file.substring(1)) : resolve(dir, file);
                if (source && existsSync(source)) {
                    return source;
                }

                throw new Error(`Could not locate url "${file}" from "${dir}"`);
            };

            const postProcessCss = (css: string) => {
                css = extracted.reinsert(css);

                if (mapFileUrl) {
                    const dir = dirname(filename);

                    css = css.replace(/url\(([^)]+)\)/g, (_, urlString) => {
                        const source = getFileSource(dir, JSON.parse(urlString.replace(/'/g, '"')));
                        const destination = mapFileUrl(source);

                        fileMappings.push({ source, destination });
                        return `url(${JSON.stringify(destination)})`;
                    });
                }

                return processCss(css, filename);
            };

            let { css } = sassResult;
            let tokens: Record<string, string> = {};

            // only .module.(s)css files need tokens
            if (filename.includes(".module.")) {
                const generateScopedName = getScopedNameGenerator(code, filename, generateScopedNames);
                if (generateScopedName) {
                    const exports = addScopes(css, generateScopedName);
                    css = exports.css;
                    tokens = { ...exports.keyframes, ...exports.classes };
                    if (transformToken) tokens = transformTokens(tokens, transformToken);
                }
            } else {
                css = css.replaceAll("@-global-", "@");
            }

            return {
                css: postProcessCss(css),
                tokens,
                fileMappings,
            };
        } catch (e) {
            throw new Error(`Error compiling ${filename}: ${String(e)}`);
        }
    };
}
