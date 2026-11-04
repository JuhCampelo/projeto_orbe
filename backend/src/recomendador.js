// Etapa 3: cruza "o que a pessoa faz" (arquivo 1, tarefas e capacidades)
// com "o que cada IA oferece" (arquivo 2, configurações, aplicações e modelos).
// Saída sempre documental: sem vencedor, sem nota e sem ranking.
const cat = require("./catalogo");

const MODELO_NAO_IDENTIFICADO = "modelo interno não identificado";
const MAX_TAREFAS_EXEMPLO = 2;

function resolverConfiguracao(id) {
  const c = cat.configuracoes.get(id);
  const app = cat.aplicacoes.get(c.aplicacao_id);
  const modelo = c.modelo_id ? cat.modelos.get(c.modelo_id) : null;
  return {
    configuracao_id: c.id,
    aplicacao: app.nome,
    url_produto: app.url_produto,
    modelo: modelo ? modelo.nome : MODELO_NAO_IDENTIFICADO,
    modo: c.modo,
    ferramentas_requeridas: c.ferramentas_requeridas,
    passos_de_uso_propostos: c.passos_de_uso_propostos,
    limites: c.limites,
    status: c.status,
    fontes: c.fontes_ids.map((f) => {
      const fonte = cat.fontes.get(f);
      return { id: fonte.id, titulo: fonte.titulo, url: fonte.url, data_consulta: fonte.data_consulta };
    })
  };
}

function resolverRota(id) {
  const r = cat.rotas.get(id);
  return {
    rota_id: r.id,
    tarefa_generica: r.tarefa_generica,
    entradas: r.entradas,
    saida: r.saida,
    criterios: r.criterios,
    limite: r.limite,
    tipo: r.tipo,
    ligacao_organizacional: r.ligacao_organizacional,
    candidatos_sem_ranking: r.configuracoes_ids.map(resolverConfiguracao)
  };
}

function tarefasExemplo(areaId, missao) {
  const areasCatalogo = new Set(cat.mapa.areas[areaId].areas_catalogo);
  const caps = new Set(missao.capacidades);
  return cat.tarefas
    .filter((t) => areasCatalogo.has(t.area) && t.capacidades_ids.some((c) => caps.has(c)))
    .slice(0, MAX_TAREFAS_EXEMPLO)
    .map((t) => ({
      tarefa_id: t.id,
      organizacao: t.organizacao,
      area: t.area,
      cargo: t.cargo,
      tarefa: t.tarefa,
      entradas: t.entradas,
      saida: t.saida,
      criterio: t.criterio,
      capacidades: t.capacidades_ids.map((c) => ({ id: c, nome: cat.capacidades.get(c).nome })),
      regra_configuracao: t.regra_configuracao,
      candidatos_sem_ranking: t.candidatos_sem_ranking.map(resolverConfiguracao),
      alternativas_condicionais: t.alternativas_condicionais.map(resolverConfiguracao),
      status: t.status,
      fonte_contexto: t.fonte_contexto
    }));
}

// Mesmo reconhecimento de texto livre do front/app.js (identifyCustomTasks),
// para o backend chegar às mesmas missões que o frontend.
const PADROES_TEXTO = [
  ["reunioes", /\b(reuniao|reunioes|transcri|ata|conversa)\b/],
  ["atendimento", /\b(cliente|atendimento|suporte|responder|chat)\b/],
  ["automacao", /\b(automat|processo|repetitiv|integrar|fluxo)\b/],
  ["codigo", /\b(codigo|program|software|desenvolv|aplicativo|site)\b/],
  ["dados", /\b(dados|planilha|analise|relatorio|metricas|grafico)\b/],
  ["apresentacoes", /\b(apresent|slides|visual|pitch)\b/],
  ["imagem", /\b(imagem|ilustr|foto|design|arte)\b/],
  ["video", /\b(video|animacao|filme)\b/],
  ["documentos", /\b(documento|pdf|contrato|arquivo)\b/],
  ["pesquisa", /\b(pesquis|resum|informac|estudar|fontes)\b/],
  ["escrita", /\b(escrever|texto|redac|email|comunic|revis)\b/],
  ["ideias", /\b(ideia|criativ|brainstorm|planej)\b/]
];

function missoesDoTexto(texto) {
  const normalizado = String(texto || "").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[̀-ͯ]/g, "");
  return PADROES_TEXTO.filter(([, p]) => p.test(normalizado)).map(([id]) => id);
}

