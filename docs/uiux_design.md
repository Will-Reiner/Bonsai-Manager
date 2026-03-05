UI/UX: 
- bottom bar com os icones:
    - Home
    - Coleção
    - "+" para adicionar planta/foto/intervenção
    - Enciclopédia
    - Comunidade
- Abaixo todas as telas estao sendo explicadas pensando em uma criacao de cima para baixo, ou seja, o que aparece primeiro na tela e assim por diante.

1. Home
- Header, na esquerda um circulo com foto de perfil e a mensagem ao lado "bem vindo [nome]" e na direita um icone de notificacoes
- card com temperatura atual, umidade do ar e uma barra de progresso da estação atual (em qual estamos e qual a proxima... mostrar de maneira efetiva quanto tempo falta para a proxima estação)
- titulo "Tarefas" e um icone de "ver todas" que leva para a pagina de tarefas
- card de "tarefas" pendentes por prioridade (mostrar de maneira simplista para a pessoa ser obrigada a entrar na pagina de "Tarefas" para ver os detalhes):
    - X tarefas em atraso!!
    - Y transplantes até fim do verão
    - Adubação da semana (check do lado para marcar como feito)
    - Z plantas que precisam de atenção
- card de gamificacao (Metas, progresso, badges, etc)
- card de dicas boas para a época do ano

1.1. Página de Tarefas (repensar talvez)
- To-do Inteligente (separar por prioridade e categoria)
    - para cada uma das prioridades, conter lista de tarefas por categorias se possivel (aramação, adubação, transplante, pragas, etc)
        - urgentes
        - importantes
        - normais
    - cada tarefa deve ter um botao para ampliar que mostra mais detalhes logo abaixo onde a pessoa pode marcar como feito, adiar, etc


2. Coleção
- Header escrito "Minha Coleção" centralizado e um icone de perfil com a foto do usuario na direita
- Um card que mostra as plantas favoritas do usuario (mostra uma por vez, a cada 2 seg muda para outra)
    - A foto da planta ocupa 100% do card
    - Canto inferior esquerdo mostra o nome da planta como titulo e logo abaixo a idade, espécie e o id
    - na parte mais inferior, centralizado, mostrar pequenos pontinhos e quase transparentes para demarcar quantas plantas tem no total do carrosel e qual está sendo mostrada
- Um pequeno card mostrando estaticas da coleção, como: total de plantas, total de espécies, total de intervenções, total de pragas eliminadas, etc
- Filtragem simples com "Todas as plantas", "Coniferas", "Frutiferas", "Deciduas", "Arbustos", "Outras" no estilo de botões na horizontal onde o usuario pode dar um slide para ir vendo as opcoes
- Logo abaixo, mostrar as plantas em formato de grade, 2 por linha, com a foto ocupando 70% do card e o nome da planta como titulo e o id e espécie abaixo do titulo no canto inferior esquerdo

2.1. Detalhes da planta
- header: na esquerda botao de voltar, no meio "Detalhes da planta" e na direita botao com tres pontinhos para acessar opcoes
- card com foto da planta ocupa 100% do card
- card com nome, especie, idade, estilo, pote, id, favorita, etc
- na horizontal, 3 cards: 1 mostrando quando a proxima adubacao, 2 mostrando prox transplante, 3 mostrando proxima estilização
- Titulo "Foto" e ao lado botao sem borda "Todas" para mostrar as fotos da planta
- fotos em formato de grade, 2 por linha, com a foto ocupando 100% do card
- Titulo "Historico" e ao lado botao sem borda "Todos" para ir para a pagina de tarefas com filtragem da planta e tarefas completadas
- card mostrando historico reduzido, um procedimento a cada linha com nome e data apenas (maximo de 3 procedimentos)

3. Enciclopédia
- Header escrito "Enciclopédia" centralizado e um icone de perfil com a foto do usuario na direita
- Card de leituras recomendadas(recomendação primeiro por leituras salvas pelo usuario (ver como fazer para n ficar repetitivo), segundo por leituras interessantes para a época do ano e terceiro por leituras mais visualizadas) no formato de carrosel (mostra uma por vez, a cada 2 seg muda para outra)
    - A foto da leitura ocupa 100% do card
    - Canto inferior esquerdo mostra o titulo da leitura como titulo e logo abaixo uma espectativa de tempo de leitura e ao lado um icone de olho para quantas pessoas ja visualizaram
    - na parte mais inferior, centralizado, mostrar pequenos pontinhos e quase transparentes para demarcar quantas leituras tem no total do carrosel e qual está sendo mostrada
- card de "continuar leituras" (mostrar leituras que o usuario parou de ler no meio, mostrando a % concluida ja)
- Filtragem simples com "todos topicos", "Guias de iniciantes", "Podas", "Aramacao", "Pragas", "Adubacao", "Transplante", "Outros" no estilo de botões na horizontal onde o usuario pode dar um slide para ir vendo as opcoes
- Logo abaixo, mostrar as leituras em lista, com icone na esquerda e ao lado, titulo, breve resumo, tempo estimado de leitura e um icone de "salvar" para salvar a leitura para ler depois

4. Comunidade
- A pensar (no momento, deixar como "Página em construção")

5. Configurações
