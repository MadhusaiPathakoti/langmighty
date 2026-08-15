import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

// muhammara is a native addon (see README-ARCHITECTURE note in the plan doc:
// requires a Vercel `functions.includeFiles` entry in vercel.json, and a
// matching Visual Studio Build Tools / C++ toolchain for local dev on Windows).
// Imported lazily so routes that don't touch encryption never pay for loading it.
async function getMuhammara() {
  const mod = await import("muhammara");
  return mod.default ?? mod;
}

// Locks a PDF with a single permanent password (used as both the "open" and
// "owner" password — this feature has one password per purchase, not a
// separate owner/user pair). muhammara only operates on file paths, not
// buffers, so we round-trip through Vercel's writable /tmp directory.
export async function lockPdfBuffer(buffer, password) {
  const muhammara = await getMuhammara();

  const tmpDir = os.tmpdir();
  const id = crypto.randomUUID();
  const inputPath = path.join(tmpDir, `pdf-lock-in-${id}.pdf`);
  const outputPath = path.join(tmpDir, `pdf-lock-out-${id}.pdf`);

  try {
    await fs.writeFile(inputPath, buffer);

    muhammara.recrypt(inputPath, outputPath, {
      userPassword: password,
      ownerPassword: password,
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(inputPath, { force: true });
    await fs.rm(outputPath, { force: true });
  }
}
