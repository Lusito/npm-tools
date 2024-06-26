import { dirname, relative, resolve } from "path";
import { existsSync } from "fs";
import fs from "fs/promises";
import yaml from "js-yaml";

import { getAllFiles } from "./fileUtils";
import { CombinedDocsConfig, DocsConfig } from "./types";

type LoadedConfig = {
    dir: string;
    file: string;
    depth: number;
    data: DocsConfig;
};

export async function loadConfigRaw(file: string): Promise<DocsConfig> {
    const content = await fs.readFile(file, "utf-8");

    return yaml.load(content) as DocsConfig;
}

async function loadConfig(rootPath: string, file: string): Promise<LoadedConfig> {
    const data = await loadConfigRaw(file);
    const relativePath = relative(rootPath, file);
    const dir = dirname(relativePath);

    return {
        dir,
        file,
        depth: relativePath.split("/").length,
        data,
    };
}

const defaultDocsConfig: CombinedDocsConfig = {
    siteName: "Unnamed Documentation",
    description: "",
    footer: [],
    keywords: [],
    links: [],
    projects: [],
    sidebar: [],
    title: "",
    adjustPaths: [],
    docs: "docs",
};

function adjustConfig(rootPath: string, loadedConfig: LoadedConfig) {
    const { dir, data } = loadedConfig;
    const config = data as CombinedDocsConfig;
    const { sidebar, projects, docs } = config;
    const basePath = resolve(rootPath, dir);
    const docsPath = resolve(basePath, docs);
    data.docs = docsPath;

    config.sidebar = sidebar.map((entry) => resolve(docsPath, `${entry}.md`));

    if (config.sidebar.length) {
        const readme = resolve(basePath, "README.md");
        if (existsSync(readme)) {
            config.sidebar.unshift(readme);
        }
    }
    config.projects = projects.map((project) => resolve(rootPath, `${project}/README.md`));
}

export type ConfigGetter = (dir: string) => CombinedDocsConfig;
export type LoadedConfigs = {
    rootConfig: CombinedDocsConfig;
    getConfig: ConfigGetter;
};

export async function loadConfigs(rootPath: string): Promise<LoadedConfigs> {
    const configFiles = await getAllFiles(rootPath, /^mono-docs\.yml$/, []);
    const configs = await Promise.all(configFiles.map((file) => loadConfig(rootPath, file)));

    configs.sort((a, b) => a.depth - b.depth);

    // Perform inheritance from parent configs
    const rootConfig = configs[0];
    rootConfig.data = { ...defaultDocsConfig, ...rootConfig.data };

    for (let i = 1; i < configs.length; i++) {
        const config = configs[i];
        const possibleParentConfigs = configs.filter((c) => config.dir.startsWith(c.dir) && c.depth < config.depth);
        if (possibleParentConfigs.length > 1) {
            // configs are sorted by depth, the last one is the best matching config
            const parentConfig = possibleParentConfigs[possibleParentConfigs.length - 1];
            config.data = { ...parentConfig.data, ...config.data };
        } else {
            config.data = { ...rootConfig.data, ...config.data };
        }
    }

    for (const config of configs) {
        adjustConfig(rootPath, config);
    }

    return {
        rootConfig: rootConfig.data as CombinedDocsConfig,
        getConfig(dir: string) {
            const exactConfig = configs.find((c) => c.dir === dir);
            if (exactConfig) return exactConfig.data as CombinedDocsConfig;

            const possibleConfigs = configs.filter((c) => dir.startsWith(`${c.dir}/`));
            // configs are sorted by depth, the last one is the best matching config
            const config = possibleConfigs[possibleConfigs.length - 1];
            if (config) return config.data as CombinedDocsConfig;

            return rootConfig.data as CombinedDocsConfig;
        },
    };
}
