const areas = [
  { id: "administrativo", label: "Administrativo", icon: "▤" },
  { id: "marketing", label: "Marketing", icon: "✧" },
  { id: "tecnologia", label: "Tecnologia", icon: "⌘" },
  { id: "dados", label: "Dados & análise", icon: "◫" },
  { id: "rh", label: "Pessoas & RH", icon: "♧" },
  { id: "vendas", label: "Vendas", icon: "↗" },
  { id: "atendimento", label: "Atendimento", icon: "◌" },
  { id: "outra", label: "Outra área", icon: "✦" }
];

const missions = [
  { id: "escrita", label: "Escrever e revisar", icon: "✎" },
  { id: "pesquisa", label: "Pesquisar e resumir", icon: "⌕" },
  { id: "dados", label: "Analisar dados", icon: "▥" },
  { id: "apresentacoes", label: "Criar apresentações", icon: "▣" },
  { id: "imagem", label: "Criar imagens", icon: "◈" },
  { id: "codigo", label: "Desenvolver software", icon: "{ }" },
  { id: "automacao", label: "Automatizar tarefas", icon: "⟳" },
  { id: "reunioes", label: "Trabalhar com reuniões", icon: "◉" },
  { id: "atendimento", label: "Atender clientes", icon: "◌" },
  { id: "documentos", label: "Entender documentos", icon: "▤" },
  { id: "video", label: "Criar vídeos", icon: "▷" },
  { id: "ideias", label: "Explorar ideias", icon: "✧" }
];

// Etapa 3: os cartões vêm do backend (gerados pela IA a partir das respostas, com dados do catálogo do estudo).
// Mesmo domínio do site por padrão; defina window.ORBE_API se o backend estiver em outro endereço.
const API_BASE = window.ORBE_API || "";

const state = { area: "", selectedMissions: [], custom: "", currentStage: 1, analysisController: null };
const $ = (selector) => document.querySelector(selector);
const welcome = $("#welcome");
const journey = $("#journey");
const results = $("#results");
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function renderChoices(container, items, selected, multi) {
  container.innerHTML = items.map((item) => {
    const active = multi ? selected.includes(item.id) : selected === item.id;
    return `<button type="button" class="choice-card" data-choice="${item.id}" aria-pressed="${active}"><span class="choice-check" aria-hidden="true">✓</span><span class="choice-icon" aria-hidden="true">${item.icon}</span><span class="choice-title">${item.label}</span></button>`;
  }).join("");
}

function setStage(stage) {
  state.currentStage = stage;
  const isProfile = stage === 1;
  const isMission = stage === 2;
  $("#stage-profile").hidden = !isProfile;
  $("#stage-mission").hidden = !isMission;
  $("#stage-analysis").hidden = stage !== 3;
  $("#journey-actions").hidden = stage === 3;
  $("#step-label").innerHTML = isProfile
    ? 'ETAPA 01 <span class="eyebrow-line"></span> QUEM É VOCÊ?'
    : 'ETAPA 02 <span class="eyebrow-line"></span> SUA MISSÃO';
  $("#journey-title").textContent = isProfile ? "Vamos nos conhecer." : "O que você quer realizar?";
  $("#journey-subtitle").textContent = isProfile
    ? "Assim, Íris pode procurar algo que faça sentido para o seu dia a dia."
    : "Escolha até três tarefas. Cada escolha ajuda a encontrar ferramentas mais relevantes.";
  $("#progress-fill").style.width = isProfile ? "3%" : "50%";
  document.querySelectorAll(".progress-node").forEach((node, index) => {
    node.classList.toggle("progress-node--active", index === (stage === 1 ? 0 : stage === 2 ? 1 : 2));
  });
  $("#back-button").hidden = isProfile;
  if (isProfile) {
    $("#continue-button").disabled = !state.area;
    $("#selection-hint").textContent = state.area ? "Área selecionada" : "Escolha uma área para continuar";
  } else if (isMission) {
    updateMissionAction();
  }
}

function updateMissionAction() {
  const valid = state.selectedMissions.length > 0 || state.custom.trim().length >= 12;
  $("#continue-button").disabled = !valid;
  $("#selection-hint").textContent = state.selectedMissions.length
    ? `${state.selectedMissions.length} de 3 missões selecionadas`
    : state.custom.trim().length >= 12 ? "Necessidade descrita" : "Escolha ao menos uma missão";
}

