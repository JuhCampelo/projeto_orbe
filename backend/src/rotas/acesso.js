const express = require("express");
const QRCode = require("qrcode");

// Endereço público que o QR Code da tela inicial abre.
// ORBE_URL_PUBLICA tem prioridade; no Render, RENDER_EXTERNAL_URL é preenchida automaticamente.
function urlPublica() {
  const bruto = (process.env.ORBE_URL_PUBLICA || process.env.RENDER_EXTERNAL_URL || "").trim();
  if (!bruto) return null;
  try {
    const url = new URL(bruto);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    console.warn(`ORBE_URL_PUBLICA inválida (${bruto}); QR Code desligado`);
    return null;
  }
}

const URL_PUBLICA = urlPublica();

// O QR codifica só o endereço configurado, nunca uma URL vinda do pedido.
let svgPronto = null;
async function qrSvg() {
  if (!svgPronto) {
    svgPronto = QRCode.toString(URL_PUBLICA, {
      type: "svg",
      errorCorrectionLevel: "Q",
      margin: 2,
      color: { dark: "#0B192C", light: "#F8F9FA" }
    });
  }
  return svgPronto;
}

const router = express.Router();

router.get("/", (_req, res) => res.json({ url: URL_PUBLICA }));

router.get("/qrcode.svg", async (_req, res, next) => {
  if (!URL_PUBLICA) return res.status(404).json({ erros: ["endereço público não configurado"] });
  try {
    res.type("image/svg+xml").set("Cache-Control", "public, max-age=300").send(await qrSvg());
  } catch (erro) {
    svgPronto = null;
    next(erro);
  }
});

module.exports = router;
