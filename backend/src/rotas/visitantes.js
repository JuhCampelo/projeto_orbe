const express = require("express");
const db = require("../db");

const router = express.Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

const inserir = db.prepare(
  "INSERT INTO visitantes (nome, email, instagram, consentimento_lgpd) VALUES (?, ?, ?, ?)"
);

// POST /api/visitantes  {nome, email, instagram?, consentimento}
router.post("/", (req, res) => {
  const { nome, email, instagram, consentimento } = req.body || {};
  const erros = [];

  const nomeLimpo = typeof nome === "string" ? nome.trim() : "";
  if (nomeLimpo.length < 2 || nomeLimpo.length > 120) erros.push("nome: informe entre 2 e 120 caracteres");

  const emailLimpo = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL.test(emailLimpo) || emailLimpo.length > 254) erros.push("email: formato inválido");

  let insta = null;
  if (instagram !== undefined && instagram !== null && String(instagram).trim() !== "") {
    insta = String(instagram).trim().replace(/^@/, "");
    if (!INSTAGRAM.test(insta)) erros.push("instagram: use só letras, números, ponto e _ (até 30)");
  }

  if (consentimento !== true) erros.push("consentimento: é preciso aceitar o uso dos dados (LGPD)");

  if (erros.length) return res.status(400).json({ erros });

  const r = inserir.run(nomeLimpo, emailLimpo, insta, 1);
  res.status(201).json({ visitante_id: Number(r.lastInsertRowid) });
});

module.exports = router;
