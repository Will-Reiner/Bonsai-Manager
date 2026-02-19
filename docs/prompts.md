**Sugestao e homologacao de especies** OKKKKKKKKKKKKK

"Implemente um fluxo de Sugestão e Homologação de Espécies para permitir que usuários cadastrem suas plantas sem bloqueios, mantendo a integridade da enciclopédia oficial.

## Requisitos de Arquitetura:

- Status da Espécie: A entidade "Espécie" deve passar a ter um indicador de status com dois estados: VERIFICADO (oficial, curado pela administração) e SUGERIDO (criado por usuários, aguardando revisão).
- Rastreabilidade: Deve ser possível identificar qual usuário criou uma espécie sugerida.

## Regras de Negócio e Permissões:

- Criação (Usuário Comum): Usuários padrão podem cadastrar novas espécies. O sistema deve forçar automaticamente o status dessas novas entradas para SUGERIDO, independentemente do que for enviado. Para esses casos, apenas o "Nome Comum" deve ser obrigatório.
- Disponibilidade Imediata: Assim que uma espécie "SUGERIDA" é criada, ela deve ficar visível nas buscas e disponível para ser vinculada a plantas por qualquer usuário (não apenas pelo criador).
- Criação/Edição (Admin): Apenas administradores podem criar espécies diretamente como VERIFICADO ou alterar o status de uma espécie existente de "SUGERIDO" para "VERIFICADO".

## Fluxo de Aprovação (Back-office):

- O sistema deve fornecer meios para listar apenas as espécies com status SUGERIDO (fila de homologação).
- O processo de homologação consiste em: o administrador revisa os dados, corrige informações técnicas (como Nome Científico), adiciona fotos oficiais e altera o status para VERIFICADO.
- A alteração de status não deve quebrar o vínculo com as plantas que já estão utilizando aquela espécie."




**armazenamento de midia**

Implemente um módulo global de **Gerenciamento de Mídia** (Fotos e Vídeos) utilizando Cloudflare R2 e upload via Presigned URLs.

**1. Back-End:**
* **Configuração S3:** Configure o cliente AWS SDK v3 apontando para o endpoint do Cloudflare R2.
* **Endpoint de Assinatura:** Crie uma rota para isso.
    * Entrada: `fileName` e `fileType`.
    * Saída: URL assinada (PUT) para upload direto e a URL pública final do arquivo.
    * Segurança: Apenas usuários autenticados podem gerar URLs.

**2. Front-End:**
* **Serviço de Compressão:** Crie um utilitário.
    * Para imagens: Converta para **WebP**, redimensione para `max-width: 1080px` e qualidade `0.8`.
    * Para videos: comprima para 720p e balanceie o bitrate. Antes de comprimir, verifique a duracao, rejeite videos com mais de 60 segundos.
        * Thumbnail: Gere automaticamente uma imagem de thumbnail do vídeo para exibir nas listas sem precisar carregar o vídeo inteiro.
* **Hook de Upload:** Crie um hook que abstraia o fluxo:
    1.  Recebe o arquivo local.
    2.  Comprime.
    3.  Solicita a Presigned URL à API.
    4.  Faz o upload diretamente para o R2.
    5.  Retorna a URL, tipo (video/foto), thumbnail etc para a tela.

**Contexto:** Essa infraestrutura será reutilizada em todo o app (perfil, diário, galeria), portanto, mantenha o código genérico e desacoplado de entidades específicas.

**UX/UI:** Enquanto o vídeo comprime e sobe (pode levar alguns segundos), exiba uma barra de progresso real para o usuário não achar que o app travou.



**foto na criacao da planta**

Atualize o fluxo de **Criação de Planta** para suportar a definição de uma foto de capa no momento do cadastro. Adicione um componente de "Selecionar Capa" no topo do formulário. Integre com o hook de upload de midia.




**Estilização Virtual**

Implemente a funcionalidade de Estilização Virtual ("Paint" para Bonsai), permitindo que o usuário desenhe esboços sobre fotos existentes de suas plantas para planejar o futuro.

1. vamos retirar o campo visao (string) da tabela Planta. Adicionar na tabela fotos o tipo {regular ou visao_futura} e um campo para descricao ou observacao (ver se ja existe isso). Agora a visao futura será uma foto com esboço e descrição.

2. Editor de Desenho: Utilize uma biblioteca de desenho sobre imagem. 

Interface do Editor (Modal):
- Deve receber uma URL de imagem de fundo (a foto atual da planta).
- Paleta de Cores: Restrinja a cores úteis para bonsai: Verde Musgo, Marrom Madeira, Preto, Branco e Vermelho para detalhes como futuros cortes.
- Ferramentas: Controle de espessura do pincel e botão "Desfazer" (Undo).

Fluxo de Salvamento:
- Ao concluir o desenho, a biblioteca deve exportar a imagem combinada (fundo + desenho) para um arquivo local.
- Reutilização de Infra: Utilize o hook global já criado para fotos/vídeos para processar e fazer o upload dessa imagem gerada para o Cloudflare R2.
- Registro na API: Após o upload bem-sucedido, chame o endpoint de criação de foto (POST /fotos), enviando a nova URL e, crucialmente, definindo o campo tipo: 'VISAO_FUTURA'.

3. UX na Tela da Planta:

- Na seção "Visão", adicione um botão para iniciar o editor.
- Exiba a imagem de "Visão Futura" mais recente em destaque nesta seção, se existir.




**Falta de recorrencia**

Falta de Recorrência na agenda de eventos:

Problema: O schema não tem campos para recorrência (ex: "Adubar a cada 15 dias"). O usuário terá que criar manualmente cada evento futuro.

Planejar: Adicionar lógica de repetição na criação da agenda (ex: repetirAcada: dias, dataFimRepeticao).





**Registro de multiplas tarefas**
atualmente é possivel criar/concluir tarefas apenas de 1 a 1. Melhore o UX para ser mais facil de registrar diversos procedimentos ao mesmo tempo (ex:transplante,poda,adubacao). Estou pensando em criar um botao de "Registrar manutencao" onde tera um checklist de diversas atividades (quem sabe fazer um batch processing para isso, o que acha?). Faça tambem um input inteligente de atividades e recursos baseado nas escolhas que o usuario vai fazendo, exemplo: adicionou transplante > possivelmente teve poda de raizes e adubacao; se marcou adubacao, pede o adubo de recurso.




**atualização em recursos**
A tabela TipoRecurso só tem nome. Isso cria uma confusão: se você criar um TipoRecurso chamado "Adubo", você só poderá ter um estoque genérico de adubo. Você não conseguirá diferenciar "Osmocote" de "Bokashi" ou "Torta de Mamona". Se você criar TiposRecurso específicos ("Adubo Bokashi", "Adubo Químico"), o sistema perde a capacidade de agrupar. Você não conseguirá filtrar "Todos os meus Adubos", pois o sistema não sabe que "Bokashi" é um adubo e "Arames" é outra coisa. proponha um solucao.
UX: substitua a lista única por abas ou um filtro principal baseado na categoria do recurso.



****