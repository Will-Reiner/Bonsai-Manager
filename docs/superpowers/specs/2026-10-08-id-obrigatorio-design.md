# ID da planta obrigatório e numérico

Data: 2026-10-08 · Item do `docs/todo.md`: "ID tem q comecar a ser obrigatorio…"

## Problema

O fluxo de fotos (triagem por código no Registrar e nas Fotos em lote) encontra a planta pelo ID (`Planta.identificador`). Hoje o ID é opcional e é texto livre (ex.: `JB-03`), então plantas sem ID ou com letras ficam fora do fluxo. O teclado da triagem é numérico.

## Objetivo

Toda planta tem um ID **numérico** e único por usuário. Se o usuário não informar ao criar, o servidor gera o próximo número livre.

## Fora do escopo

- `mobile_app/` (descontinuado).
- Guardar os códigos antigos: IDs com letras são descartados na migração.
- A preferência `usa_identificador` do onboarding (fica como está).

## Banco e migração

- `Planta.identificador`: `String?` → `Int` obrigatório. `@@unique([usuarioId, identificador])` continua.
- Migration SQL (`id_planta_obrigatorio`), por usuário:
  1. IDs só com dígitos (`^[0-9]+$`) viram inteiro. Se dois viram o mesmo número (ex.: `011` e `11`), fica com a planta mais antiga (`createdAt`); as outras são tratadas como sem ID.
  2. Plantas sem ID, com letras ou perdedoras do passo 1 recebem, por ordem de `createdAt`, os números a partir de (maior número do usuário após o passo 1) + 1.
  3. A coluna vira `INTEGER NOT NULL` e o índice único é recriado.

## API

- **Criar** (`POST /api/plantas`): `identificador` opcional, inteiro positivo; o Zod aceita número ou string só com dígitos (`z.preprocess`; `''`, `null` e letras são rejeitados) — a triagem manda o código digitado. Máximo 999999999 (cabe em `INTEGER`). Sem ID, o `CreatePlantaUseCase` usa `plantaRepository.maiorIdentificador(usuarioId)` + 1 (ou `1` se não houver plantas). Se o create gerado bater na unicidade (P2002, criação simultânea), recalcula e tenta de novo (até 3 vezes). ID informado pelo usuário que já existe continua dando **409** "Já existe uma planta com esse código." — sem retry.
- **Editar** (`PUT /api/plantas/:id`): `identificador` opcional, mas se vier é inteiro positivo; `null` não é mais aceito. Conflito → 409 (igual ao criar).
- Respostas: `identificador` passa a ser `number`.

## Web

- Tipos: `identificador: number` em `types.ts` (`Planta`) e em `endpoints.ts`; `loteFotos.ts` mantém o código digitado como string (normalizado) e converte ao comparar/criar.
- **AddPlantPage**: campo ID numérico (`inputMode="numeric"`, só dígitos), vazio, dica "Deixe vazio para gerar automaticamente". Envia `Number(...)` ou nada. Sai o "Ex.: JB-03".
- **EditPlantPage**: campo ID numérico obrigatório (salvar desabilitado com o campo vazio).
- **Exibição** (toda planta agora tem número):
  - `plantaTitulo`: nome → nome comum → nome científico → `Planta #N`.
  - `plantaRotulo`: `#N` (o ID continua com prioridade).
  - Onde o ID aparece como complemento, mostra `#N` sempre (não só quando a planta tem nome): Coleção (subtítulo), `LinhaTarefa`, `ConcluirPage`, `TarefaPage`, `RotinaSheet`. As condições `p.identificador ? … : …` que existiam porque o ID era opcional são simplificadas.
  - `PlantasPicker`, `RegistrarPage`, `BatchPhotosPage`, `TriagemFotos`: já mostram `#N`; só ajustar tipo.
- Triagem/lote: busca por código continua via `normalizarCodigo` (string do teclado ↔ `String(identificador)`).

## Testes

- Server (Jest, mocks): criar sem ID gera maior + 1; primeira planta recebe 1; ID informado é respeitado (sem consultar o maior); P2002 na geração automática tenta de novo; P2002 com ID informado propaga. Schema: rejeita `"JB-03"`, `0`, negativo; aceita `"14"` e `14`.
- Web: `npm run build` + `npm run lint`; conferir no navegador (conta local) criar sem ID, criar com ID repetido, editar, triagem criando "Planta #X".
- Migração: rodar no banco local (que tem os três casos) e conferir o resultado.
