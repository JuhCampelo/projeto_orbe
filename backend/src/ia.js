// Etapa 3 "Uma nova descoberta" gerada por Claude a partir das respostas das etapas 1 e 2.
// System prompt = texto integral do GUIA_ORGANOGRAMA_E_PROMPT.md + BASE_CONSULTA_PROJETO.json.
// A chave vem de ANTHROPIC_API_KEY (arquivo .env). Nunca coloque a chave no código.
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;
const cat = require("./catalogo");
const rec = require("./recomendador");

const MODELO = "claude-opus-5-5";
const DADOS = path.join(__dirname, "..", "dados");

const ativo = Boolean(process.env.ANTHROPIC_API_KEY);
const client = ativo ? new Anthropic({ timeout: 120_000 }) : null;

const instrucoes = fs.readFileSync(path.join(DADOS, "INSTRUCOES_RECOMENDADOR.md"), "utf8").trim();
// Mesmo conteúdo do arquivo, só sem espaços de formatação (menos tokens). Texto fixo = cache funciona.
const base = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DADOS, "BASE_CONSULTA_PROJETO.json"), "utf8")));

const SYSTEM = [
  { type: "text", text: instrucoes },
  {
    type: "text",
    text: `Base de consulta anexada ao Projeto: BASE_CONSULTA_PROJETO.json (data de referência ${cat.dataReferencia}). Conteúdo a seguir:\n${base}`,
    cache_control: { type: "ephemeral" }
  }
];

const texto = { type: "string" };
const listaTexto = { type: "array", items: texto };

// Formato da resposta = cartões da etapa 3 do front (name/maker/url vêm do catálogo, não da IA).
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["introducao", "recomendacoes", "status_evidencia", "ids_usados"],
  properties: {
    introducao: texto,
    recomendacoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["configuracao_id", "missoes", "selo", "descricao", "por_que", "vantagem", "atencao", "alternativas_ids"],
        properties: {
          configuracao_id: texto,
          missoes: listaTexto,
          selo: texto,
          descricao: texto,
          por_que: texto,
          vantagem: texto,
          atencao: texto,
          alternativas_ids: listaTexto
        }
      }
    },
    status_evidencia: texto,
    ids_usados: listaTexto
  }
};

// Mensagem montada só com o que o visitante preencheu (campos existentes do front)
// e com os pontos de partida já localizados pelo backend.
function montarPedido(jornada, missoes, documental) {
  const area = cat.mapa.areas[jornada.area_id];
  const linhas = [
    "Um visitante do estande Orbe preencheu as etapas abaixo. Ele não faz perguntas: gere diretamente a etapa 3, \"Uma nova descoberta\", que ele verá na tela.",
    "",
    "Etapa 1 — Vamos nos conhecer:",
    `- Sua área de atuação (texto do visitante): ${jornada.area_texto || (area ? area.label : jornada.area_id)}`,
    `- Cargo ou função: ${jornada.cargo_texto || "não informado"}`,
    `- Setor da empresa: ${jornada.setor_texto || "não informado"}`,
    "",
    "Etapa 2 — O que você quer realizar?:",
    `- Descreva sua missão (texto do visitante): ${jornada.descricao_livre || "não informado"}`,
    missoes.length
      ? "- Missões reconhecidas no texto por palavra-chave (use os mesmos missao_id nos cartões):"
      : "- Nenhuma missão reconhecida por palavra-chave: interprete o texto e deixe \"missoes\" vazio nos cartões.",
    ...missoes.map((m) => `  - "${m.missao_id}": ${cat.mapa.missoes[m.missao_id]?.label || m.missao_id}`),
    "",
    "Pontos de partida já localizados na base pelo backend (ligação proposta pela equipe Orbe, validação pendente):",
    ...(documental.missoes.length ? [] : ["- nenhum: use a base completa a partir do texto do visitante."]),
    ...documental.missoes.map((m) =>
      `- ${m.missao_id}: rotas ${m.rotas.map((r) => `${r.rota_id} (${r.candidatos_sem_ranking.map((c) => c.configuracao_id).join(", ")})`).join("; ")}` +
      `; tarefas análogas ${m.tarefas_exemplo.map((t) => t.tarefa_id).join(", ") || "nenhuma"}${m.lacuna ? `; lacuna: ${m.lacuna}` : ""}`
    ),
    "",
    "Formato da tela: no máximo 3 cartões (\"recomendacoes\"), que juntos cubram as missões. A ordem dos cartões não é ranking. Cada cartão é uma configuração da base (configuracao_id existente):",
    "- missoes: os missao_id que o cartão atende.",
    "- selo: a condição em que esta é a escolha, em até 28 caracteres maiúsculos (ex.: \"SE USA MICROSOFT 365\"). Nunca use palavras de ranking como \"melhor\" ou \"mais compatível\".",
    "- descricao: como usar, em até 3 frases: modo/modelo a selecionar, o que anexar e uma instrução curta entre aspas para colar no chat.",
    "- por_que: o motivo concreto da indicação para o caso do visitante, em 1 ou 2 frases.",
    "- vantagem: o requisito da tarefa que esta configuração atende, em 1 frase.",
    "- atencao: como conferir a entrega e o limite registrado na base, em 1 ou 2 frases.",
    "- alternativas_ids: até 3 configuracao_id da base que servem de alternativa.",
    "- introducao: até 2 frases curtas para o visitante, incluindo o detalhe que faltou e mudaria a escolha, já que não haverá conversa.",
    "Textos curtos, para leitura numa tela. Nos textos que o visitante lê (introducao e cartões), não cite IDs internos (C*, U*, TAR-*, CAP-*, S*, P*): eles vão só em ids_usados e status_evidencia."
  ];
  return linhas.join("\n");
}

