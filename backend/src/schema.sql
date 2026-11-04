-- Banco próprio do Orbe: guarda o que o visitante respondeu e o que foi mostrado a ele.
-- O catálogo de IA continua nos arquivos do chefe (dados/BASE_CONSULTA_PROJETO.json).

CREATE TABLE IF NOT EXISTS visitantes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  nome               TEXT    NOT NULL,
  email              TEXT    NOT NULL,
  instagram          TEXT,
  consentimento_lgpd INTEGER NOT NULL DEFAULT 0 CHECK (consentimento_lgpd IN (0, 1)),
  criado_em          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_visitantes_email ON visitantes(email);

-- Uma jornada = uma passagem pelas etapas 1, 2 e 3.
CREATE TABLE IF NOT EXISTS jornadas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  visitante_id     INTEGER REFERENCES visitantes(id),  -- null enquanto o front não tiver cadastro
  area_id          TEXT    NOT NULL,          -- etapa 1 (ids do front/app.js)
  cargo_texto      TEXT,                      -- etapa 1, campo opcional
  setor_texto      TEXT,                      -- etapa 1, campo opcional
  descricao_livre  TEXT,                      -- etapa 2, "Ou conte um pouco mais"
  versao_catalogo  TEXT    NOT NULL,          -- ex.: 2.0-consulta-chat
  data_catalogo    TEXT    NOT NULL,          -- ex.: 2026-11-03
  resposta_json    TEXT    NOT NULL,          -- etapa 3 exatamente como foi devolvida
  criado_em        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_jornadas_visitante ON jornadas(visitante_id);

-- Etapa 2: missões escolhidas (ou reconhecidas na descrição livre).
CREATE TABLE IF NOT EXISTS jornada_missoes (
  jornada_id INTEGER NOT NULL REFERENCES jornadas(id),
  missao_id  TEXT    NOT NULL,
  origem     TEXT    NOT NULL CHECK (origem IN ('selecionada', 'texto')),
  PRIMARY KEY (jornada_id, missao_id)
);

-- Etapa 3 em linhas: cada candidato mostrado, com os IDs do catálogo.
-- posicao_exibicao é só a ordem na tela, NÃO é ranking.
CREATE TABLE IF NOT EXISTS recomendacoes_exibidas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  jornada_id       INTEGER NOT NULL REFERENCES jornadas(id),
  missao_id        TEXT    NOT NULL,
  rota_id          TEXT,                      -- U01..U22 (null quando veio de tarefa)
  tarefa_id        TEXT,                      -- TAR-* (null quando veio de rota)
  configuracao_id  TEXT    NOT NULL,          -- C01..C44
  tipo_vinculo     TEXT    NOT NULL CHECK (tipo_vinculo IN ('rota_generica', 'tarefa_candidato', 'tarefa_alternativa_condicional')),
  posicao_exibicao INTEGER NOT NULL,
  status_evidencia TEXT    NOT NULL DEFAULT 'indicacao_documental_provisoria'
);
CREATE INDEX IF NOT EXISTS idx_recomendacoes_jornada ON recomendacoes_exibidas(jornada_id);

-- Chat com IA (Claude), usando o prompt do GUIA: pergunta do visitante e resposta da IA.
-- Colunas novas são acrescentadas por db.js em bancos já criados.
CREATE TABLE IF NOT EXISTS consultas_ia (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  jornada_id INTEGER NOT NULL REFERENCES jornadas(id),
  provedor   TEXT    NOT NULL,
  modelo     TEXT    NOT NULL,
  pergunta   TEXT    NOT NULL,
  resposta   TEXT,
  criado_em  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_consultas_jornada ON consultas_ia(jornada_id);
