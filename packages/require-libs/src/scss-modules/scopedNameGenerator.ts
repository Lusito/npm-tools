export type ScopedNameGenerator = (localName: string) => string;

export type ScopedNameGeneratorFactory = (code: string, filepath: string) => ScopedNameGenerator;

export function getScopedNameGenerator(
    code: string,
    filepath: string,
    generateScopedName?: boolean | ScopedNameGeneratorFactory
) {
    if (generateScopedName === true) {
        const suffix = encode(hashStr(code));

        return (name: string) => `${name}_${suffix}`;
    }

    if (generateScopedName) {
        return generateScopedName(code, filepath);
    }

    return undefined;
}

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */
function hashStr(str: string) {
    let hash = 5381;
    let i = str.length;

    while (i) {
        // eslint-disable-next-line no-bitwise
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    // eslint-disable-next-line no-bitwise
    return hash >>> 0;
}

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encode(integer: number) {
    if (integer === 0) {
        return "0";
    }
    let str = "";
    while (integer > 0) {
        str = CHARS[integer % 62] + str;
        integer = Math.floor(integer / 62);
    }
    return str;
}
