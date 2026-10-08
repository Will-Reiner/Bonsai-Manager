# para fazer agora:

- [ ] criar acesso rapido na bancada para por exemplo: registrar adubacao liquida em todas, registrar aplicacao de enraizador em todas pre-transplante e/ou pos transplante. permitir usuario configurar botoes de acesso rapido com suas preferencias e tarefas.

- [x] ao registrar duas tarefas, entra as duas separadas no histórico, logo se coloquei adubacao e desaramacao e coloquei uma obs e descrição em específico para uma das tarefas, esse texto pode acabar em um card errado então das duas uma: ou a gente junta os cards quando as tarefas forem registradas juntas ou a gnt separa a descrição e obs por tarefa na hora de registrar. oq vc sugere? eu pensando na UX acho que a primeira ideia faz mais sentido pois é menos coisa q o usuario deve fazer
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-card-unico-historico-design.md): o histórico junta num card tudo o que foi feito na planta no mesmo dia (fotos do dia inclusas), com as notas apontando para a tarefa quando não valem para todas; na tarefa concluída dá para deslizar entre as tarefas do dia; o registro grava descrição/obs. em todas as tarefas; o Ajustar do Concluir mostra o nome da tarefa.

- [x] a revisao geral nao esta funcionando do jeito que deveria, testei e tem atividades para o dia x e tem revisao geral no dia x tb. eu sei q a tarefa foi trocada por uma rotina em uma sessao de ontem... vamos fazer com q ela deixe de ser rotina e seja uma tarefa comum que só X dias depois caso o usuario n tenha agendado nenhuma outra tarefa. e torne a revisao geral como desligada por padrao
  > Feito em 2026-10-08: mudou de ideia, a Revisão geral saiu do app por completo (tarefas, rotinas, atividade e preferência apagadas pela migration `remover_revisao_geral`).

- [ ] imagem um pouco maior na hora que tiver selecao de planta(s) pois o usuario tende a pesquisar vendo as fotos

- [ ] na bancada, ao clicar numa planta com tarefa pendente vai pra uma pagina de visualizacao do historico e opcoes para a tarefa, vamos refazer essa pagina para q seja possivel selecionar outros procedimentos pendentes dessa planta para completa-los ou apaga-los ou reagendalos. nessa página nao precisa ter o histórico, vamos colocar só a foto da arvore, ultima tarefa feita e as tarefas pendentes. mas com destaque na tarefa que o usuario clicou.

- [ ] no perfil temos varias preferencias das coisas do app, vamos criar um botao de preferencias dentro do perfil para colocar todas essas opcoes.

- [x] ID tem q comecar a ser obrigatorio visto que ao adicionar fotos, fazemos tudo pelo fluxo de ID. Logo, caso o usuario nao adicione ID, adicione automaticamente um ID para ele. (veja que o ID tem q sempre ser um numero)
  > Feito em 2026-10-08 (spec em docs/superpowers/specs/2026-10-08-id-obrigatorio-design.md): ID virou número obrigatório; sem ID o servidor gera o próximo livre; a migration numerou as plantas antigas (códigos com letras descartados).

- [ ] tela de concluido apos criar nova planta tem coisa errada kkk vamos alterar ela

# ideias para o futuro:
- alguma animacao ou icone especial para plantas fazendo aniversario
- animacoes gerais ao completar alguns objetivos como 100 plantas adicionadas, 1000 cuidados feitos etc
- 