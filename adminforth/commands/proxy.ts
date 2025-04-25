// tsproxy.ts
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import { pathToFileURL } from 'url';
import path from 'path';

(async () => {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const code = Buffer.concat(chunks).toString();

  const tmpFileName = `.tmp-tsproxy-${randomUUID()}.ts`;
  
  const tmpFile = path.join(process.cwd(), tmpFileName);

  const origLog = console.log;
  let capturedLogs: any[] = [];
  console.log = (...args: any[]) => {
    capturedLogs.push(args);
  }

  process.env.HEAVY_DEBUG && console.log(`🪲 TMP proxy file: ${tmpFile}`);
  process.env.HEAVY_DEBUG && console.log(`🪲 Current working directory: ${process.cwd()}`);
  
  try {
    // Save code to a temp file
    await writeFile(tmpFile, code);

    // Dynamically import the file
    const module = await import(pathToFileURL(tmpFile).href);

    if (typeof module.exec !== 'function') {
      throw new Error("Module does not export an 'exec' function");
    }

    const result = await Promise.resolve(module.exec());

    // Restore original console.log
    console.log = origLog;
    console.log(JSON.stringify({ result, capturedLogs }));
  } catch (error: any) {
    // Restore original console.log
    console.log = origLog;
    console.error(JSON.stringify({ error: error.message, capturedLogs }));
    process.exit(1);
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
})();
