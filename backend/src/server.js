const path = require("path");

// Lê backend/.env (ANTHROPIC_API_KEY etc.) antes de carregar o resto. Sem .env, segue sem IA.
try {
  process.loadEnvFile(path.join(__dirname, "..", ".env"));
} catch (erro) {
  if (erro.code !== "ENOENT") throw erro;
}

const express = require("express");
const cors = require("cors");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
if (process.env.ORBE_CORS_ORIGIN) app.use("/api", cors({ origin: process.env.ORBE_CORS_ORIGIN.split(",") }));

app.use("/api/visitantes", require("./rotas/visitantes"));
app.use("/api/opcoes", require("./rotas/opcoes"));
app.use("/api/jornadas", require("./rotas/jornadas"));
app.get("/api/ia/status", (_req, res) => res.json({ ativo: require("./ia").ativo, modelo: require("./ia").MODELO }));
app.use("/api/acesso", require("./rotas/acesso"));
app.use("/api/admin", require("./rotas/admin"));
app.use("/api", (_req, res) => res.status(404).json({ erros: ["rota não encontrada"] }));

// Serve o frontend sem alterá-lo.
app.use(express.static(path.join(__dirname, "..", "..", "front")));

app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ erros: ["JSON inválido"] });
  if (err.type === "entity.too.large") return res.status(413).json({ erros: ["corpo muito grande"] });
  console.error(err);
  res.status(500).json({ erros: ["erro interno"] });
});

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
  console.log(`Orbe backend em http://localhost:${porta}`);
  console.log(require("./ia").ativo ? "Etapa 3 com IA: ligada" : "Etapa 3 com IA: desligada (sem ANTHROPIC_API_KEY no .env)");
});
