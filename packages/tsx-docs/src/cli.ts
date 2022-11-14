#!/usr/bin/env node
import { resolve } from "path";
import fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { setupPirates } from "./pirates";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_node, _script, src, dest, mode] = process.argv;

async function start() {
    if (!src || !dest || (mode && mode !== "serve")) {
        console.log("usage: tsx-docs <source> <destination> [serve]");
        return;
    }
    const serve = mode === "serve";
    const port = 3000;
    const devUrl = `http://localhost:${port}`;

    const fullSrc = resolve(process.cwd(), src);
    const fullDest = resolve(process.cwd(), dest);

    await setupPirates(resolve(dest, "assets"), serve);

    const { createFiles } = await import("./generate");
    await createFiles({ src: fullSrc, dest: fullDest, devUrl, devMode: serve });

    // The stuff below is purely for the dev-server
    if (serve) {
        const app = fastify();

        // SSE hot reload:
        const startupTime = Date.now();
        app.get("/hot-sse", (req, reply) => {
            reply.status(200);
            reply.raw.setHeader("connection", "keep-alive");
            reply.raw.setHeader("content-type", "text/event-stream");
            reply.raw.write(`data: ${startupTime}\n\n`);
        });

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
}

start();
