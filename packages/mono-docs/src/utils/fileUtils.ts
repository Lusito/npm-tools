import fs from "fs";
import path from "path";

export async function getAllFiles(dirPath: string, pattern: RegExp, arrayOfFiles: string[]) {
    const files = await fs.promises.readdir(dirPath);

    await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const stat = await fs.promises.stat(filePath);
            if (stat.isDirectory()) {
                await getAllFiles(filePath, pattern, arrayOfFiles);
            } else if (pattern.test(filePath)) {
                arrayOfFiles.push(filePath);
            }
        })
    );

    return arrayOfFiles;
}
