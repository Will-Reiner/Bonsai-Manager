# Bonsai Manager — Princípios de UX para o Frontend

Guia de design e arquitetura de informação para refazer o frontend do zero. Lê o `FEATURES.md` para saber **o que existe**; este documento responde **como o usuário deve viver isso**.

---

## 1. Quem usa & quando

### Personas

**1. O iniciante curioso** — comprou ou ganhou um bonsai, não sabe rega/poda/estação. Precisa de respostas, não de planilhas.

**2. O hobbista comprometido** — tem 3-15 plantas, quer organização: histórico, lembrete, inventário. Volta ao app várias vezes por semana.

**3. O bonsaísta avançado / produtor** — tem 30+ plantas, valoriza dados (datas exatas, rastreio de adubação, fotos comparativas, identificadores). Usa o sistema como caderno técnico.

> **Decisão de design:** otimizar primeiro para o **hobbista comprometido**. O iniciante chega via conteúdo (enciclopédia), o avançado tolera mais densidade.

### Momentos de uso

| Momento | Frequência | O que abre |
|---|---|---|
| "O que eu faço hoje?" | Diário (manhã/fim de tarde) | **Home** → tarefas |
| "Reguei agora, registra" | 1-3×/dia | **Modal de intervenção rápida** |
| "Tirei foto, salva" | Semanal | **Galeria da planta** |
| "Comprei uma planta nova" | Mensal | **Adicionar Planta** |
| "Como cuidar dessa espécie?" | Sob demanda | **Enciclopédia → Espécie** |
| "Hora de podar? Que época?" | Sazonal | **Guia Sazonal** da espécie |
| "Ver o que os outros estão fazendo" | Lazer | **Comunidade** |

---

## 2. Loop principal (core loop)

A experiência tem que girar em torno de **um loop diário curto** e **um loop semanal mais rico**.

### Loop diário (deve durar < 30s por sessão)

```
Abre app → Vê 1-3 tarefas do dia → Conclui com 1 tap → Opcionalmente foto → Pronto
```

**Implicações:**
- A Home **é** a lista de tarefas pendentes (ou um resumo dela).
- Marcar como concluído deve ser **um gesto** (swipe ou tap longo), não 3 telas.
- Foto é opcional, nunca obrigatória pra concluir.

### Loop semanal (5-10 min)

```
Revisa coleção → Atualiza notas/fotos → Planeja próximas semanas → (talvez) consulta guia
```

---

## 3. Arquitetura de informação

### 3.1 Hierarquia de telas

A app atual tem **31 telas** — muita coisa. Pra refazer do zero, organizo em **4 camadas**:

```
NÍVEL 0 — Sempre acessível (tab bar)
├── Hoje          (era "Home" → renomeio pra clareza)
├── Coleção
├── + (ação rápida)
├── Conhecimento  (era "Enciclopédia" — palavra mais curta e amigável)
└── Perfil        (engloba Comunidade + Config)

NÍVEL 1 — Detalhes de entidade
├── Planta → detalhe
├── Espécie → detalhe
├── Técnica → detalhe
└── Usuário → perfil público

NÍVEL 2 — Ações contextuais (modal/sheet, não tela)
├── Registrar intervenção rápida
├── Agendar cuidado
├── Adicionar foto
└── Editar campo X

NÍVEL 3 — Configuração & admin
├── Preferências de cuidado
├── Settings da conta
└── Painel Admin (gated)
```

**Por que reduzir as 5 abas atuais (Home, Collection, Add, Encyclopedia, Community) pra 4 + central?**
- "Comunidade" raramente é destino diário pro hobbista; cabe dentro de Perfil ou como aba secundária do Conhecimento.
- O "+" central funciona, mas precisa abrir um **action sheet contextual** (não uma tela).

### 3.2 Mapa mental do usuário

O usuário pensa em **plantas** e **o que fazer com elas** — não em "agendas", "atividades", "recursos". A UI deve usar a linguagem do usuário:

| Backend (técnico) | UI (humano) |
|---|---|
| Agenda | Tarefa / Cuidado |
| Atividade | Tipo de cuidado / Técnica |
| Recurso | Insumo / Material |
| Tipo de Recurso | Categoria de insumo |
| Inspiração | Referência visual |
| Identificador | Código / Etiqueta |
| Espécie | Espécie (ok) |
| Guia Sazonal | Calendário da espécie |
| Guia de Técnicas | Recomendações para esta espécie |

