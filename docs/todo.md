# para fazer agora:

- [x] criar acesso rapido na bancada para por exemplo: registrar adubacao liquida em todas, registrar aplicacao de enraizador em todas pre-transplante e/ou pos transplante. permitir usuario configurar botoes de acesso rapido com suas preferencias e tarefas. aproveitar as atividades favoritas
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-acesso-rapido-design.md): faixa "Acesso rápido" na Bancada com atalhos (atividades + grupos e/ou espécies, favoritas primeiro nos chips); tocar abre uma confirmação com as plantas marcadas (dá para desmarcar) e registra em todas, concluindo as pendentes atrasadas ou que vencem em até 7 dias (desligável). Editar/apagar pela própria confirmação.

- [x] ao registrar duas tarefas, entra as duas separadas no histórico, logo se coloquei adubacao e desaramacao e coloquei uma obs e descrição em específico para uma das tarefas, esse texto pode acabar em um card errado então das duas uma: ou a gente junta os cards quando as tarefas forem registradas juntas ou a gnt separa a descrição e obs por tarefa na hora de registrar. oq vc sugere? eu pensando na UX acho que a primeira ideia faz mais sentido pois é menos coisa q o usuario deve fazer
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-card-unico-historico-design.md): o histórico junta num card tudo o que foi feito na planta no mesmo dia (fotos do dia inclusas), com as notas apontando para a tarefa quando não valem para todas; na tarefa concluída dá para deslizar entre as tarefas do dia; o registro grava descrição/obs. em todas as tarefas; o Ajustar do Concluir mostra o nome da tarefa.

- [x] a revisao geral nao esta funcionando do jeito que deveria, testei e tem atividades para o dia x e tem revisao geral no dia x tb. eu sei q a tarefa foi trocada por uma rotina em uma sessao de ontem... vamos fazer com q ela deixe de ser rotina e seja uma tarefa comum que só X dias depois caso o usuario n tenha agendado nenhuma outra tarefa. e torne a revisao geral como desligada por padrao
  > Feito em 2026-10-08: mudou de ideia, a Revisão geral saiu do app por completo (tarefas, rotinas, atividade e preferência apagadas pela migration `remover_revisao_geral`).

- [x] imagem um pouco maior na hora que tiver selecao de planta(s) pois o usuario tende a pesquisar vendo as fotos
  > Feito em 2026-10-08: a escolha de plantas (Agendar e Registrar, `PlantasLista`) virou grade de fotos quadradas, 3 colunas no celular, com o check no canto.

- [x] na bancada, ao clicar numa planta com tarefa pendente vai pra uma pagina de visualizacao do historico e opcoes para a tarefa, vamos refazer essa pagina para q seja possivel selecionar outros procedimentos pendentes dessa planta para completa-los ou apaga-los ou reagendalos. nessa página nao precisa ter o histórico, vamos colocar só a foto da arvore, ultima tarefa feita e as tarefas pendentes. mas com destaque na tarefa que o usuario clicou.
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-pendentes-da-planta-design.md): a tarefa pendente abre a planta com o último cuidado e todas as pendentes; a tocada vem marcada e destacada; dá para concluir, reagendar (nova data ou adiar N dias) e excluir várias de uma vez; cancelar/pular/editar rotina ficam em "Mais". A página da tarefa concluída não mudou.

- [x] no perfil temos varias preferencias das coisas do app, vamos criar um botao de preferencias dentro do perfil para colocar todas essas opcoes.
  > Feito em 2026-10-08: Perfil → Preferências (`/perfil/preferencias`) com as atividades favoritas (aparecem primeiro nos chips de Registrar/Agendar/Concluir) e as 3 de transplante.

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

- [x] adicionar funcionalidade de foto de inspiracao nas plantas, vai ser uma foto que o usuario pode escolher das proprias fotos dele ou adicionar foto nova, do mesmo jeito que a foto de capa
  > Feito em 2026-10-12: na página da planta a capa desliza para a inspiração (2 pontinhos embaixo); sem inspiração, o 2º slide oferece "Das fotos dela" (galeria em modo escolher) ou "Foto nova" (sobe sem planta, fora da galeria e do histórico). Tocar na inspiração troca/remove; o visualizador de fotos ganhou "Usar como inspiração". Uma por planta no app (o banco aceita várias); excluir a planta apaga a foto avulsa de inspiração.