// Junta o texto da IA aos dados do catálogo e descarta o que não existir nele (nada inventado chega ao front).
function montarCartoes(saida, missoes, documental) {
  const missoesValidas = new Set(missoes.map((m) => m.missao_id));
  const descartados = [];
  const vistos = new Set();
  const cartoes = [];
  for (const r of saida.recomendacoes) {
    if (!cat.configuracoes.has(r.configuracao_id)) { descartados.push(r.configuracao_id); continue; }
    if (vistos.has(r.configuracao_id) || cartoes.length >= rec.MAX_CARTOES) continue;
    vistos.add(r.configuracao_id);
    for (const id of r.alternativas_ids) if (!cat.configuracoes.has(id)) descartados.push(id);
    const doCartao = r.missoes.filter((m) => missoesValidas.has(m));
    const idReserva = doCartao[0] || missoes[0]?.missao_id;
    const reserva = idReserva ? cat.mapa.missoes[idReserva].label : "Para sua missão";
    cartoes.push({
      ...rec.cartaoBase(r.configuracao_id),
      selo: rec.seloSeguro(r.selo, reserva),
      missoes: doCartao,
      description: r.descricao,
      why: r.por_que,
      strengths: r.vantagem,
      limits: r.atencao,
      alternatives: rec.nomesAlternativas(r.alternativas_ids, r.configuracao_id)
    });
  }
  if (cartoes.length === 0) return null; // nada válido: quem chama usa os cartões documentais

  // Missão que ficou sem cartão: completa com o candidato documental, se ainda houver espaço.
  const reservaDoc = rec.cartoesDocumentais(documental).cartoes;
  for (const m of missoes) {
    if (cartoes.length >= rec.MAX_CARTOES || cartoes.some((c) => c.missoes.includes(m.missao_id))) continue;
    const extra = reservaDoc.find((c) => c.missoes.includes(m.missao_id) && !vistos.has(c.configuracao_id));
    if (extra) { cartoes.push({ ...extra, origem: "documental_sem_ia" }); vistos.add(extra.configuracao_id); }
  }

  return {
    origem: "ia",
    introducao: saida.introducao,
    cartoes,
    status_evidencia: saida.status_evidencia,
    ids_usados: saida.ids_usados,
    ids_descartados: descartados
  };
}

async function gerarDescoberta(jornada, missoes, documental) {
  const pedido = montarPedido(jornada, missoes, documental);
  const response = await client.beta.messages.create({
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    // Se o filtro de segurança recusar por engano, a API tenta de novo no modelo recomendado.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: pedido }]
  });

  const base = { pedido, modelo: response.model, stop_reason: response.stop_reason, conteudo: response.content, uso: response.usage };
  if (response.stop_reason !== "end_turn") return { ...base, descoberta: null };

  const json = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { ...base, json, descoberta: montarCartoes(JSON.parse(json), missoes, documental) };
}

module.exports = { ativo, gerarDescoberta, montarPedido, montarCartoes, SCHEMA, MODELO, Anthropic };
