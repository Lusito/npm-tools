export function applyAdjustPaths(path: string, adjustPaths: string[]) {
    for (const adjustPath of adjustPaths) {
        const parts = adjustPath.split("|");
        const newPath = path.replace(new RegExp(parts[0], "g"), parts[1]);
        if (path !== newPath) {
            return newPath;
        }
    }

    return path;
}
