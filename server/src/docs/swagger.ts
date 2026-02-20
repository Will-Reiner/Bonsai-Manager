import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bonsai Manager API',
    version: '1.0.0',
    description: 'Documentação da API do Bonsai Manager usando OpenAPI 3.0',
  },
  servers: [
    { url: serverUrl, description: 'API (Docker/Local)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          nomePublico: { type: 'string', nullable: true },
          fotoPerfilUrl: { type: 'string', nullable: true },
          perfilPublico: { type: 'boolean' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Especie: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nomeCientifico: { type: 'string' },
          nomeComum: { type: 'string', nullable: true },
          origem: { type: 'string', nullable: true },
          tipoDePlanta: { type: 'string', nullable: true },
        },
      },
      Planta: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string', nullable: true },
          dataAquisicao: { type: 'string', format: 'date-time', nullable: true },
          modoAquisicao: { type: 'string', nullable: true },
          observacoes: { type: 'string', nullable: true },
          plantaPublica: { type: 'boolean' },
          historicoPublico: { type: 'boolean' },
          especieId: { type: 'string', format: 'uuid' },
        },
      },
      Atividade: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          descricao: { type: 'string', nullable: true },
          objetivos: { type: 'string', nullable: true },
          preparacao: { type: 'string', nullable: true },
          execucao: { type: 'string', nullable: true },
          cuidadosPosProcedimento: { type: 'string', nullable: true },
        },
      },
      Agenda: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          dataAgendada: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDENTE', 'CONCLUIDO', 'CANCELADO'] },
          plantaId: { type: 'string', format: 'uuid' },
          atividadeId: { type: 'string', format: 'uuid' },
        },
      },
      Recurso: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tipoRecursoId: { type: 'string', format: 'uuid' },
          quantidadeDisponivel: { type: 'integer' },
          unidadeMedida: { type: 'string', nullable: true },
          observacoes: { type: 'string', nullable: true },
        },
      },
      TipoRecurso: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
        },
      },
      Foto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          caminhoArquivo: { type: 'string' },
          titulo: { type: 'string', nullable: true },
          plantaId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      Ferramenta: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          descricao: { type: 'string', nullable: true },
        },
      },
      GuiaSazonal: {
        type: 'object',
        properties: {
          especieId: { type: 'string', format: 'uuid' },
          atividadeId: { type: 'string', format: 'uuid' },
          estacao: { type: 'string', enum: ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'] },
          momentoIdeal: { type: 'string', enum: ['DEVE_FAZER', 'PODE_FAZER', 'EVITAR'] },
          observacoes: { type: 'string', nullable: true },
        },
      },
      GuiaDeTecnicas: {
        type: 'object',
        properties: {
          especieId: { type: 'string', format: 'uuid' },
          atividadeId: { type: 'string', format: 'uuid' },
          recomendacao: { type: 'string', enum: ['RECOMENDADA', 'NAO_RECOMENDADA', 'COM_CUIDADO'] },
          observacoes: { type: 'string', nullable: true },
        },
      },
      Amizade: {
        type: 'object',
        properties: {
          seguidorId: { type: 'string', format: 'uuid' },
          seguidoId: { type: 'string', format: 'uuid' },
        },
      },
      Inspiracao: {
        type: 'object',
        properties: {
          plantaId: { type: 'string', format: 'uuid' },
          fotoId: { type: 'string', format: 'uuid' },
        },
      },
      AtividadeRecurso: {
        type: 'object',
        properties: {
          atividadeId: { type: 'string', format: 'uuid' },
          tipoRecursoId: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth' },
    { name: 'Especies' },
    { name: 'Plantas' },
    { name: 'Atividades' },
    { name: 'Agendas' },
    { name: 'Tipos de Recurso' },
    { name: 'Recursos' },
    { name: 'Fotos' },
    { name: 'Ferramentas' },
    { name: 'Guias Sazonais' },
    { name: 'Amizades' },
    { name: 'Inspirações' },
    { name: 'Guias de Técnicas' },
    { name: 'Atividades-Recursos' },
    { name: 'Atividades-Recursos Sugeridos' },
    { name: 'Atividades-Ferramentas Sugeridas' },
    { name: 'Usuários' },
  ],
  paths: {
    // Auth
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuário',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { nome: { type: 'string' }, email: { type: 'string' }, senha: { type: 'string' } }, required: ['nome', 'email', 'senha'] } } },
        },
        responses: { '201': { description: 'Usuário registrado' }, '400': { description: 'Dados inválidos' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, senha: { type: 'string' } }, required: ['email', 'senha'] } } },
        },
        responses: { '200': { description: 'Token JWT' }, '401': { description: 'Credenciais inválidas' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obter perfil do usuário logado',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Perfil do usuário', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, '401': { description: 'Não autorizado' } },
      },
      put: {
        tags: ['Auth'],
        summary: 'Atualizar perfil do usuário logado',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
        responses: { '200': { description: 'Perfil atualizado' }, '401': { description: 'Não autorizado' } },
      },
    },

    // Especies
    '/api/especies': {
      get: { tags: ['Especies'], summary: 'Listar espécies', responses: { '200': { description: 'Lista de espécies' } } },
      post: { tags: ['Especies'], summary: 'Criar espécie', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Especie' } } } }, responses: { '201': { description: 'Espécie criada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/especies/{id}': {
      get: { tags: ['Especies'], summary: 'Obter espécie por ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Espécie' }, '404': { description: 'Não encontrada' } } },
      put: { tags: ['Especies'], summary: 'Atualizar espécie', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Especie' } } } }, responses: { '200': { description: 'Espécie atualizada' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Especies'], summary: 'Deletar espécie', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletada' }, '401': { description: 'Não autorizado' } } },
    },

    // Plantas
    '/api/plantas': {
      get: { tags: ['Plantas'], summary: 'Listar plantas do usuário', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista de plantas' }, '401': { description: 'Não autorizado' } } },
      post: { tags: ['Plantas'], summary: 'Criar planta', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Planta' } } } }, responses: { '201': { description: 'Planta criada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/plantas/{id}': {
      get: { tags: ['Plantas'], summary: 'Obter planta por ID', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Planta' }, '404': { description: 'Não encontrada' }, '401': { description: 'Não autorizado' } } },
      put: { tags: ['Plantas'], summary: 'Atualizar planta', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Planta' } } } }, responses: { '200': { description: 'Planta atualizada' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Plantas'], summary: 'Deletar planta', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletada' }, '401': { description: 'Não autorizado' } } },
    },

    // Agendas
    '/api/agendas': {
      get: { tags: ['Agendas'], summary: 'Listar agendas do usuário', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista de agendas' }, '401': { description: 'Não autorizado' } } },
      post: { tags: ['Agendas'], summary: 'Criar agenda', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Agenda' } } } }, responses: { '201': { description: 'Agenda criada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/agendas/{id}': {
      put: { tags: ['Agendas'], summary: 'Atualizar agenda', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Agenda' } } } }, responses: { '200': { description: 'Agenda atualizada' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Agendas'], summary: 'Deletar agenda', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletada' }, '401': { description: 'Não autorizado' } } },
    },

    // Recursos
    '/api/recursos': {
      get: { tags: ['Recursos'], summary: 'Listar recursos do usuário', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista de recursos' }, '401': { description: 'Não autorizado' } } },
      post: { tags: ['Recursos'], summary: 'Criar recurso', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Recurso' } } } }, responses: { '201': { description: 'Recurso criado' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/recursos/{id}': {
      get: { tags: ['Recursos'], summary: 'Obter recurso por ID', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Recurso' }, '404': { description: 'Não encontrado' }, '401': { description: 'Não autorizado' } } },
      put: { tags: ['Recursos'], summary: 'Atualizar recurso', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Recurso' } } } }, responses: { '200': { description: 'Recurso atualizado' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Recursos'], summary: 'Deletar recurso', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletado' }, '401': { description: 'Não autorizado' } } },
    },

    // Tipos de Recurso
    '/api/tipos-recurso': {
      get: { tags: ['Tipos de Recurso'], summary: 'Listar tipos de recurso', responses: { '200': { description: 'Lista de tipos de recurso' } } },
      post: { tags: ['Tipos de Recurso'], summary: 'Criar tipo de recurso', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TipoRecurso' } } } }, responses: { '201': { description: 'Tipo de recurso criado' }, '403': { description: 'Acesso negado' } } },
    },
    '/api/tipos-recurso/{id}': {
      get: { tags: ['Tipos de Recurso'], summary: 'Obter tipo de recurso por ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Tipo de recurso' }, '404': { description: 'Não encontrado' } } },
      put: { tags: ['Tipos de Recurso'], summary: 'Atualizar tipo de recurso', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TipoRecurso' } } } }, responses: { '200': { description: 'Atualizado' }, '403': { description: 'Acesso negado' } } },
      delete: { tags: ['Tipos de Recurso'], summary: 'Deletar tipo de recurso', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletado' }, '403': { description: 'Acesso negado' } } },
    },

    // Fotos
    '/api/fotos': {
      post: { tags: ['Fotos'], summary: 'Criar foto', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Foto' } } } }, responses: { '201': { description: 'Foto criada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/fotos/{id}': {
      get: { tags: ['Fotos'], summary: 'Obter foto por ID', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Foto' }, '404': { description: 'Não encontrada' }, '401': { description: 'Não autorizado' } } },
      put: { tags: ['Fotos'], summary: 'Atualizar foto', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Foto' } } } }, responses: { '200': { description: 'Foto atualizada' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Fotos'], summary: 'Deletar foto', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/fotos/planta/{plantaId}': {
      get: { tags: ['Fotos'], summary: 'Listar fotos da planta', security: [{ bearerAuth: [] }], parameters: [{ name: 'plantaId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lista de fotos' }, '401': { description: 'Não autorizado' } } },
    },

    // Usuários
    '/api/users': {
      get: { tags: ['Usuários'], summary: 'Listar perfis públicos', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista de usuários' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/users/{id}': {
      get: { tags: ['Usuários'], summary: 'Obter perfil por ID', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Perfil' }, '404': { description: 'Não encontrado' }, '401': { description: 'Não autorizado' } } },
    },

    // Atividades
    '/api/atividades': {
      get: { tags: ['Atividades'], summary: 'Listar atividades', responses: { '200': { description: 'Lista de atividades' } } },
      post: { tags: ['Atividades'], summary: 'Criar atividade', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Atividade' } } } }, responses: { '201': { description: 'Atividade criada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/atividades/{id}': {
      get: { tags: ['Atividades'], summary: 'Obter atividade por ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Atividade' }, '404': { description: 'Não encontrada' } } },
      put: { tags: ['Atividades'], summary: 'Atualizar atividade', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Atividade' } } } }, responses: { '200': { description: 'Atividade atualizada' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Atividades'], summary: 'Deletar atividade', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletada' }, '401': { description: 'Não autorizado' } } },
    },

    // Ferramentas
    '/api/ferramentas': {
      get: { tags: ['Ferramentas'], summary: 'Listar ferramentas', responses: { '200': { description: 'Lista de ferramentas' } } },
      post: { tags: ['Ferramentas'], summary: 'Criar ferramenta', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Ferramenta' } } } }, responses: { '201': { description: 'Ferramenta criada' }, '403': { description: 'Acesso negado' } } },
    },
    '/api/ferramentas/{id}': {
      get: { tags: ['Ferramentas'], summary: 'Obter ferramenta por ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Ferramenta' }, '404': { description: 'Não encontrada' } } },
      put: { tags: ['Ferramentas'], summary: 'Atualizar ferramenta', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Ferramenta' } } } }, responses: { '200': { description: 'Ferramenta atualizada' }, '403': { description: 'Acesso negado' } } },
      delete: { tags: ['Ferramentas'], summary: 'Deletar ferramenta', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deletada' }, '403': { description: 'Acesso negado' } } },
    },

    // Guias Sazonais
    '/api/guias-sazonais': {
      post: { tags: ['Guias Sazonais'], summary: 'Criar guia sazonal', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GuiaSazonal' } } } }, responses: { '201': { description: 'Guia sazonal criado' }, '403': { description: 'Acesso negado' } } },
    },
    '/api/guias-sazonais/{especieId}/{atividadeId}/{estacao}': {
      put: { tags: ['Guias Sazonais'], summary: 'Atualizar guia sazonal', security: [{ bearerAuth: [] }], parameters: [
        { name: 'especieId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'estacao', in: 'path', required: true, schema: { type: 'string', enum: ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'] } },
      ], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GuiaSazonal' } } } }, responses: { '200': { description: 'Guia sazonal atualizado' }, '403': { description: 'Acesso negado' } } },
      delete: { tags: ['Guias Sazonais'], summary: 'Deletar guia sazonal', security: [{ bearerAuth: [] }], parameters: [
        { name: 'especieId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'estacao', in: 'path', required: true, schema: { type: 'string', enum: ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'] } },
      ], responses: { '204': { description: 'Deletado' }, '403': { description: 'Acesso negado' } } },
    },

    // Guias de Técnicas
    '/api/guias-de-tecnicas': {
      post: { tags: ['Guias de Técnicas'], summary: 'Criar guia de técnicas', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GuiaDeTecnicas' } } } }, responses: { '201': { description: 'Guia de técnicas criado' }, '403': { description: 'Acesso negado' } } },
    },
    '/api/guias-de-tecnicas/{especieId}/{atividadeId}': {
      put: { tags: ['Guias de Técnicas'], summary: 'Atualizar guia de técnicas', security: [{ bearerAuth: [] }], parameters: [
        { name: 'especieId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
      ], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GuiaDeTecnicas' } } } }, responses: { '200': { description: 'Guia de técnicas atualizado' }, '403': { description: 'Acesso negado' } } },
      delete: { tags: ['Guias de Técnicas'], summary: 'Deletar guia de técnicas', security: [{ bearerAuth: [] }], parameters: [
        { name: 'especieId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '204': { description: 'Deletado' }, '403': { description: 'Acesso negado' } } },
    },

    // Amizades
    '/api/amizades/follow/{seguidoId}': {
      post: { tags: ['Amizades'], summary: 'Seguir utilizador', security: [{ bearerAuth: [] }], parameters: [{ name: 'seguidoId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Agora segue o utilizador' }, '400': { description: 'Não pode seguir a si mesmo' }, '404': { description: 'Utilizador não encontrado' }, '409': { description: 'Já está a seguir' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/amizades/unfollow/{seguidoId}': {
      delete: { tags: ['Amizades'], summary: 'Deixar de seguir utilizador', security: [{ bearerAuth: [] }], parameters: [{ name: 'seguidoId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deixou de seguir' }, '404': { description: 'Não está a seguir' }, '401': { description: 'Não autorizado' } } },
    },

    // Inspirações
    '/api/inspiracoes/{plantaId}/{fotoId}': {
      post: { tags: ['Inspirações'], summary: 'Adicionar inspiração à planta', security: [{ bearerAuth: [] }], parameters: [
        { name: 'plantaId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'fotoId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '201': { description: 'Inspiração adicionada' }, '404': { description: 'Planta ou foto não encontrada' }, '403': { description: 'Acesso à foto negado' }, '401': { description: 'Não autorizado' } } },
      delete: { tags: ['Inspirações'], summary: 'Remover inspiração da planta', security: [{ bearerAuth: [] }], parameters: [
        { name: 'plantaId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'fotoId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '204': { description: 'Inspiração removida' }, '404': { description: 'Inspiração não encontrada' }, '403': { description: 'Acesso à foto negado' }, '401': { description: 'Não autorizado' } } },
    },

    // Associações Atividades-Recursos
    '/api/atividades-recursos': {
      post: { tags: ['Atividades-Recursos'], summary: 'Associar tipo de recurso a atividade', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AtividadeRecurso' } } } }, responses: { '201': { description: 'Associação criada' }, '404': { description: 'Atividade ou tipo de recurso não encontrado' }, '409': { description: 'Associação já existe' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/atividades-recursos/atividade/{atividadeId}': {
      get: { tags: ['Atividades-Recursos'], summary: 'Listar tipos de recurso por atividade', security: [{ bearerAuth: [] }], parameters: [{ name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lista de tipos de recurso' }, '404': { description: 'Atividade não encontrada' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/atividades-recursos/tipo-recurso/{tipoRecursoId}': {
      get: { tags: ['Atividades-Recursos'], summary: 'Listar atividades por tipo de recurso', security: [{ bearerAuth: [] }], parameters: [{ name: 'tipoRecursoId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lista de atividades' }, '404': { description: 'Tipo de recurso não encontrado' }, '401': { description: 'Não autorizado' } } },
    },
    '/api/atividades-recursos/{atividadeId}/{tipoRecursoId}': {
      delete: { tags: ['Atividades-Recursos'], summary: 'Remover associação', security: [{ bearerAuth: [] }], parameters: [
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'tipoRecursoId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '204': { description: 'Associação removida' }, '404': { description: 'Associação não encontrada' }, '401': { description: 'Não autorizado' } } },
    },

    // Sugeridas: Atividades-Ferramentas
    '/api/atividades-ferramentas-sugeridas/{atividadeId}/{ferramentaId}': {
      post: { tags: ['Atividades-Ferramentas Sugeridas'], summary: 'Sugerir ferramenta para atividade', security: [{ bearerAuth: [] }], parameters: [
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'ferramentaId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '201': { description: 'Sugestão criada' }, '403': { description: 'Acesso negado' } } },
      delete: { tags: ['Atividades-Ferramentas Sugeridas'], summary: 'Remover sugestão de ferramenta', security: [{ bearerAuth: [] }], parameters: [
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'ferramentaId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '204': { description: 'Sugestão removida' }, '403': { description: 'Acesso negado' } } },
    },

    // Sugeridas: Atividades-Recursos
    '/api/atividades-recursos-sugeridos/{atividadeId}/{tipoRecursoId}': {
      post: { tags: ['Atividades-Recursos Sugeridos'], summary: 'Sugerir tipo de recurso para atividade', security: [{ bearerAuth: [] }], parameters: [
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'tipoRecursoId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '201': { description: 'Sugestão criada' }, '403': { description: 'Acesso negado' } } },
      delete: { tags: ['Atividades-Recursos Sugeridos'], summary: 'Remover sugestão de recurso', security: [{ bearerAuth: [] }], parameters: [
        { name: 'atividadeId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'tipoRecursoId', in: 'path', required: true, schema: { type: 'string' } },
      ], responses: { '204': { description: 'Sugestão removida' }, '403': { description: 'Acesso negado' } } },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;