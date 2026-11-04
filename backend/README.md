# Orbe: backend

Node.js + Express + SQLite. Ele guarda o cadastro e as respostas das etapas e monta a etapa 3 a partir dos documentos do estudo (catálogo de 2026-11-03).

## Rodar
```bash
cd backend
npm install
npm start            # http://localhost:3000 (serve também o ../front)
```
Configuração: copie `.env.example` para `.env` (na pasta `backend/`) e preencha. O `.env` está no `.gitignore` e não vai para o repositório.
- `ANTHROPIC_API_KEY`: liga a geração da etapa 3 pela IA. Sem ela, a etapa 3 sai só com a indicação documental (`descoberta_status: "desligada"`).
- Opcionais: `PORT`, `ORBE_DB` (caminho do banco, padrão `data/orbe.sqlite`), `ORBE_ADMIN_TOKEN` (liga o export CSV), `ORBE_CORS_ORIGIN` (se o front for hospedado em outro domínio, lista separada por vírgula).

## De onde vem cada dado
| Arquivo | Papel no organograma |
|---|---|
| `dados/BASE_CONSULTA_PROJETO.json` | Cópia sem alteração do pacote `ia_modelos_aplicacoes_v2` (SHA256 `9f7dcfa8…6555`, igual ao MANIFESTO). Traz as tarefas e capacidades (arquivo 1) e as configurações, aplicações e modelos (arquivo 2). |
| `dados/mapa_frontend.json` | Ligação **proposta pela equipe Orbe** entre os ids do `front/app.js` e o catálogo (área → áreas das tarefas; missão → rotas U* e capacidades CAP-*). Está pendente de validação. |
| `dados/INSTRUCOES_RECOMENDADOR.md` | Prompt integral do GUIA_ORGANOGRAMA_E_PROMPT.md, usado como system prompt da IA. |

Ao iniciar, `src/catalogo.js` confere se todo ID usado no mapa existe no catálogo. Se algum não existir, o servidor não sobe.

Regras aplicadas (vêm dos documentos): a saída é sempre `indicacao_documental_provisoria` com `vencedor_comprovado: null`; a ordem não é ranking; quando o motor não é identificável, aparece "modelo interno não identificado"; cada candidato traz limites e fontes com data; nada de preço ou disponibilidade regional.

## API
`POST /api/visitantes`
```json
{ "nome": "Ana", "email": "ana@ex.com", "instagram": "@ana", "consentimento": true }
→ 201 { "visitante_id": 1 }
```
`consentimento: true` é obrigatório (LGPD).

`GET /api/opcoes` → `{ areas:[{id,label}], missoes:[{id,label}] }`, com os mesmos ids do `front/app.js`.

`POST /api/jornadas`
```json
{ "visitante_id": 1, "area": "rh", "missoes": ["dados","escrita"],
  "cargo": "opcional", "setor": "opcional", "descricao": "opcional" }
```
Regras iguais às do front: até 3 missões, ou uma descrição com 12+ caracteres (reconhecida pelos mesmos padrões de `identifyCustomTasks`). A resposta (201) traz, para cada missão, `rotas[]` (rota U* com entradas, saída, critérios, limite e `candidatos_sem_ranking[]`) e `tarefas_exemplo[]` (até 2 TAR-* da área, com capacidades, candidatos e alternativas condicionais). Cada candidato traz aplicação, `url_produto`, modelo, modo, passos de uso, limites e fontes.

`visitante_id` é opcional enquanto a tela de cadastro não estiver no front (a jornada fica salva sem vínculo).

