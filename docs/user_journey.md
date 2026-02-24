# Mapeamento da Jornada do Usuário (Bonsai Manager)

> **Objetivo:** Projetar a experiência (UX) e a interface (UI) pensando em um bonsaísta avançado (coleção de 100+ plantas), que precisa de gestão em lote (bulk actions), alertas preventivos e uma navegação fluida, minimizando a carga mental de lembrar cada detalhe.

---

## 1. Perfil do Usuário e Desafios (Pain Points)
**O Usuário:** Tem de dezenas a centenas de plantas. É metódico, mas o volume de trabalho (rega, adubação, transplante, aramação, controle de pragas) o sobrecarrega.
**Dores principais:**
- Esquecer de tirar um arame (que acaba marcando a casca).
- Perder a janela de tempo correta para o transplante antes que a estação vire.
- Dificuldade em adubar 100 plantas e lembrar quais *não* deveriam receber adubo (ex: recém-transplantadas ou doentes).
- Esquecer se o tratamento de uma praga (ex: pulgão) surtiu efeito na segunda semana.

---

## 2. Conceitos Core de UX/UI (A Ideia do "Joguinho de Fazenda")

Para deixar a experiência engajadora ("bonitinho e legal"), propomos os seguintes gatilhos de UI:
1. **O Tempo como Guia (Estações do Ano):** O visual do Dashboard muda levemente de acordo com a estação atual. O sistema "sabe" que estamos no final do Inverno e que a época de transplante está prestes a começar. 
2. **Sistema de "Notificações de Missão":** Em vez de uma tabela chata, o usuário recebe "Cards de Missão". Ex: *"30 Transplantes Pendentes para este Verão"*. 
3. **Barras de Progresso (Gamificação):** Mostrar o avanço visual das tarefas de longo prazo.
4. **Prevenção de Erros (UX Defensivo):** O sistema impede ou alerta o usuário antes de cometer erros clássicos (ex: adubar planta recém trabalhada no sistema radicular).

---

## 3. A Jornada Passo a Passo (Rotas e Fluxos)

### Fase A: Visão Geral (Rota: `/dashboard`)
Onde o usuário entra todos os dias. Deve ser limpo e focado no **QUANDO** e **O QUE** fazer agora.

- **Header / Clima:** Mostra a estação atual, clima local e um "Mood" (Ex: _"Primavera chegando: Hora de preparar os insumos!"_)
- **Widgets de Urgência (To-Do Inteligente):**
  - 🔴 **Crítico:** "Verificar arame de 5 plantas!" (Prazo venceu).
  - 🟠 **Acompanhamento:** "A aplicação de óleo de neem no Ficus #12 deu certo? (Sim / Não / Reaplicar)".
  - 🟡 **Metas da Estação:** ProgressBar -> "Transplantes de Verão: 10/30 concluídos".

### Fase B: Gestão do Viveiro (Rota: `/plants`)
A tela de listagem de plantas. Como o usuário tem 100+ plantas, a UI precisa ser focada em **Filtros** e **Ações em Lote (Bulk Actions)**.

- **Visualização Flexível:** Alternar entre Modo Grade (fotos de alta qualidade) e Modo Tabela (para ler rápido informações técnicas).
- **Ação em Lote - O Caso da Adubação:**
  - O usuário seleciona "Selecionar Todas" e clica em "Adubar".
  - **Intervenção de UX do Sistema:** Um modal aparece dizendo: *"Você selecionou 100 plantas, mas 5 delas foram transplantadas há menos de 30 dias. Elas serão removidas desta ação por segurança."* O usuário apenas clica em "Confirmar".
- **Modo "Visão Futura" (Esboços):** Ao abrir os detalhes de uma planta (`/plants/:id/future`), o usuário pode fazer upload de um desenho ou manipulação de imagem. A UI mostra um "Antes x Depois x Futuro" usando sliders visuais interativos.

