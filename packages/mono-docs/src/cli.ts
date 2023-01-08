#!/usr/bin/env node
import { join, resolve } from "path";
import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { copyFile, mkdir, readdir } from "fs/promises";
import { existsSync, statSync } from "fs";

import { setupPirates } from "./pirates";
import { loadConfigRaw } from "./utils/configUtils";
import { BuildOptions } from "./utils/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_node, _script, src, mode] = process.argv;
const validModes = ["serve", "build"];

async function start() {
    if (!src || !validModes.includes(mode)) {
        console.log("usage: mono-docs <root-directory> [serve|build]");
        return;
    }
    const port = 3000;
    const devUrl = `http://localhost:${port}`;

    const fullSrc = resolve(process.cwd(), src);
    const configFile = resolve(fullSrc, "mono-docs.yml");
    const { buildOptions } = await loadConfigRaw(configFile);
    if (!buildOptions) {
        throw new Error("buildOptions not present in config");
    }
    const fullDest = resolve(fullSrc, buildOptions.out);

    const serve = mode === "serve";
    const siteUrl = serve ? devUrl : buildOptions.siteUrl;

    await setupPirates(resolve(fullDest, "assets"), siteUrl, serve);

    const { createFiles } = await import("./generate");
    await createFiles({ src: fullSrc, dest: fullDest, siteUrl, devMode: serve });

    if (serve) {
        await runDevServer(buildOptions, fullSrc, fullDest, port, devUrl);
    } else {
        await copyStaticFiles(buildOptions, fullSrc, fullDest);
    }
}

async function copyStaticFiles(buildOptions: BuildOptions, fullSrc: string, fullDest: string) {
    if (buildOptions.static) {
        await Promise.all(
            Object.entries(buildOptions.static).map(async ([key, value]) => {
                const from = resolve(fullSrc, value);
                const to = resolve(fullDest, key);
                await copyDir(from, to);
            })
        );
    }
}

async function copyDir(from: string, to: string) {
    const exists = existsSync(from);
    const isDirectory = exists && statSync(from).isDirectory();
    if (isDirectory) {
        await mkdir(to);
        const files = await readdir(from);
        await Promise.all(files.map((childItemName) => copyDir(join(from, childItemName), join(to, childItemName))));
    } else {
        await copyFile(from, to);
    }
}

async function runDevServer(
    buildOptions: BuildOptions,
    fullSrc: string,
    fullDest: string,
    port: number,
    devUrl: string
) {
    const app = fastify();

    // SSE hot reload:
    const startupTime = Date.now();
    app.get("/hot-sse", (req, reply) => {
        reply.status(200);
        reply.raw.setHeader("connection", "keep-alive");
        reply.raw.setHeader("content-type", "text/event-stream");
        reply.raw.write(`data: ${startupTime}\n\n`);
    });

    if (buildOptions.static) {
        for (const [key, value] of Object.entries(buildOptions.static)) {
            app.register(fastifyStatic, {
                root: resolve(fullSrc, value),
                prefix: `/${key}`,
                decorateReply: false,
                prefixAvoidTrailingSlash: true,
            });
        }
    }

    app.register(fastifyStatic, {
        root: fullDest,
        prefix: "/",
    });

    app.setNotFoundHandler((req, reply) => {
        reply.status(404);
        reply.sendFile("404.html");
    });

    try {
        await app.listen({ port });
        console.log(`Serving docs at ${devUrl}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

start();