A resposta traz sempre `etapa3`, que o `front/app.js` usa para montar a tela "Uma nova descoberta" com os mesmos cartões de antes:
```json
"descoberta_status": "gerada | falhou | desligada",
"etapa3": {
  "origem": "ia | documental",
  "introducao": "texto do topo (#results-intro)",
  "cartoes": [{
    "configuracao_id": "C05", "name": "Claude", "maker": "Anthropic", "monogram": "C", "url": "https://claude.ai",
    "modelo": "Claude Sonnet 5.5", "modo": "...", "selo": "SE HÁ BRIEFING APROVADO", "missoes": ["escrita"],
    "description": "como usar + instrução para colar", "why": "por que para este visitante",
    "strengths": "Vantagem", "limits": "Atenção", "alternatives": "ChatGPT (GPT-6 Sol) · Gemini Apps (Gemini Pro)",
    "limites_catalogo": "...", "fontes": [ ... ]
  }],
  "status_evidencia": "...", "ids_usados": ["..."], "ids_descartados": []
}
```
- Com IA (`origem: "ia"`): o texto dos cartões é escrito pela IA; nome, fabricante, link, modelo, modo, alternativas e fontes vêm do catálogo. Até 3 cartões.
- Sem chave ou se a IA falhar (`origem: "documental"`): os cartões são montados só com dados do catálogo.
- O selo mostra a condição de uso. Palavras de ranking ("melhor", "mais compatível") são trocadas pelo nome da missão, porque os documentos proíbem declarar vencedor.

`GET /api/jornadas/:id` → a etapa 3 exatamente como foi mostrada.

`GET /api/ia/status` → `{ ativo, modelo }`

### Como a IA gera a etapa 3 (`src/ia.js`)
- System prompt: texto integral do GUIA (`dados/INSTRUCOES_RECOMENDADOR.md`) mais o `BASE_CONSULTA_PROJETO.json`, guardados em cache.
- Mensagem: área, cargo, setor, missões e texto livre do visitante, mais as rotas e tarefas análogas que o backend já localizou.
- Resposta em JSON com formato fixo (`output_config.format`), no formato dos cartões. O backend descarta qualquer ID que não exista no catálogo (vai para `ids_descartados`) e preenche nome, fabricante, link, modelo e fontes a partir do catálogo, não do texto da IA. Missão que ficou sem cartão recebe um candidato documental, se ainda houver espaço.
- Modelo `claude-opus-5-5`, effort `medium`, com `fallbacks: "default"` (se o filtro de segurança recusar por engano, a API tenta no modelo recomendado).
- O pedido enviado, a resposta e os tokens ficam em `consultas_ia`.

Medido em 2026-11-04 no formato de cartões: cerca de 31 s e 2,7 mil tokens de saída por jornada. Custo: cerca de US$ 0,37 quando o cache precisa ser gravado (primeira jornada depois de 5 min sem uso) e cerca de US$ 0,07 com o cache já gravado.

`GET /api/admin/export.csv` com `Authorization: Bearer $ORBE_ADMIN_TOKEN` → cadastros e jornadas em CSV.

## Banco (`src/schema.sql`)
`visitantes` · `jornadas` (etapas 1 e 2, mais `resposta_json` da etapa 3) · `jornada_missoes` · `recomendacoes_exibidas` (cada candidato mostrado: rota/tarefa × configuração) · `consultas_ia` (pedido enviado à IA, etapa 3 gerada, stop_reason e tokens).

## Frontend
`front/app.js` (só a etapa 3) já usa o backend: a lista fixa de ferramentas e o cálculo de compatibilidade foram removidos, e `renderResults()` chama `POST /api/jornadas` e desenha `etapa3.cartoes` com o mesmo HTML e as mesmas classes de antes. A nota lateral da etapa 3 diz se o texto veio da IA ou da base. Abra o site pelo backend (`http://localhost:3000`); defina `window.ORBE_API` se o backend estiver em outro endereço.

Pendente no front:
1. Tela de cadastro (nome, e-mail, Instagram e consentimento) → `POST /api/visitantes`, e enviar `visitante_id` em `POST /api/jornadas`.
2. Na etapa 2, o aviso "Suas respostas ficam neste dispositivo e não são enviadas a um servidor" deixou de ser verdade. Na tela inicial, "Sem cadastro" também mudará quando o cadastro entrar.
