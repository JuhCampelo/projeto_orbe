const express = require("express");
const db = require("../db");
const cat = require("../catalogo");
const { recomendar, missoesDoTexto, cartoesDocumentais } = require("../recomendador");
const ia = require("../ia");

const inserirConsulta = db.prepare(`
  INSERT INTO consultas_ia (jornada_id, provedor, modelo, pergunta, resposta, conteudo_json, stop_reason,
                            tokens_entrada, tokens_saida, tokens_cache_lidos)
  VALUES (?, 'anthropic', ?, ?, ?, ?, ?, ?, ?, ?)`);
const ultimaConsulta = db.prepare("SELECT resposta FROM consultas_ia WHERE jornada_id = ? AND resposta IS NOT NULL ORDER BY id DESC LIMIT 1");

// Gera a etapa 3 (cartões) com a IA e guarda pedido + resposta em consultas_ia.
// Se a IA estiver desligada ou falhar, os cartões saem só com dados do catálogo.
async function gerarEtapa3(jornadaId, missoes, documental) {
  const semIa = (status) => ({ etapa3: cartoesDocumentais(documental), descoberta_status: status });
  if (!ia.ativo) return semIa("desligada");
  const jornada = db.prepare("SELECT * FROM jornadas WHERE id = ?").get(jornadaId);
  const lista = missoes.map((m) => ({ missao_id: m.id, origem: m.origem }));
  try {
    const r = await ia.gerarDescoberta(jornada, lista, documental);
    inserirConsulta.run(
      jornadaId, r.modelo, r.pedido, r.descoberta ? JSON.stringify(r.descoberta) : null, JSON.stringify(r.conteudo),
      r.stop_reason, r.uso?.input_tokens ?? null, r.uso?.output_tokens ?? null, r.uso?.cache_read_input_tokens ?? null
    );
    if (!r.descoberta) {
      console.error(`IA sem resultado (stop_reason=${r.stop_reason}) na jornada ${jornadaId}`);
      return semIa("falhou");
    }
    return { etapa3: r.descoberta, descoberta_status: "gerada" };
  } catch (erro) {
    if (erro instanceof ia.Anthropic.AuthenticationError) console.error("Anthropic: chave inválida");
    else if (erro instanceof ia.Anthropic.RateLimitError) console.error("Anthropic: limite de requisições");
    else if (erro instanceof ia.Anthropic.APIError) console.error(`Anthropic ${erro.status}: ${erro.message}`);
    else console.error("Falha ao gerar a etapa 3:", erro);
    return semIa("falhou");
  }
}

const router = express.Router();
const MAX_MISSOES = 3;

const textoOpcional = (valor, max) => {
  if (valor === undefined || valor === null) return { ok: true, valor: null };
  if (typeof valor !== "string") return { ok: false };
  const limpo = valor.trim();
  if (limpo.length > max) return { ok: false };
  return { ok: true, valor: limpo || null };
};

