const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const arquivo = process.env.ORBE_DB || path.join(__dirname, "..", "data", "orbe.sqlite");
fs.mkdirSync(path.dirname(arquivo), { recursive: true });

const db = new Database(arquivo);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const colunas = (tabela) => db.prepare(`PRAGMA table_info(${tabela})`).all();
const existe = (tabela) => colunas(tabela).length > 0;

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
const criarTabela = (tabela) => schema.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${tabela} \\([\\s\\S]*?\\n\\);`))[0];

// Bancos de versões anteriores: recria a tabela no formato novo e copia os dados.
function recriar(tabela, copiar) {
  db.pragma("foreign_keys = OFF");
  db.transaction(() => {
    db.exec(criarTabela(tabela).replace(`CREATE TABLE IF NOT EXISTS ${tabela} (`, `CREATE TABLE ${tabela}_nova (`));
    db.exec(`INSERT INTO ${tabela}_nova (${copiar.join(", ")}) SELECT ${copiar.join(", ")} FROM ${tabela};
             DROP TABLE ${tabela};
             ALTER TABLE ${tabela}_nova RENAME TO ${tabela};`);
    if (db.pragma("foreign_key_check").length) throw new Error(`Migração de ${tabela} deixou referências inválidas`);
  })();
  db.pragma("foreign_keys = ON");
}

// visitantes.email era NOT NULL; agora o front pede telefone, não e-mail.
const email = colunas("visitantes").find((c) => c.name === "email");
if (email && email.notnull === 1) {
  recriar("visitantes", ["id", "nome", "email", "instagram", "consentimento_lgpd", "criado_em"]);
}
// jornadas.visitante_id era NOT NULL, e area_texto não existia.
if (existe("jornadas")) {
  const cj = colunas("jornadas");
  if (cj.find((c) => c.name === "visitante_id").notnull === 1 || !cj.some((c) => c.name === "area_texto")) {
    recriar("jornadas", ["id", "visitante_id", "area_id", "cargo_texto", "setor_texto",
      "descricao_livre", "versao_catalogo", "data_catalogo", "resposta_json", "criado_em"]);
  }
}

db.exec(schema);

// Acrescenta colunas novas sem apagar dados de bancos já existentes.
function garantirColunas(tabela, novas) {
  const existentes = new Set(colunas(tabela).map((c) => c.name));
  for (const [nome, tipo] of novas) {
    if (!existentes.has(nome)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${nome} ${tipo}`);
  }
}
garantirColunas("consultas_ia", [
  ["conteudo_json", "TEXT"],        // resposta completa da API
  ["stop_reason", "TEXT"],
  ["tokens_entrada", "INTEGER"],
  ["tokens_saida", "INTEGER"],
  ["tokens_cache_lidos", "INTEGER"]
]);

module.exports = db;