---

## 4. Telas principais — o que cada uma DEVE ter

### 4.1 Hoje (Home)

**Função:** responder à pergunta "o que faço agora?" em < 3 segundos.

**Conteúdo (em ordem de prioridade visual):**
1. **Tarefas atrasadas** (alerta visual claro, vermelho/laranja)
2. **Tarefas de hoje** (cards rápidos: planta + ação + botão "feito")
3. **Próximos 7 dias** (preview compacto)
4. **Dica sazonal** (1 card baseado na estação atual — "Outono começou: hora de pensar em adubação suave")
5. **Atalho:** "+ Registrar cuidado sem agendamento"

**Estados:**
- **Vazio "primeira vez"** — onboarding visual: "Adicione sua primeira planta" com CTA grande
- **Vazio "tudo em dia"** — celebrar, não punir: "Nada pendente hoje 🌿 Aproveita pra observar suas plantas"
- **Erro de rede** — manter o último cache visível, banner discreto avisando

### 4.2 Coleção

**Função:** ver/organizar todas as plantas.

**Conteúdo:**
- **Grid de cards** (default) ou **lista densa** (toggle salvo na preferência)
- Cada card: foto de capa, apelido/identificador, espécie, indicador sutil de "tem tarefa pendente"
- **Filtros:** por espécie, por estação atual relevante, por status (saudável/em recuperação/recém-adquirida)
- **Ordenação:** mais recente, próxima tarefa, alfabético
- **Busca** sempre acessível
- **Empty state:** CTA pra adicionar primeira planta + link pra enciclopédia ("não sabe por onde começar?")

### 4.3 Detalhe da planta

A tela mais importante depois da Home. Precisa caber muita coisa **sem virar inferno**.

**Estrutura em abas internas (top tabs):**
1. **Visão geral** — foto grande, dados, próxima tarefa, atalhos rápidos
2. **Histórico** — timeline cronológica reversa de tudo que aconteceu (tarefas concluídas, fotos, notas)
3. **Galeria** — só fotos, grid
4. **Cuidados** — agendamentos futuros + opção de criar
5. **Inspirações** — referências visuais (estilo futuro pretendido)

**Visão geral deve ter:**
- Foto de capa grande (com tap para galeria)
- Nome + espécie (link pra detalhe da espécie)
- Idade (calculada de `dataAquisicao`)
- Modo de aquisição
- 3-4 "stats" relevantes: dias desde última rega, próxima tarefa, etc.
- Botão grande: "Registrar cuidado"
- Botões secundários: "Agendar", "Adicionar foto", "Notas"

### 4.4 Adicionar planta

**Decisão chave:** **multi-step**, não um formulário gigante. O usuário tem que sentir que cada passo é leve.

**Passos:**
1. **Espécie** (busca + sugestão; se não achar → "sugerir nova" sem sair do fluxo)
2. **Identidade** (apelido OU identificador, conforme `preferencias.usa_*`)
3. **Aquisição** (data + modo — opcional)
4. **Foto de capa** (opcional, mas com prompt forte)
5. **Confirmação** + CTA "Adicionar mais uma planta?"

**Anti-padrões a evitar:**
- Não obrigar mais que espécie
- Não pedir dados de cultivo aqui (vem da espécie)
- Não bloquear "salvar" se faltar foto

### 4.5 Registrar cuidado / Intervenção rápida

A **interação mais frequente do app**. Tem que ser brutalmente curta.

**Fluxo (modal / bottom sheet, não tela):**
1. Escolher planta (se vier de Home/Coleção, já vem selecionada)
2. Escolher tipo de cuidado (chips com os mais usados primeiro — vêm de `preferencias.atividades_rastreadas`)
3. Data (default "agora")
4. (Opcional) consumo de insumos (vem das sugestões automáticas — `AtividadeRecursoSugerido`)
5. (Opcional) nota rápida
6. (Opcional) foto