### Fase C: Diario e Intervenções de Planta Específica (Rota: `/plants/:id`)
A "Ficha Médica" da árvore.
- **Timeline Vertical:** Mostra o histórico cronológico de tudo que aconteceu com a planta (Adubada há 10 dias, Aramada há 2 meses).
- **Cadastro de Aramação:** Ao registrar que colocou arame, o sistema pergunta o "Nível de Vigor" da árvore (baixo, médio, alto). Baseado nisso (ou diretamente em meses), o sistema já **agenda sozinho** um alerta no futuro para checagem do arame.

### Fase D: Controle de Pragas Inteligente (Rota: `/health` ou modal)
Como lidar com o Pulgão:
1. Usuário relata Pulgão na Planta X.
2. Aplica inseticida (sistema abate o fracionamento do estoque em Gramas/ML automaticamente).
3. **UX Magic:** O sistema cria um "Follow-up Task" para daqui a 7 dias.
4. Após 7 dias, no Dashboard aparece: *"Como estão os pulgões da Planta X?"*. 
   - Se o usuário marcar "Resolvido", a planta ganha o status de "Saudável".
   - Se marcar "Ainda com pragas", o sistema sugere trocar o princípio ativo.

### Fase E: Inventário e Insumos (Rota: `/inventory`)
- Fracionamento real: O usuário compra 1.5kg de Osmocote, o sistema registra `1500g`. 
- Ao clicar em "Adubação em Massa" (100 plantas de porte médio), o sistema calcula (100 x 5g) e sugere abater `-500g` do estoque automaticamente. Mostrando uma barra de "Falta pouco para acabar o Adubo de Crescimento".
- Validades: Alertas visuais vermelhos (Card) quando defensivos biológicos ou adubos orgânicos estão perto de vencer.

---

## 4. Ideias de Melhoria (Brainstorming Técnico p/ Desenvolvimento)

Aqui estão algumas sugestões arquiteturais e lógicas para implementar isso no painel:

1. **Tagging Passivo / Eventos:**
   - Em vez de apenas salvar "Adubado em data X", crie um sistema de eventos (`PlantEvent` model). 
   - **Exemplo de Regra (Rule Engine):** Se `event.type == 'TRANSPLANT'`, a planta recebe uma propriedade temporária `isFertilizeLocked = true` por 30 dias. No UI, o checkbox na lista fica "disabled" com um ícone de escudo protetor.
   
2. **Meta de Estação (Gamification System):**
   - Crie um módulo onde o usuário possa criar "Projetos/Metas". (Ex: `Goal = { title: 'Transplantes 2026', target_count: 30, deadline: '2026-03-21', current_count: 0 }`). Cada vez que um transplante for salvo no diário, e bater com a regra da meta, preenche a barrinha no UI.

3. **Status de Saúde (Health State Machine):**
   - As plantas devem ter estados: `[HEALTHY, SICK, QUARANTINE, RECOVERING]`. 
   - Ao ter pulgões -> `SICK`. O tratamento muda para -> `RECOVERING`. Só volta para `HEALTHY` quando o alerta de validação for checado e respondido positivamente.

4. **Upload Dinâmico de Midias (Visão Futura):**
   - Na página de detalhes, crie uma aba dedicada "Estudos de Design". Permitir que o usuário faça o upload da foto limpa da árvore + upload do JPG com desenho por cima, utilizando um componente de "Image Comparison Slider" (arrastar pra esquerda e direita pra ver o antes/depois planejado).

## Resumo das Rotas (Sugestão para o Next.js / React Router)

```text
/
├─ /dashboard               (Visão geral, alertas, tempo, metas)
├─ /plants                  (Lista de plantas, ações em lote, filtros potentes)
│  ├─ /plants/:id          (Página da planta: Resumo e Status)
│  ├─ /plants/:id/diary    (Timeline de eventos e manutenções)
│  ├─ /plants/:id/future   (Estudos de design e evolução visual)
├─ /tasks                   (Bandeja de tarefas geradas pelo sistema)
├─ /inventory               (Estoque de adubos, ferramentas, arames, validades)
└─ /settings                (Configurações de clima local, preferências)
```

> **Próximos Passos recomendados:**
> Se aprovar este fluxo, podemos começar a desenhar a estrutura de dados (Models do Banco de Dados) para suportar essas "Ações Condicionais em Lote" e este motor de eventos cronológicos.
