import { createApp } from "./app.ts";
import { env } from "./shared/config/env.ts";
import { prisma } from "./shared/config/prisma.ts";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

/** Close the HTTP server and database pool before exiting. */
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
