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

const tools = [
  { id: "copilot", name: "Microsoft 365 Copilot", maker: "Microsoft", monogram: "M", tasks: ["escrita", "pesquisa", "dados", "apresentacoes", "reunioes", "documentos"], areas: ["administrativo", "marketing", "dados", "rh", "vendas"], description: "Assistente integrado aos aplicativos Microsoft 365 para ajudar com documentos, planilhas, apresentações e reuniões.", why: "Boa opção se sua empresa já trabalha com Microsoft 365: conecta tarefas do dia a dia ao contexto dos aplicativos.", strengths: "Integração com o ecossistema Microsoft 365.", limits: "Disponibilidade e recursos dependem do plano, da licença e das configurações da organização.", alternatives: "Google Workspace com Gemini · ChatGPT", url: "https://www.microsoft.com/microsoft-365/copilot" },
  { id: "gemini", name: "Gemini para Google Workspace", maker: "Google", monogram: "G", tasks: ["escrita", "pesquisa", "dados", "apresentacoes", "reunioes", "documentos", "ideias"], areas: ["administrativo", "marketing", "dados", "rh", "vendas"], description: "Assistente de IA integrado às ferramentas Google Workspace, com recursos que variam conforme a edição e as configurações.", why: "Faz sentido para equipes que já criam, colaboram e se organizam no ecossistema Google.", strengths: "Integração com aplicativos Google Workspace elegíveis.", limits: "Recursos, elegibilidade e tratamento de dados variam por plano e configuração.", alternatives: "Microsoft 365 Copilot · ChatGPT", url: "https://workspace.google.com/solutions/ai/" },
  { id: "chatgpt", name: "ChatGPT", maker: "OpenAI", monogram: "◉", tasks: ["escrita", "pesquisa", "dados", "apresentacoes", "codigo", "documentos", "ideias"], areas: ["administrativo", "marketing", "tecnologia", "dados", "rh", "vendas", "atendimento", "outra"], description: "Assistente versátil para explorar ideias, redigir, analisar arquivos e apoiar tarefas de diferentes áreas.", why: "É uma escolha flexível quando a missão varia ou você quer explorar várias formas de apoio em uma interface.", strengths: "Ampla variedade de tarefas e fluxo de conversa iterativo.", limits: "Respostas podem conter erros; revise resultados e não compartilhe dados confidenciais sem autorização.", alternatives: "Claude · Gemini", url: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", maker: "Anthropic", monogram: "C", tasks: ["escrita", "pesquisa", "documentos", "codigo", "ideias"], areas: ["administrativo", "marketing", "tecnologia", "rh", "vendas", "outra"], description: "Assistente de IA para escrita, análise de documentos, raciocínio e apoio a tarefas de programação.", why: "Pode ser uma boa alternativa para missões centradas em texto longo, análise de conteúdo ou desenvolvimento.", strengths: "Assistência conversacional para escrita, leitura e código.", limits: "Recursos e limites de uso variam; valide fatos e resultados antes de utilizá-los.", alternatives: "ChatGPT · Gemini", url: "https://claude.ai/" },
  { id: "github-copilot", name: "GitHub Copilot", maker: "GitHub", monogram: "⌘", tasks: ["codigo", "automacao"], areas: ["tecnologia"], description: "Assistente de programação que ajuda a escrever e compreender código em ambientes de desenvolvimento compatíveis.", why: "É a opção mais diretamente ligada à missão de desenvolver software no fluxo de trabalho de quem programa.", strengths: "Sugestões de código e suporte integrado ao desenvolvimento.", limits: "Código sugerido precisa ser revisado, testado e avaliado conforme as políticas da organização.", alternatives: "ChatGPT · Claude", url: "https://github.com/features/copilot" },
  { id: "notebooklm", name: "NotebookLM", maker: "Google", monogram: "N", tasks: ["pesquisa", "documentos", "reunioes", "ideias"], areas: ["administrativo", "marketing", "dados", "rh", "vendas", "outra"], description: "Ferramenta de pesquisa e síntese baseada nas fontes que você adiciona a um notebook.", why: "Alinha-se a quem precisa estudar documentos e organizar respostas com base em materiais de referência.", strengths: "Trabalha com fontes fornecidas e apresenta referências ligadas ao conteúdo.", limits: "A qualidade depende das fontes e dos recursos disponíveis na região e na conta.", alternatives: "ChatGPT · Claude", url: "https://notebooklm.google.com/" },
  { id: "canva", name: "Canva Magic Studio", maker: "Canva", monogram: "✿", tasks: ["apresentacoes", "imagem", "video", "ideias"], areas: ["marketing", "vendas", "rh", "outra"], description: "Recursos de criação com IA dentro do ambiente visual do Canva, para apoiar peças, apresentações e conteúdo.", why: "Combina com missões visuais que precisam virar materiais editáveis e prontos para compartilhar.", strengths: "Criação visual em um fluxo de design acessível.", limits: "Recursos de IA disponíveis dependem do produto, plano e região.", alternatives: "Adobe Firefly · Google Slides", url: "https://www.canva.com/magic/" },
  { id: "adobe-firefly", name: "Adobe Firefly", maker: "Adobe", monogram: "A", tasks: ["imagem", "video"], areas: ["marketing", "outra"], description: "Ferramentas generativas da Adobe para criar e editar conteúdo visual dentro de seu ecossistema.", why: "Uma alternativa focada em imagem e criação visual, especialmente para fluxos já ligados à Adobe.", strengths: "Recursos de geração e edição integrados a produtos Adobe compatíveis.", limits: "Disponibilidade e condições de uso variam entre serviços e planos; confira os termos aplicáveis.", alternatives: "Canva Magic Studio · ChatGPT", url: "https://firefly.adobe.com/" },
  { id: "power-automate", name: "Power Automate", maker: "Microsoft", monogram: "↗", tasks: ["automacao"], areas: ["administrativo", "tecnologia", "dados", "rh", "vendas", "atendimento"], description: "Plataforma de automação de fluxos de trabalho, com recursos de IA conforme plano e conectores usados.", why: "Boa opção para investigar automações repetitivas, sobretudo em ambientes que usam ferramentas Microsoft.", strengths: "Automação visual e conectores para serviços compatíveis.", limits: "Conectores premium, licenças, governança e configuração podem ser necessários.", alternatives: "Zapier · Make", url: "https://www.microsoft.com/power-platform/products/power-automate" },
  { id: "zapier", name: "Zapier", maker: "Zapier", monogram: "Z", tasks: ["automacao", "atendimento"], areas: ["administrativo", "marketing", "tecnologia", "vendas", "atendimento"], description: "Plataforma de automação que conecta aplicativos para executar fluxos de trabalho entre serviços compatíveis.", why: "Ajuda a explorar automações entre ferramentas diferentes sem começar desenvolvendo uma integração do zero.", strengths: "Catálogo amplo de integrações e configuração visual de fluxos.", limits: "Limites de tarefas, conectores e recursos dependem do plano; revise permissões e dados compartilhados.", alternatives: "Make · Power Automate", url: "https://zapier.com/" },
  { id: "otter", name: "Otter.ai", maker: "Otter.ai", monogram: "O", tasks: ["reunioes"], areas: ["administrativo", "vendas", "atendimento", "rh", "outra"], description: "Assistente de reuniões que oferece recursos de transcrição e organização, conforme plano e idioma suportado.", why: "Pode apoiar equipes que precisam registrar conversas e encontrar pontos importantes depois.", strengths: "Fluxo dedicado a reuniões e consulta de transcrições.", limits: "Confira suporte a português, consentimento dos participantes e políticas de gravação e retenção.", alternatives: "Microsoft Teams · Google Meet", url: "https://otter.ai/" },
  { id: "zendesk-ai", name: "Zendesk AI", maker: "Zendesk", monogram: "Z", tasks: ["atendimento"], areas: ["atendimento", "vendas"], description: "Recursos de IA voltados à operação de atendimento ao cliente na plataforma Zendesk.", why: "Relevante para equipes que já usam a plataforma e querem explorar IA no suporte.", strengths: "Contexto de atendimento dentro do ecossistema Zendesk.", limits: "Recursos variam por produto e plano; avalie escalonamento humano e qualidade das respostas.", alternatives: "Intercom · Freshdesk", url: "https://www.zendesk.com/service/ai/" },
  { id: "power-bi", name: "Microsoft Power BI", maker: "Microsoft", monogram: "▥", tasks: ["dados"], areas: ["administrativo", "tecnologia", "dados", "vendas"], description: "Plataforma de análise e visualização de dados; recursos de IA disponíveis dependem dos produtos e licenças adotados.", why: "Uma opção para transformar dados empresariais em análises e relatórios visuais.", strengths: "Modelagem, visualização e compartilhamento de relatórios.", limits: "Conexões, governança e recursos avançados exigem configuração; IA não substitui validação dos dados.", alternatives: "Google Sheets · Tableau", url: "https://www.microsoft.com/power-platform/products/power-bi" },
  { id: "gamma", name: "Gamma", maker: "Gamma", monogram: "Γ", tasks: ["apresentacoes"], areas: ["marketing", "vendas", "rh", "outra"], description: "Ferramenta para criar apresentações e outros conteúdos visuais com assistência de IA.", why: "Alinhada a quem quer transformar uma ideia ou estrutura inicial em uma apresentação visual.", strengths: "Criação rápida de rascunhos visuais e apresentações.", limits: "Revise conteúdo, formatação, exportação e limites do plano antes de adotar.", alternatives: "Canva · Microsoft PowerPoint", url: "https://gamma.app/" }
];

const specialistTools = {
  apresentacoes: ["canva", "gamma"],
  atendimento: ["zendesk-ai"],
  automacao: ["power-automate", "zapier"],
  codigo: ["github-copilot"],
  dados: ["power-bi"],
  imagem: ["adobe-firefly", "canva"],
  pesquisa: ["notebooklm"],
  reunioes: ["otter"],
  documentos: ["notebooklm"],
  video: ["canva", "adobe-firefly"]
};

const state = { area: "", selectedMissions: [], custom: "", currentStage: 1, analysisFrameId: null };
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

function identifyCustomTasks(text) {
  const normalized = text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const patterns = [
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
  return patterns.filter(([, pattern]) => pattern.test(normalized)).map(([id]) => id);
}

function getRecommendations() {
  const customTasks = identifyCustomTasks(state.custom);
  const chosenTasks = [...new Set([...state.selectedMissions, ...customTasks])];
  return tools.map((tool) => {
    const taskMatches = chosenTasks.filter((task) => tool.tasks.includes(task));
    const areaMatch = tool.areas.includes(state.area);
    const specialistMatches = taskMatches.filter((task) => specialistTools[task]?.includes(tool.id)).length;
    const score = taskMatches.length * 3 + specialistMatches * 3 + (areaMatch ? 1 : 0);
    return { ...tool, score, specialistMatches, matchedTasks: taskMatches };
  }).filter((tool) => tool.matchedTasks.length > 0)
    .sort((a, b) => b.score - a.score || b.specialistMatches - a.specialistMatches || b.matchedTasks.length - a.matchedTasks.length || a.name.localeCompare(b.name))
    .slice(0, 3);
}

function renderResults() {
  const recommendations = getRecommendations();
  if (recommendations.length === 0) {
    $("#analysis-title").textContent = "Precisamos de mais um detalhe.";
    $("#analysis-detail").textContent = "Não identifiquei uma missão específica na descrição. Volte e selecione ao menos uma tarefa para receber recomendações úteis.";
    $("#journey-actions").hidden = false;
    $("#stage-analysis").hidden = false;
    $("#stage-mission").hidden = true;
    $("#back-button").hidden = false;
    $("#continue-button").disabled = true;
    return;
  }
  const missionNames = state.selectedMissions.map((id) => missions.find((mission) => mission.id === id)?.label).filter(Boolean);
  const context = [state.role, state.sector].filter(Boolean).join(" · ");
  $("#results-intro").textContent = `${context ? `Para ${context}, ` : ""}encontramos ferramentas que podem apoiar suas missões. Comece pela mais compatível e explore as alternativas.`;
  $("#summary-area").textContent = areas.find((area) => area.id === state.area)?.label || "Não informada";
  $("#summary-missions").innerHTML = (missionNames.length ? missionNames : ["Necessidade descrita"]).map((label) => `<span class="summary-tag">${esc(label)}</span>`).join("");
  $("#recommendations").innerHTML = recommendations.map((tool, index) => {
    const matchLabel = index === 0 ? "MAIS COMPATÍVEL" : `${tool.matchedTasks.length} ${tool.matchedTasks.length === 1 ? "MISSÃO" : "MISSÕES"} EM COMUM`;
    return `<article class="tool-card${index === 0 ? " tool-card--featured" : ""}">
      <div class="tool-card-top"><div class="tool-monogram" aria-hidden="true">${tool.monogram}</div><div class="tool-title-wrap"><h2 class="tool-name">${esc(tool.name)}</h2><div class="tool-maker">${esc(tool.maker)}</div></div><span class="match-badge">${matchLabel}</span></div>
      <p class="tool-description">${esc(tool.description)} ${esc(tool.why)}</p>
      <div class="tool-details"><div class="detail-block"><b>Vantagem</b><p>${esc(tool.strengths)}</p></div><div class="detail-block"><b>Atenção</b><p>${esc(tool.limits)}</p></div></div>
      <div class="tool-actions"><a class="tool-link" href="${tool.url}" target="_blank" rel="noopener noreferrer">Conhecer ${esc(tool.name)} ↗</a><span class="tool-alternatives">Alternativas: ${esc(tool.alternatives)}</span></div>
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
  state.analysisFrameId = window.requestAnimationFrame(renderResults);
});
$("#back-button").addEventListener("click", () => {
  if (state.currentStage === 3) {
    window.cancelAnimationFrame(state.analysisFrameId);
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
  window.cancelAnimationFrame(state.analysisFrameId);
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
