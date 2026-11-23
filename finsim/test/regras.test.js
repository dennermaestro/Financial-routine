// Garante que cada caso plantado na base é encontrado pela regra certa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed } from "../src/seed.js";
import { avaliarTransacao, parcela, sinaisDeInjecao } from "../src/rules.js";

const s = buildSeed(new Date("2026-11-25T12:00:00Z"));
const av = (id) => avaliarTransacao(s, s.transacoes.find((t) => t.id === id));
const codigos = (id) => av(id).alertas.map((a) => a.codigo);

test("transações normais têm risco baixo", () => {
  for (const id of ["T-5001", "T-5002", "T-5004", "T-5005", "T-5008", "T-5014", "T-5016"]) assert.equal(av(id).risco, "baixo", id);
});
test("duplicidade de PIX", () => assert.deepEqual(codigos("T-5003"), ["POSSIVEL_DUPLICIDADE"]));
test("limite diário estourado", () => { assert.ok(codigos("T-5006").includes("LIMITE_DIARIO_PIX")); assert.equal(av("T-5006").risco, "alto"); });
test("madrugada, dispositivo novo e beneficiário desconhecido", () => { assert.ok(codigos("T-5007").includes("HORARIO_ATIPICO")); assert.equal(av("T-5007").risco, "alto"); });
test("fracionamento abaixo de R$ 10 mil", () => {
  for (const id of ["T-5010", "T-5011", "T-5012"]) assert.ok(codigos(id).includes("FRACIONAMENTO"), id);
});
test("lista restritiva e PEP", () => { const c = codigos("T-5013"); assert.ok(c.includes("LISTA_RESTRITIVA")); assert.ok(c.includes("PEP_ALTO_VALOR")); });
test("valor atípico para beneficiário novo", () => assert.equal(av("T-5015").risco, "medio"));
test("parcela pela tabela Price", () => assert.equal(parcela(30000, 24), 1677.38));
test("detecta tentativa de prompt injection", () => {
  assert.ok(sinaisDeInjecao(s.chamados.find((c) => c.id === "CH-903").texto).length > 0);
  assert.equal(sinaisDeInjecao(s.chamados.find((c) => c.id === "CH-901").texto).length, 0);
});