**Truques:**
- "Marcar como feita HOJE" como botão único quando vier de tarefa agendada
- "Repetir último cuidado igual" como atalho
- Auto-baixa do inventário com confirmação visual ("− 50ml de NPK aplicado")

### 4.6 Enciclopédia (Conhecimento)

Hub com 2 entradas principais:

#### Espécies
- Busca + filtros (família, tipo de planta, dificuldade — derivada)
- Card: foto de referência (se houver), nome comum, nome científico, badge "verificado/sugerido"
- **Detalhe da espécie:**
  - Hero: imagem + nomes + família/origem
  - Abas: **Identificação** (folhas, tronco, flores...), **Cultivo** (luz, rega, substrato...), **Calendário** (guia sazonal visual por estação), **Técnicas** (guia de técnicas com chips ✅/⚠️/❌)
  - CTA: "Adicionar uma planta desta espécie à minha coleção"

#### Técnicas
- Lista buscável
- Detalhe: objetivos / preparação / execução / cuidados pós (já existe no backend)
- Recursos sugeridos + ferramentas sugeridas
- "Em quais espécies da minha coleção isso é recomendado?"

### 4.7 Perfil (engloba comunidade + config)

- Cabeçalho: foto, nome, localidade, bio, contagem de seguidores/seguindo, contagem de plantas
- Botão "Editar perfil"
- Abas internas: **Plantas públicas**, **Seguidores**, **Seguindo**
- Acesso a: Preferências, Configurações, (Admin se ADMIN), Logout

### 4.8 Comunidade (se virar destino próprio)

- Feed simples: posts são plantas públicas atualizadas (foto recente, dono, espécie)
- Filtros: "Quem eu sigo" / "Descobrir"
- Tap → perfil público OU detalhe da planta pública

---

## 5. Onboarding — primeira impressão

O onboarding atual tem **6 telas**. É muito. Refazer assim:

**Princípio:** perguntar **só o necessário pra app não parecer vazia**. O resto descobre conforme usa.

**Passos enxutos (3-4 telas):**
1. **Boas-vindas** + nome + localidade (1 tela)
2. **Como você gosta de organizar?** — identificador OU apelido OU os dois (com exemplos visuais)
3. **O que você quer rastrear?** — cards selecionáveis: rega, adubação, podas, transplantes, tratamentos (multi-select; vira `atividades_rastreadas`)
4. **Pronto** — CTA: "Adicione sua primeira planta" (entrando direto no fluxo de adicionar)

**Decisões de design:**
- Adubação detalhada (modo + frequência) **só aparece se** marcar "adubação" no passo 3
- Skip explícito em cada passo ("Configurar depois")
- Progresso visual (1/4, 2/4...)

---

## 6. Componentes essenciais (design system)

Pra começar do zero, esses são os componentes que **você vai usar em todo lugar**:

### Primitivos
- `Button` (primary, secondary, ghost, destructive, icon-only)
- `Input` (text, number, multiline, search)
- `Select` / `Picker`
- `DatePicker`
- `Chip` (filtro + seleção)
- `Card`
- `Modal` / `BottomSheet`
- `Toast` / `Snackbar`

### Específicos do domínio
- **`PlantCard`** — variantes: grid pequeno, lista densa, hero
- **`TaskCard`** — com ação "concluir" rápida
- **`SpeciesCard`** — com badge de status
- **`SeasonalCalendar`** — visual circular ou linear das 4 estações
- **`TechniqueBadge`** — RECOMENDADA / COM_CUIDADO / NAO_RECOMENDADA
- **`PhotoUploader`** — câmera + galeria + crop básico, compressão automática
- **`ResourceSelector`** — picker que mostra estoque atual
- **`Timeline`** — eventos cronológicos com ícone por tipo
- **`EmptyState`** — ilustração + título + descrição + CTA

### Estados padronizados
Cada lista/tela carregadora tem 4 estados que **precisam ser desenhados**:
1. **Loading** — skeleton, não spinner em tela cheia
2. **Vazio** — empty state acolhedor com CTA
3. **Erro** — mensagem clara + botão de retry
4. **Sucesso parcial** (paginação) — loader inline no fim

---

## 7. Tom & visual

### Linguagem
- Português brasileiro, informal mas não brincalhão
- Voz ativa, frases curtas
- Erros em humano: "Não consegui salvar — tenta de novo" (não "Internal server error")
- Confirmações positivas: "Feito ✓" não "Operação concluída com sucesso"

