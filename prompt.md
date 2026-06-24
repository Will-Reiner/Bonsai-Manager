vamos refazer a pagina de tarefas, quero que simplifique deixando apenas o seguinte:
- botao de voltar e ao lado dele o titulo da pagina "Tarefas", na mesma linha, ao lado direito um botao de filtragem em que abre uma tela para a pessoa poder filtrar ou por tipo de tarefa ou por atrasado/hoje/proximas etc
- o resto da pagina contera apenas cards das tarefas com a imagem referente ao bonsai bem grande (mais ou menos 1/3 do width eu acho q vai ficar bom mas fique livre para decidir) na esquerda do card e ao lado as informacoes de Nome da tarefa (em destaque), ID (caso tenha), Nome (caso tenha), status (em atraso, hoje..) e a data. E em baixo disso, um espaco para observacao caso ela exista. Deixe o botao de check como esta

vamos alterar tambem a pagina de concluir tarefa:
- ao clicar em concluir no card da pagina de tarefas, a primeira coisa que aparecerá sera esta tela que ja temos mas com apenas a opcao de adicionar foto da intervencao e abaixo uma barra de status para mostrar ao usuario que tera outra etapa apos essa com um botao de continuar ao lado.
- a proxima etapa consiste em 3 campos: detalhes da realizacao, observacao para o futuro e proximos passos, e logo abaixo a barra de status fica completa e aparece o botao para concluir tarefa.
- para a sessao de "proximos passos", tera o titulo "proximos passos" e logo abaixo todas as tarefas pendentes da arvore em questao em forma de cards contendo nome da tarefa, status e data. logo abaixo destes cards um botao para adicionar uma nova tarefa para a planta, caso a pessoa queira. caso a pessoa clique num card de uma tarefa em proximos passos, abre uma tela para a pessoa modificar a tarefa em questao
- obs: lembre-se que não é necessario o usuario colocar foto, ou detalhe ou observacao para concluir tarefa


- faca os ajustes no codigo necessario.
- subi o banco de dados, a url é postgres://postgres:zqB9u89joSnuYbeFvsw0F4pDe083AU3KQJNGXJDwpCp3Q7XWnSD4YIZae5Nmahpe@oxb6xhq29l9yma1fm2pvzotq:5432/postgres
- subi o servidor, no entanto, meu dns é pelo cloudflare q faco.
- storage de fotos setado tb
- o dominio do servidor ficou em https://bonsai.astraflow.io, altere no codigo tb
- meu celular é android, me ajuda a gerar o apk


Passo 2 — Promova pra ADMIN via SQL. No Coolify, abra o Terminal do recurso
  PostgreSQL (ou SSH na VPS) e rode:

  psql -U postgres -d postgres -c "UPDATE \"Usuario\" SET role='ADMIN' WHERE
  email='williamfilardo@gmail.com';"

  ▎ Detalhes que importam:
  ▎ - O nome da tabela é "Usuario" com U maiúsculo e entre aspas duplas (o
  ▎ Postgres é case-sensitive com nomes assim).
  ▎ - Troque o email pelo que você usou no registro.

  Passo 3 — Confirme:
  psql -U postgres -d postgres -c "SELECT email, role FROM \"Usuario\";"
  Deve mostrar ADMIN. Depois, deslogue e logue de novo no app pra ele pegar o
  novo papel — aí aparecem o painel Admin e as telas de gerenciar
  Atividades/Espécies.

enquanto isso, vamos alterar a pagina inicial, quero algo bem simples, vamos transformar a pagina de tarefas na pagina inicial principal:
- icone de perfil e ao lado um "bem vindo, "nome""
- card mostrando em que estacao estamos com barra de progresso embaixo para o usuario saber onde estamos durante a estacao (sem escrita ou %, apenas a barra)
- abaixo disso, coloque exatamente o que temos na pagina de tarefas
- e é isso