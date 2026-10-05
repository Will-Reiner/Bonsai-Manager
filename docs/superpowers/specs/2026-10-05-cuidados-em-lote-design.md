# Cuidados em lote — design

Data: 2026-10-05 · Escopo: `web/` + `server/` (nada em `mobile_app/`)

Três entregas, nesta ordem (cada uma com seus commits em `develop`):

1. Agendar cuidado para várias plantas
2. Criar planta a partir de um código novo (espécie opcional)
3. Registrar cuidado começando pela foto

---

## 1. Agendar cuidado (sheet `ScheduleCareSheet`)

### UI
- **Plantas**: campo-resumo ("Escolha as plantas" / "#03 Junípero" / "7 plantas" ›). Ao tocar abre um sheet `PlantasPicker`:
  - busca por código ou nome;
  - chip **Todas (N)** — marca/desmarca todas;
  - chips **por espécie** com contagem (inclui "Sem espécie") — se todas do grupo estão marcadas, desmarca o grupo; senão marca o grupo;
  - lista com checkbox (miniatura, `#código`, nome/espécie);
  - botão "Pronto (n)".
  - Aberto a partir do detalhe de uma planta: ela vem marcada, mas o campo continua editável.
- **Tipos de cuidado**: múltipla escolha (como hoje).
- **Observação (opcional)**: textarea, placeholder "Ex.: usar adubo Bioplant". Gravada em `Agenda.detalhes`.
- **Data**: input livre + 12 chips, todos visíveis, cada um mostrando a data que aplicará:
  - Amanhã (+1d), 1 semana (+7d), 1 mês (+1 mês calendário), 3 meses (+3 meses calendário);
  - Começo/Final de primavera, verão, outono, inverno (hemisfério sul), sempre a **próxima** ocorrência ≥ amanhã:
    - Primavera 22/09 → 20/12
    - Verão 21/12 → 19/03
    - Outono 20/03 → 20/06
    - Inverno 21/06 → 21/09
  - Cálculo em `web/src/lib/estacoes.ts` (função pura).
- Reagendar (quando `agenda` vem preenchida) não muda.

### Exibir a observação
`detalhes` de tarefa **pendente** aparece: no card da Bancada (linha curta, truncada), na `TarefaPage` e no topo da `ConcluirPage` (por tarefa). Ao concluir, se o usuário digitar detalhes, sobrescreve; se deixar vazio, mantém (comportamento atual do backend).

### Backend
`POST /agendas/lote` passa a aceitar:
```ts
{ plantaIds: string[] (1..500), atividadeIds: string[], dataAgendada: string, detalhes?: string }
```
(`plantaId` único continua aceito por compatibilidade e vira `[plantaId]`.) A use case valida que **todas** as plantas são do usuário e as atividades existem; cria plantas × atividades numa transação (`createMany`). Testes da use case atualizados.

---

## 2. Criar planta a partir de um código novo

### Espécie opcional
- Migration: `Planta.especieId String?` e `especie Especie?`.
- `createPlantaSchema.especieId` opcional; `CreatePlantaUseCase` só valida existência quando vier. Testes cobrindo criação sem espécie.
- Web: `Planta.especieId: string | null`, `especie` opcional/nula; `PlantDetailPage` e `EditPlantPage` tratam nulo.

### Coleção
Plantas sem espécie sempre no topo (antes da ordenação atual), com badge "!" (cor de alerta) e texto "Sem espécie — toque para completar".

### Triagem compartilhada
Extrair a triagem de `BatchPhotosPage` para `components/TriagemFotos.tsx` (foto em tela cheia, teclado numérico, Voltar / Anterior / Pular, revisão). Usada pelo lote de fotos e pelo novo registrar.

Quando o código digitado não bate com nenhuma planta: em vez de "Nenhuma planta com esse código", botão **"Criar planta #X"**. A planta fica **pendente localmente** (id provisório `novo:X`), entra no mapa de códigos (vale para "Anterior" e para as próximas fotos) e só é criada no salvar (`POST /plantas` com `identificador`), antes das fotos. A primeira foto dela vira `fotoCapaUrl`. Abandonar o lote não deixa planta vazia.

Outros pontos de adição de foto (galeria da planta, cadastro) já sabem a planta — não mudam.

---

## 3. Registrar cuidado (`/registrar`, tela cheia)

`CareContext.registrarCuidado(plantaId?)` passa a navegar para `/registrar` (ou `/registrar?planta=<id>`). `RegisterCareSheet` é removido.

### Fluxo
1. **Início**: botões Câmera e Galeria (múltiplas fotos, mesmo limite do lote) + link "Registrar sem foto" → abre `PlantasPicker` (da parte 1).
2. **Triagem** (`TriagemFotos`, com criar planta). Se veio `?planta=`, pula: todas as fotos vão para ela. Uploads começam em segundo plano como no lote.
3. **O que foi feito**:
   - Bloco geral: tipos de cuidado (múltiplos, ≥1), data (≤ hoje; hoje usa hora atual), nota (`detalhes`), observação futura.
   - Lista das plantas tocadas (miniatura, nº de fotos). Expandir → ajuste da planta: chips de tipos **pré-marcados com os gerais** (pode desmarcar/marcar outros), nota e observação futura próprias. Enquanto não ajustada, a planta segue o geral (mudanças no geral refletem nela); ao tocar nos tipos dela, passa a ter seleção própria. Uma planta precisa terminar com ≥1 tipo.
   - "Agendar próximo" opcional (mesmo bloco do concluir: tipo + data com atalhos).
   - Salvar.

### Backend: `POST /agendas/registrar`
```ts
{
  data: string,                 // datetime
  plantas: [{
    plantaId: string,
    atividadeIds: string[],     // ≥1
    detalhes?: string,
    observacaoFutura?: string,
    fotos?: { caminhoArquivo: string, dataCaptura?: string }[],
  }],
  proximos?: { atividadeId: string, dataAgendada: string }[],
}
```
- `RegistrarCuidadosUseCase`: valida plantas do usuário e atividades; cria as agendas `CONCLUIDA` (`dataAgendada = dataConcluida = data`); fotos de cada planta ligadas ao **primeiro** cuidado dela (`agendaId`), `titulo` = nome da atividade; cria `proximos` para cada planta; sem `proximos`, aplica a Revisão geral automática (mesma regra do concluir).
- A regra "próximos + revisão" sai de `ConcluirAgendasUseCase` para um helper compartilhado (`planejarSeguimento`), testado uma vez e usado pelas duas use cases.
- Plantas novas da triagem são criadas pelo front (`POST /plantas`) antes desta chamada.
- Testes TDD da use case e do helper.

### Erros
Falha de upload: mesma UI do lote (tentar de novo). Falha no registrar: toast com a mensagem e permanece na tela (uploads já feitos são reaproveitados).

---

## Verificação
- `cd server && npm test`, `npm run build`
- `cd web && npm run build && npm run lint`
- Teste no navegador (conta de teste) de cada entrega.
