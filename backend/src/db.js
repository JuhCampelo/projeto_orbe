const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const arquivo = process.env.ORBE_DB || path.join(__dirname, "..", "data", "orbe.sqlite");
fs.mkdirSync(path.dirname(arquivo), { recursive: true });

const db = new Database(arquivo);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// Bancos antigos: jornadas.visitante_id era NOT NULL. Recria a tabela com os mesmos dados.
const colunaVisitante = db.prepare("PRAGMA table_info(jornadas)").all().find((c) => c.name === "visitante_id");
if (colunaVisitante && colunaVisitante.notnull === 1) {
  db.pragma("foreign_keys = OFF");
  db.transaction(() => {
    db.exec(`
      CREATE TABLE jornadas_nova (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        visitante_id     INTEGER REFERENCES visitantes(id),
        area_id          TEXT    NOT NULL,
        cargo_texto      TEXT,
        setor_texto      TEXT,
        descricao_livre  TEXT,
        versao_catalogo  TEXT    NOT NULL,
        data_catalogo    TEXT    NOT NULL,
        resposta_json    TEXT    NOT NULL,
        criado_em        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO jornadas_nova (id, visitante_id, area_id, cargo_texto, setor_texto, descricao_livre,
                                 versao_catalogo, data_catalogo, resposta_json, criado_em)
        SELECT id, visitante_id, area_id, cargo_texto, setor_texto, descricao_livre,
               versao_catalogo, data_catalogo, resposta_json, criado_em FROM jornadas;
      DROP TABLE jornadas;
      ALTER TABLE jornadas_nova RENAME TO jornadas;
      CREATE INDEX IF NOT EXISTS idx_jornadas_visitante ON jornadas(visitante_id);
    `);
    const problemas = db.pragma("foreign_key_check");
    if (problemas.length) throw new Error("Migração de jornadas deixou referências inválidas");
  })();
  db.pragma("foreign_keys = ON");
}

// Acrescenta colunas novas sem apagar dados de bancos já existentes.
function garantirColunas(tabela, colunas) {
  const existentes = new Set(db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name));
  for (const [nome, tipo] of colunas) {
    if (!existentes.has(nome)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${nome} ${tipo}`);
  }
}
garantirColunas("consultas_ia", [
  ["conteudo_json", "TEXT"],        // resposta completa da API, reenviada sem alteração no próximo turno
  ["stop_reason", "TEXT"],
  ["tokens_entrada", "INTEGER"],
  ["tokens_saida", "INTEGER"],
  ["tokens_cache_lidos", "INTEGER"]
]);

module.exports = db;
