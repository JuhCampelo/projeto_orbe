// Etapa 3: os cartões vêm do backend (gerados pela IA a partir das respostas, com dados do catálogo do estudo).
// Mesmo domínio do site por padrão; defina window.ORBE_API se o backend estiver em outro endereço.
const API_BASE = window.ORBE_API || "";

// Logos de assets/logos por aplicação do catálogo (aplicacao_id). Sem logo, o cartão mostra a inicial.
const toolLogos = {
  "APP-copilot": "assets/logos/microsoft-365-copilot.ico",
  "APP-gemini": "assets/logos/gemini.png",
  "APP-chatgpt": "assets/logos/chatgpt.png",
  "APP-claude": "assets/logos/claude.ico",
  "APP-notebook": "assets/logos/notebooklm.svg",
  "APP-canva": "assets/logos/canva.png",
  "APP-firefly": "assets/logos/adobe-firefly.png",
  "APP-gamma": "assets/logos/gamma.jpg"
};

const state = {
  area: "",
  custom: "",
  currentStage: 1,
  promptTimer: null,
  analysisController: null,
  identity: (() => {
    try {
      const saved = JSON.parse(localStorage.getItem("orbe-identity") || sessionStorage.getItem("orbe-identity") || "null");
      return saved || { name: "", phone: "", instagram: "" };
    } catch (error) {
      try {
        const sessionSaved = JSON.parse(sessionStorage.getItem("orbe-identity") || "null");
        if (sessionSaved) return sessionSaved;
      } catch (sessionError) {
        console.warn("Não foi possível recuperar os dados de identificação salvos.", sessionError);
      }
      console.warn("Não foi possível recuperar os dados de identificação salvos.", error);
      return { name: "", phone: "", instagram: "" };
    }
  })()
};
const $ = (selector) => document.querySelector(selector);
const welcome = $("#welcome");
const opening = $("#opening");
const journey = $("#journey");
const results = $("#results");
const closing = $("#closing");

