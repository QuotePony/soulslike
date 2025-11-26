import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distPath = path.join(projectRoot, "dist");
const systemManifestPath = path.join(projectRoot, "system.json");

const envDataPath =
  process.env.FOUNDRY_DATA_PATH ||
  process.env.FOUNDRYVTT_DATA_PATH ||
  process.env.FVTT_DATA_PATH;

const defaultDataPath = (() => {
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA;
    if (localAppData) {
      return path.join(localAppData, "FoundryVTT", "Data");
    }

    if (process.env.USERPROFILE) {
      return path.join(process.env.USERPROFILE, "AppData", "Local", "FoundryVTT", "Data");
    }

    return undefined;
  }

  if (process.platform === "darwin") {
    return path.join(process.env.HOME ?? "", "Library", "Application Support", "FoundryVTT", "Data");
  }

  return path.join(process.env.HOME ?? "", ".local", "share", "FoundryVTT", "Data");
})();

const resolveDataPath = async () => {
  const candidate = envDataPath || defaultDataPath;

  if (!candidate) {
    throw new Error("Unable to determine the Foundry data directory; set FOUNDRY_DATA_PATH.");
  }

  try {
    const stats = await fs.stat(candidate);
    if (!stats.isDirectory()) {
      throw new Error(`Foundry data path "${candidate}" is not a directory.`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        `Foundry data path "${candidate}" does not exist. Set FOUNDRY_DATA_PATH to your Data directory.`
      );
    }

    throw error;
  }

  return candidate;
};

const getSystemId = async () => {
  const manifest = JSON.parse(await fs.readFile(systemManifestPath, "utf8"));
  if (!manifest.id) {
    throw new Error(`Missing "id" in ${systemManifestPath}.`);
  }

  return manifest.id;
};

const ensureDistExists = async () => {
  try {
    await fs.access(distPath);
  } catch {
    throw new Error(`Build output missing at ${distPath}. Run "npm run build" first.`);
  }
};

const deployToFoundry = async (target) => {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(distPath, target, { recursive: true });
};

const main = async () => {
  const dataPath = await resolveDataPath();
  const systemId = await getSystemId();
  const target = path.join(dataPath, "systems", systemId);

  await ensureDistExists();
  console.log(`[deploy] Copying dist to ${target}`);
  await deployToFoundry(target);
  console.log("[deploy] Done.");
};

main().catch((error) => {
  console.error(`[deploy] ${error.message}`);
  process.exitCode = 1;
});
