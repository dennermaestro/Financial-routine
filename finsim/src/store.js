// Armazenamento simples em arquivo JSON, compartilhado pelo servidor MCP,
// pelo painel e pelo modo de simulação. Tudo aqui é fictício.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const STATE_FILE = process.env.FINSIM_STATE || path.join(ROOT, "data", "estado.json");
export const REPORT_DIR = path.join(ROOT, "relatorios");

export function load() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error("Base não encontrada. Rode `npm run reset` antes de começar.");
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

export function save(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}
