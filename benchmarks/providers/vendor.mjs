import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { VENDORS } from "./contract.mjs";

export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Read only a named regular member, never unpack arbitrary archive paths.
export function member(archive, wanted) {
  const tar = gunzipSync(archive, { maxOutputLength: 128 * 1024 * 1024 });
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = header.subarray(0, 100).toString().replace(/\0.*$/s, "");
    const prefix = header.subarray(345, 500).toString().replace(/\0.*$/s, "");
    const fullName = prefix ? `${prefix}/${name}` : name;
    const sizeText = header.subarray(124, 136).toString().replace(/\0.*$/s, "").trim();
    if (!/^[0-7]+$/.test(sizeText)) throw new Error("Invalid tar member size");
    const size = Number.parseInt(sizeText, 8);
    const start = offset + 512;
    if (!Number.isSafeInteger(size) || start + size > tar.length) throw new Error("Truncated tar");
    if (fullName === wanted) {
      if (![0, 48].includes(header[156])) throw new Error("Expected a regular file");
      return tar.subarray(start, start + size);
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  throw new Error(`Missing archive member: ${wanted}`);
}

export function verifyArchive(bytes, integrity) {
  if (!/^sha512-[A-Za-z0-9+/]+=*$/.test(integrity))
    throw new Error("Expected SHA-512 npm integrity");
  const actual = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  if (actual !== integrity) throw new Error("Vendor archive integrity mismatch");
}

async function download(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "registry.npmjs.org") {
    throw new Error("Only the npm registry is allowed during vendor preparation");
  }
  const response = await fetch(parsed, { redirect: "error", signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Vendor download failed: ${response.status} ${parsed}`);
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > 64 * 1024 * 1024) throw new Error("Vendor download exceeded size limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function prepareVendors(directory) {
  await mkdir(directory, { recursive: true });
  const result = {};
  for (const [id, pin] of Object.entries(VENDORS)) {
    const script = path.join(directory, `${id}-${pin.version}.js`);
    const receipt = `${script}.json`;
    let cached;
    try {
      cached = JSON.parse(await readFile(receipt, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (cached) {
      if (
        cached.name !== pin.name ||
        cached.version !== pin.version ||
        cached.entry !== pin.entry
      ) {
        throw new Error(`Vendor cache identity mismatch: ${id}`);
      }
      if (digest(await readFile(script)) !== cached.sha256)
        throw new Error(`Corrupt vendor cache: ${id}`);
      result[id] = { ...cached, script };
      continue;
    }
    const metadata = JSON.parse(
      await download(`https://registry.npmjs.org/${pin.name}/${pin.version}`),
    );
    if (metadata.name !== pin.name || metadata.version !== pin.version)
      throw new Error("Wrong vendor version");
    const archive = await download(metadata.dist.tarball);
    verifyArchive(archive, metadata.dist.integrity);
    const manifest = JSON.parse(member(archive, "package/package.json"));
    if (manifest.name !== pin.name || manifest.version !== pin.version)
      throw new Error("Wrong archive identity");
    const source = member(archive, pin.entry);
    const record = { ...pin, integrity: metadata.dist.integrity, sha256: digest(source) };
    await writeFile(script, source);
    await writeFile(receipt, `${JSON.stringify(record, null, 2)}\n`);
    result[id] = { ...record, script };
  }
  return result;
}