function recomendar(areaId, missaoIds) {
  return {
    status: cat.status, // "indicacao_documental_provisoria"
    vencedor_comprovado: null,
    data_catalogo: cat.dataReferencia,
    versao_catalogo: cat.versao,
    aviso: "Indicação documental: candidatos vindos de recursos e fontes publicadas, sem teste comparativo local. A ordem de exibição não é ranking. Tarefas TAR-* são propostas do estudo com validação organizacional pendente.",
    status_mapa_frontend: cat.mapa.status,
    area: { id: areaId, label: cat.mapa.areas[areaId].label },
    missoes: missaoIds.map((id) => {
      const missao = cat.mapa.missoes[id];
      return {
        missao_id: id,
        label: missao.label,
        lacuna: missao.lacuna || null,
        rotas: missao.rotas.map(resolverRota),
        tarefas_exemplo: tarefasExemplo(areaId, missao)
      };
    })
  };
}

// ---- Cartões da etapa 3 no mesmo formato do front/app.js ----
// (name, maker, monogram, description, why, strengths, limits, alternatives, url + selo)
const MAX_CARTOES = 3;
const SELO_PROIBIDO = /MELHOR|MAIS\s+COMPAT|VENCEDOR|N[ºO°]?\s*1\b|TOP\b/i;

// Dados fixos do cartão, sempre lidos do catálogo (nunca do texto da IA).
function cartaoBase(configuracaoId) {
  const c = resolverConfiguracao(configuracaoId);
  const cfg = cat.configuracoes.get(configuracaoId);
  const app = cat.aplicacoes.get(cfg.aplicacao_id);
  return {
    configuracao_id: c.configuracao_id,
    name: c.aplicacao,
    maker: cat.fornecedores.get(app.fornecedor_id).nome,
    monogram: c.aplicacao.trim().charAt(0).toUpperCase(),
    modelo: c.modelo,
    modo: c.modo,
    url: c.url_produto,
    limites_catalogo: c.limites,
    fontes: c.fontes
  };
}

function nomesAlternativas(ids, proprio) {
  const nomes = [];
  for (const id of ids) {
    if (id === proprio || !cat.configuracoes.has(id)) continue;
    const c = resolverConfiguracao(id);
    const nome = `${c.aplicacao} (${c.modelo === MODELO_NAO_IDENTIFICADO ? c.modo : c.modelo})`;
    if (!nomes.includes(nome)) nomes.push(nome);
  }
  return nomes.slice(0, 3).join(" · ");
}

function seloSeguro(selo, reserva) {
  const s = String(selo || "").trim().toUpperCase().slice(0, 32);
  return !s || SELO_PROIBIDO.test(s) ? reserva.toUpperCase() : s;
}

// Etapa 3 sem IA (chave ausente ou falha): cartões montados só com dados do catálogo.
function cartoesDocumentais(documental) {
  const vistos = new Set();
  const cartoes = [];
  for (const rodada of [0, 1, 2]) {
    for (const m of documental.missoes) {
      const rota = m.rotas[0];
      const c = rota.candidatos_sem_ranking[rodada];
      if (!c || vistos.has(c.configuracao_id) || cartoes.length >= MAX_CARTOES) continue;
      vistos.add(c.configuracao_id);
      cartoes.push({
        ...cartaoBase(c.configuracao_id),
        selo: seloSeguro(m.label, m.label),
        missoes: [m.missao_id],
        description: `${c.modo} (${c.modelo}). ${c.passos_de_uso_propostos.join(" ")}`,
        why: `Candidata documental para "${rota.tarefa_generica}": entrega ${rota.saida.toLowerCase()}.`,
        strengths: `Critério da rota: ${rota.criterios}.`,
        limits: `${c.limites} ${rota.limite}`.trim(),
        alternatives: nomesAlternativas(rota.candidatos_sem_ranking.map((x) => x.configuracao_id), c.configuracao_id)
      });
    }
  }
  return {
    origem: "documental",
    introducao: "Estas são indicações documentais para as suas missões, a partir da base do estudo (2026-11-03). Nenhuma foi testada em comparação; escolha pela plataforma que você pode usar e confira o resultado.",
    cartoes
  };
}

module.exports = {
  recomendar, missoesDoTexto, resolverConfiguracao, cartaoBase, nomesAlternativas, seloSeguro, cartoesDocumentais,
  MAX_CARTOES, MODELO_NAO_IDENTIFICADO
};
