# para fazer agora:

- [ ] criar acesso rapido na bancada para por exemplo: registrar adubacao liquida em todas, registrar aplicacao de enraizador em todas pre-transplante e/ou pos transplante. permitir usuario configurar botoes de acesso rapido com suas preferencias e tarefas.

- [x] ao registrar duas tarefas, entra as duas separadas no histórico, logo se coloquei adubacao e desaramacao e coloquei uma obs e descrição em específico para uma das tarefas, esse texto pode acabar em um card errado então das duas uma: ou a gente junta os cards quando as tarefas forem registradas juntas ou a gnt separa a descrição e obs por tarefa na hora de registrar. oq vc sugere? eu pensando na UX acho que a primeira ideia faz mais sentido pois é menos coisa q o usuario deve fazer
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-card-unico-historico-design.md): o histórico junta num card tudo o que foi feito na planta no mesmo dia (fotos do dia inclusas), com as notas apontando para a tarefa quando não valem para todas; na tarefa concluída dá para deslizar entre as tarefas do dia; o registro grava descrição/obs. em todas as tarefas; o Ajustar do Concluir mostra o nome da tarefa.

- [x] a revisao geral nao esta funcionando do jeito que deveria, testei e tem atividades para o dia x e tem revisao geral no dia x tb. eu sei q a tarefa foi trocada por uma rotina em uma sessao de ontem... vamos fazer com q ela deixe de ser rotina e seja uma tarefa comum que só X dias depois caso o usuario n tenha agendado nenhuma outra tarefa. e torne a revisao geral como desligada por padrao
  > Feito em 2026-10-08: mudou de ideia, a Revisão geral saiu do app por completo (tarefas, rotinas, atividade e preferência apagadas pela migration `remover_revisao_geral`).

- [ ] imagem um pouco maior na hora que tiver selecao de planta(s) pois o usuario tende a pesquisar vendo as fotos

- [x] na bancada, ao clicar numa planta com tarefa pendente vai pra uma pagina de visualizacao do historico e opcoes para a tarefa, vamos refazer essa pagina para q seja possivel selecionar outros procedimentos pendentes dessa planta para completa-los ou apaga-los ou reagendalos. nessa página nao precisa ter o histórico, vamos colocar só a foto da arvore, ultima tarefa feita e as tarefas pendentes. mas com destaque na tarefa que o usuario clicou.
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-pendentes-da-planta-design.md): a tarefa pendente abre a planta com o último cuidado e todas as pendentes; a tocada vem marcada e destacada; dá para concluir, reagendar (nova data ou adiar N dias) e excluir várias de uma vez; cancelar/pular/editar rotina ficam em "Mais". A página da tarefa concluída não mudou.

- [ ] no perfil temos varias preferencias das coisas do app, vamos criar um botao de preferencias dentro do perfil para colocar todas essas opcoes.

- [x] ID tem q comecar a ser obrigatorio visto que ao adicionar fotos, fazemos tudo pelo fluxo de ID. Logo, caso o usuario nao adicione ID, adicione automaticamente um ID para ele. (veja que o ID tem q sempre ser um numero)
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-id-obrigatorio-design.md): ID virou número obrigatório; sem ID o servidor gera o próximo livre; a migration numerou as plantas antigas (códigos com letras descartados).

- [x] tela de concluido apos criar nova planta tem coisa errada kkk vamos alterar ela
  > Feito em 2026-10-08: mostra a capa, o número da planta em destaque ("anote na etiqueta") e o botão "Agendar primeiro cuidado"; a página da planta também passou a mostrar o #N.

- [x] triagem de fotos (lote/registrar) oferece "Criar planta #1234567890" com mais de 9 dígitos, mas a API só aceita até 999999999 e recusa só na hora de salvar (depois das fotos enviadas). Limitar o teclado a 9 dígitos ou não oferecer criar acima disso (`web/src/components/TriagemFotos.tsx`).
  > Feito em 2026-10-08: na triagem não acontecia (o teclado sempre foi limitado a 6 dígitos); o campo "Código / etiqueta" de criar/editar planta é que aceitava mais de 9 — agora corta em 9.

- [x] na Coleção (grade e lista), planta sem nome e sem espécie mostra o número duas vezes: título "Planta #14" e subtítulo "Sem espécie · completar · #14". Não mostrar o "· #N" quando o título já é o número (`web/src/pages/CollectionPage.tsx`).
  > Feito em 2026-10-08: o subtítulo não repete o título — sem nome e sem espécie fica só o aviso; sem nome e com espécie fica só o #N (`subtituloDaColecao` em `web/src/lib/format.ts`).

- [x] ordem alfabética da Coleção põe "Planta #10" antes de "Planta #9". Usar `localeCompare(..., 'pt-BR', { numeric: true })` (`web/src/pages/CollectionPage.tsx`).
  > Feito em 2026-10-08.

- [x] erro de validação da API (Zod) chega no toast como JSON cru (ex.: código da planta inválido). Controllers devem devolver só a mensagem do primeiro erro do Zod — vale para todos os schemas, não só planta.
  > Feito em 2026-10-08: `mensagemDoErro` (`server/src/utils/errors.ts`) devolve só a mensagem do primeiro erro do Zod; usado nas respostas genéricas de erro dos controllers.

# ideias para o futuro:
- alguma animacao ou icone especial para plantas fazendo aniversario
- animacoes gerais ao completar alguns objetivos como 100 plantas adicionadas, 1000 cuidados feitos etc
- investigar codigo para possiveis erros q possam ter em endpoints e outras coisas, e otimizar as coisas e melhorar logs de erros e outras coisas