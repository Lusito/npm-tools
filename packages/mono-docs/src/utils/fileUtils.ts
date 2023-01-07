import { readdir, stat } from "fs/promises";
import path from "path";

export async function getAllFiles(dirPath: string, pattern: RegExp, arrayOfFiles: string[]) {
    const files = await readdir(dirPath);

    await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const s = await stat(filePath);
            if (s.isDirectory()) {
                await getAllFiles(filePath, pattern, arrayOfFiles);
            } else if (pattern.test(file)) {
                arrayOfFiles.push(filePath);
            }
        })
    );

    return arrayOfFiles;
}
