const createGlobalId = (index: number) => `[__GLOBAL_REPLACEMENT_${index}__]`;

const globalStart = ":global(";
function findGlobal(code: string, index: number) {
    const start = code.indexOf(globalStart, index);
    if (start === -1) return null;
    let open = 1;
    const contentStart = start + globalStart.length;
    for (let i = contentStart; i < code.length; i++) {
        const c = code[i];
        if (c === ")") {
            open--;
            if (open === 0) {
                return {
                    start,
                    end: i + 1,
                    value: code.slice(contentStart, i),
                };
            }
        } else if (c === "(") {
            open++;
        }
    }

    throw new Error(`Could not find ending bracket for :global( at start ${start}`);
}

export function extractGlobals(code: string) {
    const globalValues: string[] = [];
    let remainingFrom = 0;
    const newCode = [];
    let result = findGlobal(code, 0);
    while (result) {
        globalValues.push(result.value);
        newCode.push(code.slice(remainingFrom, result.start));
        newCode.push(createGlobalId(globalValues.length - 1));
        remainingFrom = result.end;
        result = findGlobal(code, result.end + 1);
    }
    newCode.push(code.slice(remainingFrom));

    return {
        code: newCode.join(""),
        reinsert(css: string) {
            // Revert placeholders
            for (let i = 0; i < globalValues.length; i++) {
                css = css.replaceAll(createGlobalId(i), globalValues[i]);
            }
            return css;
        },
    };
}
