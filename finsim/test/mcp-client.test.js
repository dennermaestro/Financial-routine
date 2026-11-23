// Sobe o servidor MCP de verdade (stdio) e conversa com ele como um cliente faria.
import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("servidor MCP lista e executa ferramentas", async () => {
  const state = path.join(os.tmpdir(), `finsim-mcp-${process.pid}.json`);
  process.env.FINSIM_STATE = state; // antes de importar o store
  const { save } = await import("../src/store.js");
  const { buildSeed } = await import("../src/seed.js");
  save(buildSeed());
  const client = new Client({ name: "teste", version: "1.0.0" });
  await client.connect(new StdioClientTransport({ command: "node", args: ["src/mcp-server.js"], env: { ...process.env, FINSIM_STATE: state } }));
  try {
    const { tools } = await client.listTools();
    assert.ok(tools.length >= 18, `esperava 18+ ferramentas, veio ${tools.length}`);
    const r = await client.callTool({ name: "validar_transacao", arguments: { transacao_id: "T-5003", agente: "prevencao-fraude" } });
    const body = JSON.parse(r.content[0].text);
    assert.equal(body.risco, "medio");
    assert.equal(body.alertas[0].codigo, "POSSIVEL_DUPLICIDADE");
    const erro = await client.callTool({ name: "consultar_saldo", arguments: { conta_id: "9999" } });
    assert.equal(erro.isError, true);
    const audit = JSON.parse((await client.callTool({ name: "consultar_auditoria", arguments: { limite: 5 } })).content[0].text);
    assert.equal(audit[0].agente, "prevencao-fraude");
  } finally {
    await client.close();
  }
});
