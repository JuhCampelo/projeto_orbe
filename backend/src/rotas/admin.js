const crypto = require("crypto");
const express = require("express");
const db = require("../db");

const router = express.Router();

// Só funciona se ORBE_ADMIN_TOKEN estiver definido. Envie: Authorization: Bearer <token>
function exigirToken(req, res, next) {
  const esperado = process.env.ORBE_ADMIN_TOKEN;
  if (!esperado) return res.status(404).end();
  const recebido = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ erros: ["token inválido"] });
  next();
}

// Evita injeção de fórmula ao abrir o CSV no Excel.
function celula(valor) {
  if (valor === null || valor === undefined) return "";
  let s = String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

// Cadastros com suas jornadas, mais as jornadas que ficaram sem cadastro.
const consulta = db.prepare(`
  SELECT * FROM (
  SELECT v.id AS visitante_id, v.nome, v.telefone, v.email, v.instagram, v.criado_em AS cadastrado_em,
         j.id AS jornada_id, j.area_texto, j.area_id, j.descricao_livre,
         (SELECT group_concat(missao_id, '|') FROM jornada_missoes m WHERE m.jornada_id = j.id) AS missoes,
         j.data_catalogo, j.criado_em AS jornada_em
  FROM visitantes v LEFT JOIN jornadas j ON j.visitante_id = v.id
  UNION ALL
  SELECT NULL, NULL, NULL, NULL, NULL, NULL,
         j.id, j.area_texto, j.area_id, j.descricao_livre,
         (SELECT group_concat(missao_id, '|') FROM jornada_missoes m WHERE m.jornada_id = j.id),
         j.data_catalogo, j.criado_em
  FROM jornadas j WHERE j.visitante_id IS NULL
  ) ORDER BY visitante_id IS NULL, visitante_id, jornada_id`);

// GET /api/admin/export.csv
router.get("/export.csv", exigirToken, (_req, res) => {
  const linhas = consulta.all();
  const colunas = ["visitante_id", "nome", "telefone", "email", "instagram", "cadastrado_em", "jornada_id", "area_texto",
    "area_id", "descricao_livre", "missoes", "data_catalogo", "jornada_em"];
  const csv = [colunas.join(","), ...linhas.map((l) => colunas.map((c) => celula(l[c])).join(","))].join("\r\n");
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="orbe_cadastros.csv"');
  res.send("﻿" + csv);
});

module.exports = router;