function renderQrCode() {
  const image = $("#qr-code");
  const status = $("#qr-status");
  const siteLink = $("#qr-site-link");
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  const hostname = url.hostname.toLowerCase();
  const isLocalAddress = hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".test")
    || hostname.endsWith(".invalid")
    || hostname === "[::1]"
    || /^(0|10|127)\./.test(hostname)
    || /^169\.254\./.test(hostname)
    || /^192\.168\./.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

  if (url.protocol !== "https:" || isLocalAddress) {
    return;
  }

  siteLink.href = url.href;
  siteLink.textContent = url.href;
  siteLink.hidden = false;
  image.src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=svg&ecc=Q&margin=12&color=0B192C&bgcolor=F8F9FA&data=${encodeURIComponent(url.href)}`;
  image.hidden = false;
  status.hidden = true;
}

$("#qr-code").addEventListener("error", () => {
  $("#qr-code").hidden = true;
  $("#qr-status").textContent = "Não foi possível carregar o QR Code agora. Use o endereço público abaixo para acessar o Orbe.";
  $("#qr-status").hidden = false;
});

renderQrCode();
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function setStage(stage) {
  if (state.promptTimer) {
    window.clearInterval(state.promptTimer);
    state.promptTimer = null;
  }

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
    : "Descreva o que você gostaria de realizar ou melhorar no seu trabalho.";
  $("#progress-fill").style.width = isProfile ? "3%" : "50%";
  document.querySelectorAll(".progress-node").forEach((node, index) => {
    node.classList.toggle("progress-node--active", index === (stage === 1 ? 0 : stage === 2 ? 1 : 2));
  });
  $("#back-button").hidden = isProfile;
  if (isProfile) {
    typeAreaPrompt();
    $("#continue-button").disabled = !state.area.trim();
    $("#selection-hint").textContent = state.area ? "Área informada" : "Informe sua área de atuação para continuar";
  } else if (isMission) {
    typeMissionPrompt();
    updateMissionAction();
  }
}

function typeAreaPrompt() {
  const prompt = $("#area-prompt-text");
  const cursor = $(".typing-cursor");
  const message = "Onde você atua?";
  prompt.textContent = "";
  cursor.hidden = false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    prompt.textContent = message;
    cursor.hidden = true;
    return;
  }

  let index = 0;
  state.promptTimer = window.setInterval(() => {
    prompt.textContent += message[index];
    index += 1;
    if (index === message.length) {
      window.clearInterval(state.promptTimer);
      state.promptTimer = null;
      cursor.hidden = true;
    }
  }, 75);
}

function typeMissionPrompt() {
  const prompt = $("#mission-prompt-text");
  const cursor = prompt.nextElementSibling;
  const message = "Qual é a sua missão?";
  prompt.textContent = "";
  cursor.hidden = false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    prompt.textContent = message;
    cursor.hidden = true;
    return;
  }

  let index = 0;
  state.promptTimer = window.setInterval(() => {
    prompt.textContent += message[index];
    index += 1;
    if (index === message.length) {
      window.clearInterval(state.promptTimer);
      state.promptTimer = null;
      cursor.hidden = true;
    }
  }, 75);
}

function updateMissionAction() {
  const valid = Boolean(state.custom.trim());
  $("#continue-button").disabled = !valid;
  $("#selection-hint").textContent = valid ? "Missão informada" : "Descreva sua missão para continuar";
}

function openJourney() {
  if (!state.identity.name || !state.identity.phone || !state.identity.instagram) {
    showIdentityForm();
    return;
  }
  hideIdentityForm();
  opening.hidden = true;
  welcome.hidden = true;
  results.hidden = true;
  closing.hidden = true;
  journey.hidden = false;
  $("#area-input").value = state.area;
  $("#custom-input").value = state.custom;
  setStage(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showIdentityForm() {
  const form = $("#identity-form");
  if (!form) return;
  form.classList.remove("is-hidden");
  form.classList.add("is-visible");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideIdentityForm() {
  const form = $("#identity-form");
  if (!form) return;
  form.classList.add("is-hidden");
  form.classList.remove("is-visible");
  $("#identity-error").textContent = "";
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}

function normalizeInstagram(value) {
  return String(value || "").trim().replace(/\s+/g, "").replace(/^@+/, "");
}

function formatInstagramInput(value) {
  const cleaned = normalizeInstagram(value);
  return cleaned ? `@${cleaned}` : "";
}

function saveIdentityProfile(data) {
  try {
    localStorage.setItem("orbe-identity", JSON.stringify(data));
  } catch (error) {
    try {
      sessionStorage.setItem("orbe-identity", JSON.stringify(data));
    } catch (sessionError) {
      console.warn("Não foi possível persistir os dados de identificação no navegador.", sessionError);
    }
  }
  state.identity = data;
}

function validateIdentityForm() {
  const name = $("#identity-name").value.trim();
  const phone = $("#identity-phone").value.trim();
  const instagram = normalizeInstagram($("#identity-instagram").value);

  if (name.length < 2) {
    return "Informe seu nome completo para continuar.";
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return "Informe um telefone ou WhatsApp válido.";
  }
  if (instagram.length < 2) {
    return "Informe seu usuário do Instagram.";
  }
  return "";
}

function submitIdentityForm(event) {
  event.preventDefault();
  const error = validateIdentityForm();
  const errorNode = $("#identity-error");

  if (error) {
    errorNode.textContent = error;
    return;
  }

  const payload = {
    name: $("#identity-name").value.trim(),
    phone: formatPhone($("#identity-phone").value),
    instagram: `@${normalizeInstagram($("#identity-instagram").value)}`
  };

  errorNode.textContent = "";
  const saved = state.identity || {};
  const unchanged = saved.visitorId && saved.name === payload.name && saved.phone === payload.phone && saved.instagram === payload.instagram;
  saveIdentityProfile(unchanged ? { ...payload, visitorId: saved.visitorId } : payload);
  if (!unchanged) registerVisitor(payload);
  openJourney();
}

async function registerVisitor(payload) {
  try {
    const response = await fetch(`${API_BASE}/api/visitantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: payload.name, telefone: payload.phone, instagram: payload.instagram })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    saveIdentityProfile({ ...state.identity, visitorId: data.visitante_id });
  } catch (error) {
    console.warn("Não foi possível registrar o cadastro no servidor.", error);
  }
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
        visitante_id: state.identity && state.identity.visitorId ? state.identity.visitorId : undefined,
        area_texto: state.area,
        descricao: state.custom.trim()
      }),
      signal: controller.signal
    });
    data = await response.json();
    if (response.status === 422) {
      showAnalysisMessage("Precisamos de mais um detalhe.", "Não identifiquei uma missão específica na descrição. Volte e explique sua necessidade com mais detalhes para receber recomendações úteis.");
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
    showAnalysisMessage("Precisamos de mais um detalhe.", "Não identifiquei uma missão específica na descrição. Volte e explique sua necessidade com mais detalhes para receber recomendações úteis.");
    return;
  }
  $("#results-intro").textContent = data.etapa3.introducao || "";
  $("#summary-area").textContent = state.area || "Não informada";
  $("#summary-missions").innerHTML = `<span class="summary-tag">${esc(state.custom.trim() || "Necessidade descrita")}</span>`;
  const sourceNote = document.querySelector(".journey-summary .summary-note");
  if (sourceNote) {
    sourceNote.innerHTML = data.etapa3.origem === "ia"
      ? `<span>◈</span> Indicações escritas por IA a partir das suas respostas e da base do estudo (${esc(data.data_catalogo || "")}) — sem teste comparativo entre as ferramentas.`
      : `<span>◈</span> Indicações da base do estudo (${esc(data.data_catalogo || "")}) para a missão descrita — sem teste comparativo entre as ferramentas.`;
  }
  $("#recommendations").innerHTML = recommendations.map((tool, index) => {
    const logo = toolLogos[tool.aplicacao_id];
    const mark = logo
      ? `<img class="tool-logo" src="${esc(logo)}" alt=""><span hidden>${esc(tool.monogram)}</span>`
      : `<span>${esc(tool.monogram)}</span>`;
    return `<article class="tool-card${index === 0 ? " tool-card--featured" : ""}">
      <div class="tool-card-top"><div class="tool-monogram" aria-hidden="true">${mark}</div><div class="tool-title-wrap"><h2 class="tool-name">${esc(tool.name)}</h2><div class="tool-maker">${esc(tool.maker)}</div></div><span class="match-badge">${esc(tool.selo)}</span></div>
      <p class="tool-description">${esc(tool.description)} ${esc(tool.why)}</p>
      <div class="tool-details"><div class="detail-block"><b>Vantagem</b><p>${esc(tool.strengths)}</p></div><div class="detail-block"><b>Atenção</b><p>${esc(tool.limits)}</p></div></div>
      <div class="tool-actions"><a class="tool-link" href="${esc(tool.url)}" target="_blank" rel="noopener noreferrer">Conhecer ${esc(tool.name)} ↗</a><span class="tool-alternatives">${tool.alternatives ? `Alternativas: ${esc(tool.alternatives)}` : ""}</span></div>
    </article>`;
  }).join("");
  $("#progress-fill").style.width = "100%";
  document.querySelectorAll(".progress-node").forEach((node) => node.classList.toggle("progress-node--active", node.textContent.includes("03")));
  journey.hidden = true;
  results.hidden = false;
  closing.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#recommendations").addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.classList.contains("tool-logo")) return;
  image.hidden = true;
  if (image.nextElementSibling) image.nextElementSibling.hidden = false;
}, true);

