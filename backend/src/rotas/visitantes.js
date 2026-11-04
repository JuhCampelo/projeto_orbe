const express = require("express");
const db = require("../db");

const router = express.Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

const inserir = db.prepare(
  "INSERT INTO visitantes (nome, email, telefone, instagram, consentimento_lgpd) VALUES (?, ?, ?, ?, ?)"
);

// POST /api/visitantes  {nome, telefone?, email?, instagram?, consentimento?}
// Campos da tela "Identificação inicial" do front: nome, telefone/WhatsApp e Instagram.
router.post("/", (req, res) => {
  const { nome, email, telefone, instagram, consentimento } = req.body || {};
  const erros = [];

  const nomeLimpo = typeof nome === "string" ? nome.trim() : "";
  if (nomeLimpo.length < 2 || nomeLimpo.length > 120) erros.push("nome: informe entre 2 e 120 caracteres");

  let emailLimpo = null;
  if (typeof email === "string" && email.trim()) {
    emailLimpo = email.trim().toLowerCase();
    if (!EMAIL.test(emailLimpo) || emailLimpo.length > 254) erros.push("email: formato inválido");
  }

  let telefoneLimpo = null;
  if (typeof telefone === "string" && telefone.trim()) {
    telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 13) erros.push("telefone: informe DDD e número");
  }

  if (!emailLimpo && !telefoneLimpo) erros.push("informe telefone ou e-mail");

  let insta = null;
  if (instagram !== undefined && instagram !== null && String(instagram).trim() !== "") {
    insta = String(instagram).trim().replace(/^@+/, "");
    if (!INSTAGRAM.test(insta)) erros.push("instagram: use só letras, números, ponto e _ (até 30)");
  }

  if (consentimento !== undefined && typeof consentimento !== "boolean") erros.push("consentimento: true ou false");

  if (erros.length) return res.status(400).json({ erros });

  // consentimento_lgpd só fica 1 quando o front enviar um aceite explícito (hoje o front não tem essa caixa).
  const r = inserir.run(nomeLimpo, emailLimpo, telefoneLimpo, insta, consentimento === true ? 1 : 0);
  res.status(201).json({ visitante_id: Number(r.lastInsertRowid) });
});

module.exports = router;
