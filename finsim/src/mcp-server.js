#!/usr/bin/env node
// Servidor MCP da FinSim (stdio). Expõe as ferramentas de src/core.js para o Claude
// e para qualquer outro cliente compatível com o Model Context Protocol.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOLS, executar } from "./core.js";

const server = new McpServer({ name: "finsim", version: "1.0.0" });

for (const [nome, t] of Object.entries(TOOLS)) {
  server.registerTool(
    nome,
    {
      title: nome.replace(/_/g, " "),
      description: `[setor: ${t.setor}] ${t.descricao}`,
      inputSchema: t.schema,
      annotations: { readOnlyHint: !t.sensivel && /^(consultar|listar|verificar|resumo|conciliar)/.test(nome), destructiveHint: t.sensivel },
    },
    async (args) => {
      try {
        const r = executar(nome, args);
        return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Erro: ${e.message}` }] };
      }
    },
  );
}

await server.connect(new StdioServerTransport());
