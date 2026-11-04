const express = require("express");
const cat = require("../catalogo");

const router = express.Router();

// GET /api/opcoes: áreas (etapa 1) e missões (etapa 2), com os mesmos ids do front/app.js.
router.get("/", (_req, res) => {
  res.json({
    areas: Object.entries(cat.mapa.areas).map(([id, a]) => ({ id, label: a.label })),
    missoes: Object.entries(cat.mapa.missoes).map(([id, m]) => ({ id, label: m.label })),
    data_catalogo: cat.dataReferencia
  });
});

module.exports = router;
