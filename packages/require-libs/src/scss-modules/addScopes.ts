import type { ScopedNameGenerator } from "./scopedNameGenerator";
import { ignoreComments, classRegex, keyframesRegex } from "./regex";

export type ScopedExports = {
    css: string;
    keyframes: Record<string, string>;
    classes: Record<string, string>;
};

export function addScopes(css: string, generateScopedName: ScopedNameGenerator) {
    const result: ScopedExports = { css, keyframes: {}, classes: {} };

    result.css = result.css
        .replace(classRegex, (_, prefix: string, name: string) => {
            const scopedName = generateScopedName(name);
            result.classes[name] = scopedName;
            return prefix + scopedName;
        })
        .replace(keyframesRegex, (_, prefix: string, name: string) => {
            if (prefix.startsWith("@-global-")) {
                return prefix.replace("@-global-", "@") + name;
            }

            const scopedName = generateScopedName(name);
            result.keyframes[name] = scopedName;
            return prefix + scopedName;
        });

    return replaceAnimations(result);
}

function replaceAnimations(result: ScopedExports): ScopedExports {
    const unscoped = Object.keys(result.keyframes);
    if (!unscoped.length) return result;

    const regexStr = `((?:animation|animation-name)\\s*:[^};]*)(${unscoped.join("|")})([;\\s])${ignoreComments}`;
    const regex = new RegExp(regexStr, "g");

    const css = result.css.replace(
        regex,
        (_, preamble, name, ending) => `${preamble}${result.keyframes[name]}${ending}`
    );

    return {
        css,
        keyframes: result.keyframes,
        classes: result.classes,
    };
}
