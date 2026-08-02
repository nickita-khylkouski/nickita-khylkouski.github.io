import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = join(root, "dist");
const client = join(output, "client");
const server = join(output, "server");

await rm(output, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });

for (const entry of [
  "index.html",
  "styles.css",
  "photo-popover.js",
  "profile-photo.jpg",
  "nickita-khylkouski-resume.pdf",
  "photos",
  "blog",
  "work",
  "projects",
  "about",
  "support",
  "privacy",
]) {
  await cp(join(root, entry), join(client, entry), { recursive: true });
}

await writeFile(
  join(server, "index.js"),
  `export default {\n  async fetch(request, env) {\n    return env.ASSETS.fetch(request);\n  },\n};\n`,
);
