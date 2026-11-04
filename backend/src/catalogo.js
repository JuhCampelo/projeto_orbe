// Carrega o catálogo do chefe (BASE_CONSULTA_PROJETO.json) e o mapa do frontend.
// O catálogo é usado só para leitura: nada aqui altera os arquivos de origem.
const fs = require("fs");
const path = require("path");

const DADOS = path.join(__dirname, "..", "dados");

function lerJson(nome) {
  return JSON.parse(fs.readFileSync(path.join(DADOS, nome), "utf8"));
}

const base = lerJson("BASE_CONSULTA_PROJETO.json");
const mapa = lerJson("mapa_frontend.json");
// jsonl/fornecedores.jsonl do pacote ia_modelos_aplicacoes_v2 (cópia sem alteração): nome do fabricante nos cartões.
const listaFornecedores = fs.readFileSync(path.join(DADOS, "fornecedores.jsonl"), "utf8")
  .split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));

const indexar = (lista) => new Map(lista.map((item) => [item.id, item]));
const configuracoes = indexar(base.configuracoes);
const aplicacoes = indexar(base.aplicacoes);
const modelos = indexar(base.modelos);
const capacidades = indexar(base.capacidades);
const fontes = indexar(base.fontes);
const rotas = indexar(base.rotas_genericas);
const fornecedores = indexar(listaFornecedores);
const tarefas = base.tarefas;

// Confere, ao iniciar, se todo ID usado no mapa existe no catálogo.
// Se algum não existir, o servidor não sobe (evita mostrar algo que não está nos documentos).
function validar() {
  const erros = [];
  const areasCatalogo = new Set(tarefas.map((t) => t.area));
  for (const [id, area] of Object.entries(mapa.areas)) {
    for (const nome of area.areas_catalogo) {
      if (!areasCatalogo.has(nome)) erros.push(`área "${id}": "${nome}" não existe em tarefas[].area`);
    }
  }
  for (const [id, missao] of Object.entries(mapa.missoes)) {
    for (const r of missao.rotas) if (!rotas.has(r)) erros.push(`missão "${id}": rota ${r} inexistente`);
    for (const c of missao.capacidades) if (!capacidades.has(c)) erros.push(`missão "${id}": capacidade ${c} inexistente`);
  }
  const configsUsadas = [
    ...base.rotas_genericas.flatMap((r) => r.configuracoes_ids),
    ...tarefas.flatMap((t) => [...t.candidatos_sem_ranking, ...t.alternativas_condicionais])
  ];
  for (const c of configsUsadas) {
    const cfg = configuracoes.get(c);
    if (!cfg) { erros.push(`configuração ${c} inexistente`); continue; }
    if (!aplicacoes.has(cfg.aplicacao_id)) erros.push(`configuração ${c}: aplicação ${cfg.aplicacao_id} inexistente`);
    if (cfg.modelo_id && !modelos.has(cfg.modelo_id)) erros.push(`configuração ${c}: modelo ${cfg.modelo_id} inexistente`);
    for (const f of cfg.fontes_ids) if (!fontes.has(f)) erros.push(`configuração ${c}: fonte ${f} inexistente`);
  }
  for (const app of base.aplicacoes) {
    if (!fornecedores.has(app.fornecedor_id)) erros.push(`aplicação ${app.id}: fornecedor ${app.fornecedor_id} inexistente`);
  }
  if (erros.length) throw new Error("Catálogo/mapa inconsistente:\n- " + erros.join("\n- "));
}
validar();

module.exports = {
  versao: base.schema_version,
  dataReferencia: base.data_referencia,
  status: base.status,
  regras: base.regras,
  mapa,
  configuracoes,
  aplicacoes,
  modelos,
  capacidades,
  fontes,
  rotas,
  fornecedores,
  tarefas
};