function openJourney() {
  welcome.hidden = true;
  results.hidden = true;
  journey.hidden = false;
  renderChoices($("#area-options"), areas, state.area, false);
  renderChoices($("#mission-options"), missions, state.selectedMissions, true);
  setStage(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAnalysisMessage(title, detail) {
  $("#analysis-title").textContent = title;
  $("#analysis-detail").textContent = detail;
  $("#journey-actions").hidden = false;
  $("#stage-analysis").hidden = false;
  $("#stage-mission").hidden = true;
  $("#back-button").hidden = false;
  $("#continue-button").disabled = true;
}

async function renderResults() {
  if (state.analysisController) state.analysisController.abort();
  const controller = new AbortController();
  state.analysisController = controller;
  let data;
  try {
    const response = await fetch(`${API_BASE}/api/jornadas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area: state.area,
        missoes: state.selectedMissions,
        cargo: state.role || undefined,
        setor: state.sector || undefined,
        descricao: state.custom.trim() || undefined
      }),
      signal: controller.signal
    });
    data = await response.json();
    if (response.status === 422 || (response.status === 400 && state.selectedMissions.length === 0)) {
      showAnalysisMessage("Precisamos de mais um detalhe.", "Não identifiquei uma missão específica na descrição. Volte e selecione ao menos uma tarefa para receber recomendações úteis.");
      return;
    }
    if (!response.ok) throw new Error((data.erros || []).join(" "));
  } catch (error) {
    if (error.name === "AbortError") return;
    showAnalysisMessage("Não consegui concluir a análise.", "Verifique a conexão com o servidor do Orbe e tente novamente.");
    return;
  }
  if (controller.signal.aborted) return;
  const recommendations = (data.etapa3 && data.etapa3.cartoes) || [];
  if (recommendations.length === 0) {
    showAnalysisMessage("Precisamos de mais um detalhe.", "Não encontrei ferramentas para essa combinação. Volte e selecione outra tarefa.");
    return;
  }
  const missionNames = state.selectedMissions.map((id) => missions.find((mission) => mission.id === id)?.label).filter(Boolean);
  $("#results-intro").textContent = data.etapa3.introducao || "";
  $("#summary-area").textContent = areas.find((area) => area.id === state.area)?.label || "Não informada";
  $("#summary-missions").innerHTML = (missionNames.length ? missionNames : ["Necessidade descrita"]).map((label) => `<span class="summary-tag">${esc(label)}</span>`).join("");
  const sourceNote = document.querySelector(".journey-summary .summary-note");
  if (sourceNote) {
    sourceNote.innerHTML = data.etapa3.origem === "ia"
      ? `<span>◈</span> Indicações escritas por IA a partir das suas respostas e da base do estudo (${esc(data.data_catalogo || "")}) — sem teste comparativo entre as ferramentas.`
      : `<span>◈</span> Indicações da base do estudo (${esc(data.data_catalogo || "")}) para as tarefas e a área selecionadas — sem teste comparativo entre as ferramentas.`;
  }
  $("#recommendations").innerHTML = recommendations.map((tool, index) => {
    return `<article class="tool-card${index === 0 ? " tool-card--featured" : ""}">
      <div class="tool-card-top"><div class="tool-monogram" aria-hidden="true">${esc(tool.monogram)}</div><div class="tool-title-wrap"><h2 class="tool-name">${esc(tool.name)}</h2><div class="tool-maker">${esc(tool.maker)}</div></div><span class="match-badge">${esc(tool.selo)}</span></div>
      <p class="tool-description">${esc(tool.description)} ${esc(tool.why)}</p>
      <div class="tool-details"><div class="detail-block"><b>Vantagem</b><p>${esc(tool.strengths)}</p></div><div class="detail-block"><b>Atenção</b><p>${esc(tool.limits)}</p></div></div>
      <div class="tool-actions"><a class="tool-link" href="${esc(tool.url)}" target="_blank" rel="noopener noreferrer">Conhecer ${esc(tool.name)} ↗</a><span class="tool-alternatives">${tool.alternatives ? `Alternativas: ${esc(tool.alternatives)}` : ""}</span></div>
    </article>`;
  }).join("");
  $("#progress-fill").style.width = "100%";
  document.querySelectorAll(".progress-node").forEach((node) => node.classList.toggle("progress-node--active", node.textContent.includes("03")));
  journey.hidden = true;
  results.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#start-button").addEventListener("click", openJourney);
$("#area-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-choice]");
  if (!button) return;
  state.area = button.dataset.choice;
  renderChoices($("#area-options"), areas, state.area, false);
  $("#continue-button").disabled = false;
  $("#selection-hint").textContent = "Área selecionada";
});
$("#mission-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-choice]");
  if (!button) return;
  const id = button.dataset.choice;
  if (state.selectedMissions.includes(id)) {
    state.selectedMissions = state.selectedMissions.filter((mission) => mission !== id);
  } else if (state.selectedMissions.length < 3) {
    state.selectedMissions.push(id);
  } else {
    $("#selection-hint").textContent = "Limite de 3 missões. Remova uma para escolher outra.";
    return;
  }
  renderChoices($("#mission-options"), missions, state.selectedMissions, true);
  updateMissionAction();
});
$("#role-input").addEventListener("input", (event) => { state.role = event.target.value.trim(); });
$("#sector-input").addEventListener("input", (event) => { state.sector = event.target.value.trim(); });
$("#custom-input").addEventListener("input", (event) => { state.custom = event.target.value; updateMissionAction(); });
$("#continue-button").addEventListener("click", () => {
  if (state.currentStage === 1 && state.area) {
    setStage(2);
    return;
  }
  if (state.currentStage !== 2 || $("#continue-button").disabled) return;
  setStage(3);
  $("#analysis-title").textContent = "Lendo suas missões...";
  $("#analysis-detail").textContent = "Comparando suas necessidades com os pontos fortes de cada ferramenta.";
  renderResults();
});
$("#back-button").addEventListener("click", () => {
  if (state.currentStage === 3) {
    if (state.analysisController) state.analysisController.abort();
    $("#stage-analysis").hidden = true;
    $("#journey-actions").hidden = false;
    setStage(2);
  } else if (state.currentStage === 2) {
    setStage(1);
  } else {
    journey.hidden = true;
    welcome.hidden = false;
  }
});
$("#restart-button").addEventListener("click", () => {
  if (state.analysisController) state.analysisController.abort();
  state.area = "";
  state.role = "";
  state.sector = "";
  state.custom = "";
  state.selectedMissions = [];
  $("#role-input").value = "";
  $("#sector-input").value = "";
  $("#custom-input").value = "";
  results.hidden = true;
  welcome.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