$("#start-button").addEventListener("click", () => {
  showIdentityForm();
});
$("#enter-orbe-button").addEventListener("click", () => {
  opening.hidden = true;
  welcome.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("#closing-button").addEventListener("click", () => {
  results.hidden = true;
  closing.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("#closing-back-button").addEventListener("click", () => {
  closing.hidden = true;
  results.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("#identity-phone").addEventListener("input", (event) => {
  event.target.value = formatPhone(event.target.value);
});
$("#identity-instagram").addEventListener("input", (event) => {
  event.target.value = formatInstagramInput(event.target.value);
});
$("#identity-form").addEventListener("submit", submitIdentityForm);
$("#identity-name").value = state.identity.name || "";
$("#identity-phone").value = state.identity.phone || "";
$("#identity-instagram").value = state.identity.instagram ? formatInstagramInput(state.identity.instagram) : "";
showIdentityForm();
$("#area-input").addEventListener("input", (event) => {
  state.area = event.target.value.trim();
  $("#continue-button").disabled = !state.area;
  $("#selection-hint").textContent = state.area ? "Área informada" : "Informe sua área de atuação para continuar";
});
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
function restartJourney() {
  if (state.analysisController) state.analysisController.abort();
  state.area = "";
  state.custom = "";
  $("#area-input").value = "";
  $("#custom-input").value = "";
  results.hidden = true;
  closing.hidden = true;
  opening.hidden = true;
  welcome.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$("#restart-button").addEventListener("click", restartJourney);
$("#closing-restart-button").addEventListener("click", restartJourney);