const buscarVisitante = db.prepare("SELECT id FROM visitantes WHERE id = ?");
const inserirJornada = db.prepare(`
  INSERT INTO jornadas (visitante_id, area_id, cargo_texto, setor_texto, descricao_livre,
                        versao_catalogo, data_catalogo, resposta_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const inserirMissao = db.prepare("INSERT INTO jornada_missoes (jornada_id, missao_id, origem) VALUES (?, ?, ?)");
const inserirExibida = db.prepare(`
  INSERT INTO recomendacoes_exibidas (jornada_id, missao_id, rota_id, tarefa_id, configuracao_id, tipo_vinculo, posicao_exibicao)
  VALUES (?, ?, ?, ?, ?, ?, ?)`);

const salvar = db.transaction((dados, missoes, resposta) => {
  const r = inserirJornada.run(
    dados.visitante_id, dados.area, dados.cargo, dados.setor, dados.descricao,
    resposta.versao_catalogo, resposta.data_catalogo, JSON.stringify(resposta)
  );
  const jornadaId = Number(r.lastInsertRowid);
  for (const m of missoes) inserirMissao.run(jornadaId, m.id, m.origem);

  let posicao = 0;
  for (const m of resposta.missoes) {
    for (const rota of m.rotas) {
      for (const c of rota.candidatos_sem_ranking) {
        inserirExibida.run(jornadaId, m.missao_id, rota.rota_id, null, c.configuracao_id, "rota_generica", ++posicao);
      }
    }
    for (const t of m.tarefas_exemplo) {
      for (const c of t.candidatos_sem_ranking) {
        inserirExibida.run(jornadaId, m.missao_id, null, t.tarefa_id, c.configuracao_id, "tarefa_candidato", ++posicao);
      }
      for (const c of t.alternativas_condicionais) {
        inserirExibida.run(jornadaId, m.missao_id, null, t.tarefa_id, c.configuracao_id, "tarefa_alternativa_condicional", ++posicao);
      }
    }
  }
  return jornadaId;
});

// POST /api/jornadas  {visitante_id, area, missoes[], cargo?, setor?, descricao?}
router.post("/", async (req, res) => {
  const body = req.body || {};
  const erros = [];

  // visitante_id é opcional enquanto a tela de cadastro não estiver no front.
  const semVisitante = body.visitante_id === undefined || body.visitante_id === null;
  const visitanteId = semVisitante ? null : Number(body.visitante_id);
  if (!semVisitante && (!Number.isInteger(visitanteId) || !buscarVisitante.get(visitanteId))) erros.push("visitante_id: visitante não encontrado");

  if (typeof body.area !== "string" || !cat.mapa.areas[body.area]) erros.push("area: valor inválido");

  const cargo = textoOpcional(body.cargo, 80);
  const setor = textoOpcional(body.setor, 80);
  const descricao = textoOpcional(body.descricao, 240);
  if (!cargo.ok) erros.push("cargo: até 80 caracteres");
  if (!setor.ok) erros.push("setor: até 80 caracteres");
  if (!descricao.ok) erros.push("descricao: até 240 caracteres");

  const escolhidas = body.missoes === undefined ? [] : body.missoes;
  if (!Array.isArray(escolhidas) || escolhidas.length > MAX_MISSOES ||
      new Set(escolhidas).size !== escolhidas.length ||
      escolhidas.some((m) => typeof m !== "string" || !cat.mapa.missoes[m])) {
    erros.push(`missoes: lista de até ${MAX_MISSOES} ids válidos, sem repetição`);
  }

  if (erros.length) return res.status(400).json({ erros });

  // Mesma regra do frontend: pelo menos uma missão ou descrição com 12+ caracteres.
  const textoValido = descricao.valor && descricao.valor.length >= 12;
  if (escolhidas.length === 0 && !textoValido) {
    return res.status(400).json({ erros: ["missoes: escolha ao menos uma missão ou descreva a necessidade (12+ caracteres)"] });
  }

  const doTexto = textoValido ? missoesDoTexto(descricao.valor).filter((m) => !escolhidas.includes(m)) : [];
  const missoes = [
    ...escolhidas.map((id) => ({ id, origem: "selecionada" })),
    ...doTexto.map((id) => ({ id, origem: "texto" }))
  ];
  if (missoes.length === 0) {
    return res.status(422).json({ erros: ["Não identifiquei uma missão na descrição. Selecione ao menos uma tarefa."] });
  }

  const resposta = recomendar(body.area, missoes.map((m) => m.id));
  const jornadaId = salvar(
    { visitante_id: visitanteId, area: body.area, cargo: cargo.valor, setor: setor.valor, descricao: descricao.valor },
    missoes,
    resposta
  );
  const descoberta = await gerarEtapa3(jornadaId, missoes, resposta);
  res.status(201).json({ jornada_id: jornadaId, ...resposta, ...descoberta });
});

// GET /api/jornadas/:id: devolve a etapa 3 exatamente como foi mostrada.
const buscarJornada = db.prepare("SELECT id, resposta_json FROM jornadas WHERE id = ?");
router.get("/:id", (req, res) => {
  const linha = buscarJornada.get(Number(req.params.id));
  if (!linha) return res.status(404).json({ erros: ["jornada não encontrada"] });
  const consulta = ultimaConsulta.get(linha.id);
  res.json({
    jornada_id: linha.id,
    ...JSON.parse(linha.resposta_json),
    etapa3: consulta ? JSON.parse(consulta.resposta) : cartoesDocumentais(JSON.parse(linha.resposta_json)),
    descoberta_status: consulta ? "gerada" : "documental"
  });
});

module.exports = router;