### Visual (sugestões — não preso a)
- **Paleta:** verde escuro (folhagem), terra (substrato), neutros quentes (off-white, bege)
- **Tipografia:** uma sans humanista pra UI (Inter, Nunito), uma serif pra conteúdo longo dos guias (opcional)
- **Foto > ilustração** — o app é sobre plantas reais
- **Espaço respira** — não comprimir; o usuário lê com calma
- **Modo escuro nativo** (importante pra uso noturno antes de dormir)

### Microinterações que valem a pena
- Animação ao concluir tarefa (folha caindo, check verde com bounce sutil)
- Pull-to-refresh em todas as listas
- Swipe em task card: → concluir, ← adiar
- Haptic em ações importantes (no mobile)

---

## 8. Acessibilidade & responsividade

**No web (prioridade agora):**
- Layout responsivo: 1 coluna (mobile), 2 colunas (tablet), 3 colunas + sidebar (desktop)
- Navegação por teclado em todos os componentes
- Foco visível
- Atalhos: `/` para busca, `N` para nova planta, `Esc` fecha modais

**Geral:**
- Alvo de toque mínimo 44×44 px
- Contraste WCAG AA mínimo
- Labels em todos os inputs
- `alt` em todas as imagens

---

## 9. Performance percebida

- **Optimistic UI** nas ações de conclusão de tarefa (mostra concluído antes da API responder)
- **Cache local** das listas (mostra cached, atualiza em background)
- **Skeleton screens** em vez de spinners
- **Imagens lazy-load** + thumbnails (que o backend já gera)
- **Pré-carregar** detalhe da planta ao tocar/hover no card

---

## 10. O que NÃO incluir na v1 do redesign

Pra evitar escopo explodir, **adia conscientemente**:

- ❌ Painel admin completo (mantém o atual minimal por enquanto)
- ❌ Comunidade rica (feed, comentários, likes) — só perfil público e follow
- ❌ Visão futura (mockup de estilo) — feature interessante mas complexa
- ❌ Múltiplos idiomas
- ❌ Offline-first verdadeiro (só cache otimista é suficiente)
- ❌ Notificações push (pode vir via email primeiro)

---

## 11. Ordem sugerida de implementação

Pensando em **rodar no Expo Web primeiro**, sugiro construir nesta ordem:

| Fase | Telas / componentes | Por quê |
|---|---|---|
| **1. Base** | Auth (login/registro), Design system básico (Button, Input, Card), AuthContext, layout responsivo | Sem isso nada funciona |
| **2. Coleção** | Coleção (lista vazia → com plantas), Adicionar Planta (multi-step), Detalhe da Planta (visão geral) | Loop fundamental: ter uma planta cadastrada |
| **3. Cuidados** | Hoje (lista de tarefas), Modal de intervenção rápida, Agendar Cuidado | Loop diário funcionando |
| **4. Conhecimento** | Enciclopédia → Espécies (lista + detalhe), Técnicas (lista + detalhe) | Diferencial competitivo + ajuda iniciante |
| **5. Refinamento** | Galeria, Histórico/Timeline, Inventário, Preferências, Onboarding | Profundidade pro hobbista |
| **6. Social** | Perfil próprio, Perfil público, Follow | Engajamento de longo prazo |
| **7. Admin** | Telas administrativas | Manutenção de catálogo |

A cada fase tem que dar pra **demonstrar o app funcionando ponta-a-ponta** — não construir tudo em mock antes de conectar API.

---

## 12. Métricas de sucesso da UX (qualitativas)

Se essas perguntas têm resposta "sim" depois do redesign, deu certo:

1. Um iniciante consegue cadastrar a primeira planta em < 90 segundos?
2. Marcar uma tarefa como concluída leva menos de 3 toques/cliques?
3. Em uma sessão de < 30 segundos, o usuário consegue saber o que precisa fazer hoje?
4. Um usuário que abre a app pela primeira vez entende o que ela faz olhando só a Home?
5. Procurar uma espécie e ler suas recomendações leva menos de 4 telas?

Se "não" em alguma, volta pra prancheta antes de codar.