- [x] mostrar em qual estacao estamos na tela de bancada com o progresso da estacao sendo visivel com um "x dias para prox estacao". para o acesso rapido, vamos transforma-lo em um botao que ficara ao lado do botao de preferencias
  > Estação feita em 2026-10-12: cartão na Bancada com a estação, barra de progresso e "N dias para o verão" (`estacaoAtual` em `web/src/lib/estacoes.ts`). Acesso rápido virou botão (raio) ao lado de Preferências, com os atalhos numa gaveta; a faixa saiu da Bancada.

- [x] ao registrar, quando aparece a tela de tarefas agendadas que serao concluidas, hoje aparece apenas "Tarefa - #ID", faca com que apareca a foto da planta em questao tambem
  > Feito em 2026-10-12: miniatura da capa ao lado de cada tarefa.

- [x] na tela de detalhes de procedimento feito, vamos alterar algumas coisas:
  - a primeira coisa q aparece é a foto de capa da planta com o id e especie, nao precisamos disso pode tirar
  - a primeira coisa passa a ser o titulo (decidir se vamos fazer um titulo para a pagina ou usar o do header da pagina) com as informacoes de concluido, data e obs e descricao
  - abaixo temos o historico, vamos retirar ele tambem
  - a baixo das informacoes vamos colocar as fotos adicionadas nesse procedimento, caso seja mais de uma fazemos a mesma dinamica de scroll lateral em roda das fotos
  - no canto superior direito, vamos colocar um botao de edicao, para o usuario poder editar as informacoes do procedimento caso ache necessario e/ou poder excluir o procedimento feito (veja que caso isso altere alguma outra funcionalidade externa como exemplo, excluiu transplante > a planta deve sair de recem transplantada, caso esteja, e ir para o grupo que ela estava antes)
  - vamos fazer com que os procedimentos do historico sejam scrolaveis... caso a pessoa esteja nos detalhes de um, se ela scrolar para o lado vai para o seguinte ou volta para o anterior
  > Feito em 2026-10-12 (spec em docs/superpowers/specs/2026-10-12-detalhe-do-cuidado-design.md): a página mostra o card do dia (título, data, notas, fotos em roda), desliza entre os cuidados feitos da planta e o lápis abre a edição (data, tirar tarefa, descrição/obs.) e o Excluir. Excluir ou mudar o Transplante que pôs a planta em Recém transplantada a devolve ao grupo anterior — vale para qualquer caminho que grava tarefas (registrar, concluir, editar, excluir).

- [x] na tela de detalhes da planta, retire a sessao "ultimos cuidados", e nos cards de procedimentos da roda de historico e cuidados, vamos fazer com que mostre ao inves do dia, mostre "daqui 10 dias" ou "1 mes atras"
  > Feito em 2026-10-12: "Últimos cuidados" saiu; os cards mostram `distanciaRelativa` (`web/src/lib/format.ts`).

- [x] na tela de fotos, vamos separar as fotos em anos e meses e fazer uma lista na vertical, em ordem do mais novo para o mais velho, como:
  fotos
    2026
      abril
       "foto"
       "foto"
      janeiro
       "foto"
    2024
      maio
        "foto"
        "foto"
  > Feito em 2026-10-12: galeria agrupada por ano e mês (`fotosPorMes` em `web/src/lib/linhaDoTempo.ts`).

- [x] nao tem pq ter botao de excluir e cancelar ao mesmo tempo nas tarefas agendadas, vamos deixar apenas botao de excluir.
  > Feito em 2026-10-12: "Cancelar tarefa" saiu; "Mais" só aparece quando há tarefa de rotina (pular / editar rotina).

- [x] vamos adicionar um botao de adicionar rotina no modal "+" onde temos varias outras coisas, onde a pessoa pode adicionar rotinas e escolher entre diversas plantas e/ou uma só
  > Feito em 2026-10-12: "Criar rotina" no "+" abre o Agendar já em Repetir (`/agendar?repetir=1`).

- MUDAR DINAMICA PARA CABER ADUBACAO LIQUIDA SEM INTERFERIR OUTRAS FUNCIONALIDADES

# ideias para o futuro:
- espaco do bonsai em 3d?
- alguma animacao ou icone especial para plantas fazendo aniversario
- animacoes gerais ao completar alguns objetivos como 100 plantas adicionadas, 1000 cuidados feitos etc
- investigar codigo para possiveis erros q possam ter em endpoints e outras coisas, e otimizar as coisas e melhorar logs de erros e outras coisas