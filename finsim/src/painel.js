// Painel ao vivo da FinSim: mostra o que os agentes estão fazendo, em tempo real.
// Uso: npm run painel  ->  http://localhost:4000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load, save } from "./store.js";
import { buildSeed } from "./seed.js";

const PORT = Number(process.env.PORT || 4000);
const HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "index.html");

http.createServer((req, res) => {
  try {
    if (req.url === "/api/estado") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(load()));
    }
    if (req.url === "/api/reset" && req.method === "POST") {
      save(buildSeed());
      res.writeHead(204);
      return res.end();
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(HTML));
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(e.message);
  }
}).listen(PORT, () => console.log(`Painel FinSim em http://localhost:${PORT}`));
