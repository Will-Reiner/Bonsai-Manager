# Guia Prático: TDD e Use Cases no Bonsai Manager

## 📚 Índice
1. [Arquitetura de Arquivos](#arquitetura-de-arquivos)
2. [O que é TDD?](#o-que-é-tdd)
3. [Use Cases na Prática](#use-cases-na-prática)
4. [Estrutura de Testes](#estrutura-de-testes)
5. [Como Rodar Testes Visualmente](#como-rodar-testes-visualmente)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Boas Práticas](#boas-práticas)

---

## 🏗️ Arquitetura de Arquivos

### Estrutura de um Módulo Completo

Cada módulo no projeto segue uma estrutura padronizada. Vamos usar o módulo `especie` como exemplo:

```
src/modules/especie/
├── controllers/
│   ├── especie.controller.ts          # 🎮 Controlador HTTP
│   └── index.ts                       # 📤 Exportações dos controllers
├── schemas/
│   ├── especie.schema.ts              # ✅ Validações de entrada
│   └── index.ts                       # 📤 Exportações dos schemas
├── use-cases/
│   ├── create-especie.use-case.ts     # 🎯 Lógica de criação
│   ├── delete-especie.use-case.ts     # 🗑️ Lógica de exclusão
│   ├── get-all-especies.use-case.ts   # 📋 Lógica de listagem
│   ├── get-especie-by-id.use-case.ts  # 🔍 Lógica de busca por ID
│   ├── update-especie.use-case.ts     # ✏️ Lógica de atualização
│   ├── create-especie.use-case.test.ts # 🧪 Testes de criação
│   ├── delete-especie.use-case.test.ts # 🧪 Testes de exclusão
│   ├── get-all-especies.use-case.test.ts # 🧪 Testes de listagem
│   ├── get-especie-by-id.use-case.test.ts # 🧪 Testes de busca
│   ├── update-especie.use-case.test.ts # 🧪 Testes de atualização
│   └── index.ts                       # 📤 Exportações dos use cases
├── especie.repository.ts              # 🗄️ Acesso aos dados
├── especie.types.ts                   # 📝 Tipos e interfaces
└── index.ts                           # 📤 Exportações do módulo
```

---

### 📁 Função de Cada Arquivo

#### 1. **Controllers** (`*.controller.ts`)
```typescript
// especie.controller.ts
export class EspecieController {
  constructor(
    private createEspecieUseCase: CreateEspecieUseCase,
    private getEspecieByIdUseCase: GetEspecieByIdUseCase
  ) {}

  async create(request: Request, response: Response) {
    // 1. Recebe requisição HTTP
    // 2. Valida dados (usando schemas)
    // 3. Chama o Use Case apropriado
    // 4. Retorna resposta HTTP
  }
}
```

**Responsabilidades:**
- 🌐 Receber requisições HTTP
- ✅ Validar dados de entrada
- 🎯 Chamar Use Cases
- 📤 Retornar respostas HTTP
- 🚫 **NÃO** contém lógica de negócio

#### 2. **Schemas** (`*.schema.ts`)
```typescript
// especie.schema.ts
import { z } from 'zod';

export const createEspecieBodySchema = z.object({
  nomeCientifico: z.string().min(1, 'Nome científico é obrigatório'),
  nomeComum: z.string().optional(),
  familia: z.string().optional(),
});

export const createEspecieSchema = {
  body: createEspecieBodySchema,
};

export const getEspecieByIdSchema = {
  params: z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
  }),
};
```

**Responsabilidades:**
- ✅ Validar formato dos dados
- 🔒 Garantir tipos corretos
- 📋 Definir regras de entrada
- 🚫 Transformar dados se necessário

#### 3. **Use Cases** (`*.use-case.ts`)
```typescript
// create-especie.use-case.ts
export class CreateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    // 1. Validações de negócio
    const exists = await this.especieRepository.existsByNomeCientifico(data.nomeCientifico);
    if (exists) {
      throw new ConflictError('Espécie já existe');
    }

    // 2. Operações de negócio
    const especie = await this.especieRepository.create(data);

    // 3. Retorno do resultado
    return especie;
  }
}
```

**Responsabilidades:**
- 🎯 **Lógica de negócio principal**
- ✅ Validações específicas do domínio
- 🔄 Orquestração de operações
- 🗄️ Interação com repositórios
- 🚫 **NÃO** conhece HTTP ou banco de dados

#### 4. **Testes de Use Cases** (`*.use-case.test.ts`)
```typescript
// create-especie.use-case.test.ts
describe('CreateEspecieUseCase', () => {
  let useCase: CreateEspecieUseCase;
  let mockRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    // Setup dos mocks
    mockRepository = {
      create: jest.fn(),
      existsByNomeCientifico: jest.fn(),
    } as jest.Mocked<EspecieRepository>;
    
    useCase = new CreateEspecieUseCase(mockRepository);
  });

  it('should create especie successfully', async () => {
    // Teste do cenário de sucesso
  });

  it('should throw error when especie already exists', async () => {
    // Teste do cenário de erro
  });
});
```

**Responsabilidades:**
- 🧪 **Testar lógica de negócio**
- 🎭 Simular dependências (mocks)
- ✅ Verificar cenários de sucesso
- ❌ Verificar cenários de erro
- 🔍 Garantir cobertura de código

#### 5. **Repository** (`*.repository.ts`)
```typescript
// especie.repository.ts
export interface EspecieRepository {
  create(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO>;
  findById(id: string): Promise<EspecieWithRelationsResponseDTO | null>;
  findAll(): Promise<EspecieResponseDTO[]>;
  update(id: string, data: UpdateEspecieRequestDTO): Promise<EspecieResponseDTO>;
  delete(id: string): Promise<void>;
  existsByNomeCientifico(nomeCientifico: string): Promise<boolean>;
}

export class PrismaEspecieRepository implements EspecieRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    return await this.prisma.especie.create({ data });
  }
  
  // ... outras implementações
}
```

**Responsabilidades:**
- 🗄️ **Acesso aos dados**
- 🔌 Abstração do banco de dados
- 📊 Operações CRUD
- 🔍 Consultas específicas
- 🚫 **NÃO** contém lógica de negócio

#### 6. **Types** (`*.types.ts`)
```typescript
// especie.types.ts
export interface CreateEspecieRequestDTO {
  nomeCientifico: string;
  nomeComum?: string;
  familia?: string;
}

export interface EspecieResponseDTO {
  id: string;
  nomeCientifico: string;
  nomeComum: string | null;
  familia: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EspecieWithRelationsResponseDTO extends EspecieResponseDTO {
  guiasDeTecnicas: GuiaDeTecnicasResponseDTO[];
  guiasSazonais: GuiaSazonalResponseDTO[];
}

// Re-exporta o repository para facilitar imports
export { EspecieRepository } from './especie.repository';
```

**Responsabilidades:**
- 📝 **Definir contratos de dados**
- 🔗 Tipos de entrada (Request DTOs)
- 📤 Tipos de saída (Response DTOs)
- 🔄 Interfaces de repositórios
- 📋 Documentação implícita

#### 7. **Index Files** (`index.ts`)

##### **Use Cases Index** (`use-cases/index.ts`)
```typescript
// use-cases/index.ts
export { CreateEspecieUseCase } from './create-especie.use-case';
export { DeleteEspecieUseCase } from './delete-especie.use-case';
export { GetAllEspeciesUseCase } from './get-all-especies.use-case';
export { GetEspecieByIdUseCase } from './get-especie-by-id.use-case';
export { UpdateEspecieUseCase } from './update-especie.use-case';
```

##### **Controllers Index** (`controllers/index.ts`)
```typescript
// controllers/index.ts
export { EspecieController } from './especie.controller';
```

##### **Schemas Index** (`schemas/index.ts`)
```typescript
// schemas/index.ts
export * from './especie.schema';
```

##### **Module Index** (`index.ts`)
```typescript
// index.ts (raiz do módulo)
export * from './controllers';
export * from './schemas';
export * from './use-cases';
export * from './especie.types';
export { EspecieRepository, PrismaEspecieRepository } from './especie.repository';
```

**Responsabilidades dos Index Files:**
- 📤 **Centralizar exportações**
- 🎯 Facilitar imports
- 🧹 Manter organização
- 📋 Ponto único de entrada

---

### 🔄 Fluxo de Dados

```
📱 Cliente HTTP
    ↓
🎮 Controller (recebe requisição)
    ↓
✅ Schema (valida dados)
    ↓
🎯 Use Case (executa lógica de negócio)
    ↓
🗄️ Repository (acessa dados)
    ↓
💾 Banco de Dados
    ↓
🗄️ Repository (retorna dados)
    ↓
🎯 Use Case (processa resultado)
    ↓
🎮 Controller (formata resposta)
    ↓
📱 Cliente HTTP (recebe resposta)
```

---

### 🧪 Fluxo de Testes

```
🧪 Teste
    ↓
🎭 Mock Repository (simula banco)
    ↓
🎯 Use Case (lógica real)
    ↓
✅ Assertions (verifica resultado)
```

**Vantagens desta arquitetura:**
- 🔄 **Separação de responsabilidades**
- 🧪 **Facilita testes unitários**
- 🔧 **Fácil manutenção**
- 📈 **Escalabilidade**
- 🔄 **Reutilização de código**

---

## 🔄 O que é TDD?

**TDD (Test-Driven Development)** é uma metodologia onde você escreve os testes **ANTES** do código de produção.

### Ciclo do TDD: Red-Green-Refactor

```
🔴 RED    → Escreva um teste que falha
🟢 GREEN  → Escreva o mínimo de código para passar
🔵 REFACTOR → Melhore o código mantendo os testes passando
```

### Exemplo Prático no Nosso Projeto:

**1. 🔴 RED - Teste que falha:**
```typescript
// create-especie.use-case.test.ts
it('should create a new especie', async () => {
  // Arrange
  const input = { nomeCientifico: 'Ficus benjamina' };
  
  // Act
  const result = await createEspecieUseCase.execute(input);
  
  // Assert
  expect(result.id).toBeDefined();
  expect(result.nomeCientifico).toBe('Ficus benjamina');
});
```

**2. 🟢 GREEN - Código mínimo:**
```typescript
// create-especie.use-case.ts
export class CreateEspecieUseCase {
  async execute(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    return {
      id: 'generated-id',
      nomeCientifico: data.nomeCientifico,
      nomeComum: null,
      // ... outros campos
    };
  }
}
```

**3. 🔵 REFACTOR - Melhorar:**
```typescript
export class CreateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    // Validação de negócio
    const exists = await this.especieRepository.existsByNomeCientifico(data.nomeCientifico);
    if (exists) {
      throw new Error('Espécie já existe');
    }

    // Criação no banco
    return await this.especieRepository.create(data);
  }
}
```

---

## 🏗️ Use Cases na Prática

### O que são Use Cases?

Use Cases são **classes que encapsulam regras de negócio**. Eles representam uma ação específica que o usuário pode fazer no sistema.

### Estrutura Padrão:

```typescript
export class [Acao][Entidade]UseCase {
  constructor(private repository: [Entidade]Repository) {}

  async execute(input: [Acao][Entidade]RequestDTO): Promise<[Entidade]ResponseDTO> {
    // 1. Validações de negócio
    // 2. Operações no repositório
    // 3. Retorno do resultado
  }
}
```

### Exemplos do Nosso Projeto:

#### 1. CreateEspecieUseCase
```typescript
export class CreateEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    // Regra de negócio: não pode ter espécies duplicadas
    const exists = await this.especieRepository.existsByNomeCientifico(data.nomeCientifico);
    if (exists) {
      throw new ConflictError('Espécie com este nome científico já existe');
    }

    return await this.especieRepository.create(data);
  }
}
```

#### 2. DeleteEspecieUseCase
```typescript
export class DeleteEspecieUseCase {
  constructor(private especieRepository: EspecieRepository) {}

  async execute(id: string): Promise<void> {
    // Regra de negócio: só pode deletar se existir
    const especie = await this.especieRepository.findById(id);
    if (!especie) {
      throw new NotFoundError('Espécie não encontrada');
    }

    await this.especieRepository.delete(id);
  }
}
```

### Vantagens dos Use Cases:

✅ **Testabilidade**: Fácil de testar isoladamente  
✅ **Reutilização**: Pode ser usado por diferentes controllers  
✅ **Organização**: Regras de negócio centralizadas  
✅ **Manutenção**: Mudanças ficam isoladas  

---

## 🧪 Estrutura de Testes

### Padrão AAA (Arrange-Act-Assert)

```typescript
describe('CreateEspecieUseCase', () => {
  let useCase: CreateEspecieUseCase;
  let mockRepository: jest.Mocked<EspecieRepository>;

  beforeEach(() => {
    // Setup antes de cada teste
    mockRepository = {
      create: jest.fn(),
      existsByNomeCientifico: jest.fn(),
      // ... outros métodos
    } as jest.Mocked<EspecieRepository>;
    
    useCase = new CreateEspecieUseCase(mockRepository);
  });

  it('should create especie successfully', async () => {
    // 🎯 ARRANGE - Preparar dados e mocks
    const input = { nomeCientifico: 'Ficus benjamina' };
    const expectedOutput = {
      id: 'uuid-123',
      nomeCientifico: 'Ficus benjamina',
      nomeComum: null,
      // ... outros campos
    };

    mockRepository.existsByNomeCientifico.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue(expectedOutput);

    // ⚡ ACT - Executar a ação
    const result = await useCase.execute(input);

    // ✅ ASSERT - Verificar resultados
    expect(result).toEqual(expectedOutput);
    expect(mockRepository.existsByNomeCientifico).toHaveBeenCalledWith('Ficus benjamina');
    expect(mockRepository.create).toHaveBeenCalledWith(input);
  });

  it('should throw error when especie already exists', async () => {
    // 🎯 ARRANGE
    const input = { nomeCientifico: 'Ficus benjamina' };
    mockRepository.existsByNomeCientifico.mockResolvedValue(true);

    // ⚡ ACT & ✅ ASSERT
    await expect(useCase.execute(input)).rejects.toThrow('Espécie com este nome científico já existe');
  });
});
```

### Tipos de Testes:

1. **Cenário de Sucesso**: Quando tudo funciona como esperado
2. **Cenários de Erro**: Quando algo dá errado (validações, dados não encontrados)
3. **Edge Cases**: Casos extremos ou incomuns

---

## 🖥️ Como Rodar Testes Visualmente

### 1. Via Terminal (Básico)

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch (re-executa quando arquivos mudam)
npm run test:watch

# Rodar com coverage (mostra cobertura de código)
npm run test:coverage
```

### 2. Via VS Code (Visual)

#### Extensão Jest Runner:
1. Instale a extensão "Jest Runner"
2. Abra qualquer arquivo `.test.ts`
3. Clique em "Run" ou "Debug" acima de cada teste

#### Extensão Test Explorer:
1. Instale "Test Explorer UI"
2. Vá na aba de testes (ícone de tubo de ensaio)
3. Veja todos os testes em árvore
4. Clique para executar individualmente

### 3. Interface Web (Jest HTML Reporter)

Adicione ao `package.json`:
```json
{
  "scripts": {
    "test:html": "jest --coverage --coverageReporters=html"
  }
}
```

Execute:
```bash
npm run test:html
```

Abra: `coverage/lcov-report/index.html` no navegador

### 4. Modo Interativo

```bash
# Jest em modo interativo
npm test -- --watch

# Opções disponíveis:
# › Press f to run only failed tests.
# › Press o to only run tests related to changed files.
# › Press p to filter by a filename regex pattern.
# › Press t to filter by a test name regex pattern.
# › Press q to quit watch mode.
# › Press Enter to trigger a test run.
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Testando Validações

```typescript
describe('UpdateEspecieUseCase', () => {
  it('should update especie when valid data provided', async () => {
    // ARRANGE
    const especieId = 'uuid-123';
    const updateData = { nomeComum: 'Ficus Novo' };
    const existingEspecie = { id: especieId, nomeCientifico: 'Ficus benjamina' };
    const expectedResult = { ...existingEspecie, ...updateData };

    mockRepository.findById.mockResolvedValue(existingEspecie);
    mockRepository.update.mockResolvedValue(expectedResult);

    // ACT
    const result = await updateUseCase.execute(especieId, updateData);

    // ASSERT
    expect(result).toEqual(expectedResult);
    expect(mockRepository.findById).toHaveBeenCalledWith(especieId);
    expect(mockRepository.update).toHaveBeenCalledWith(especieId, updateData);
  });

  it('should throw NotFoundError when especie does not exist', async () => {
    // ARRANGE
    const especieId = 'uuid-inexistente';
    const updateData = { nomeComum: 'Novo Nome' };
    
    mockRepository.findById.mockResolvedValue(null);

    // ACT & ASSERT
    await expect(updateUseCase.execute(especieId, updateData))
      .rejects.toThrow(NotFoundError);
  });
});
```

### Exemplo 2: Testando Relacionamentos

```typescript
describe('GetEspecieByIdUseCase', () => {
  it('should return especie with relations', async () => {
    // ARRANGE
    const especieId = 'uuid-123';
    const especieWithRelations = {
      id: especieId,
      nomeCientifico: 'Ficus benjamina',
      guiasDeTecnicas: [
        {
          especieId: especieId,
          atividadeId: 'atividade-1',
          recomendacao: RecomendacaoTecnica.RECOMENDADA,
          atividade: { id: 'atividade-1', nome: 'Poda' }
        }
      ],
      guiasSazonais: []
    };

    mockRepository.findById.mockResolvedValue(especieWithRelations);

    // ACT
    const result = await getByIdUseCase.execute(especieId);

    // ASSERT
    expect(result).toEqual(especieWithRelations);
    expect(result.guiasDeTecnicas).toHaveLength(1);
    expect(result.guiasDeTecnicas[0].atividade.nome).toBe('Poda');
  });
});
```

---

## ✨ Boas Práticas

### 1. Nomenclatura Clara
```typescript
// ❌ Ruim
it('test 1', () => {});

// ✅ Bom
it('should create especie when valid data is provided', () => {});
it('should throw ConflictError when especie already exists', () => {});
```

### 2. Dados de Teste Realistas
```typescript
// ❌ Ruim
const input = { nomeCientifico: 'test' };

// ✅ Bom
const input = { nomeCientifico: 'Ficus benjamina' };
```

### 3. Um Conceito por Teste
```typescript
// ❌ Ruim - testa muitas coisas
it('should create and validate especie', () => {
  // testa criação E validação
});

// ✅ Bom - um conceito por teste
it('should create especie when data is valid', () => {});
it('should validate nomeCientifico format', () => {});
```

### 4. Setup e Teardown
```typescript
describe('EspecieUseCase', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  });

  afterEach(() => {
    // Limpeza após cada teste
    jest.clearAllMocks();
  });
});
```

### 5. Mocks Específicos
```typescript
// ✅ Mock específico para cada teste
it('should handle repository error', async () => {
  mockRepository.create.mockRejectedValue(new Error('Database error'));
  
  await expect(useCase.execute(input)).rejects.toThrow('Database error');
});
```

---

## 🎯 Comandos Úteis para Desenvolvimento

```bash
# Desenvolvimento com testes automáticos
npm run dev & npm run test:watch

# Rodar apenas testes de uma entidade
npm test -- especie

# Rodar apenas um arquivo específico
npm test -- create-especie.use-case.test.ts

# Rodar com verbose (mais detalhes)
npm test -- --verbose

# Gerar relatório de cobertura
npm run test:coverage
```

---

## 🚀 Próximos Passos

1. **Pratique TDD**: Comece com um novo use case usando TDD
2. **Explore Coverage**: Veja quais partes do código não estão testadas
3. **Teste Edge Cases**: Adicione testes para casos extremos
4. **Integration Tests**: Teste a integração entre camadas
5. **E2E Tests**: Teste o fluxo completo da aplicação

---

*Este guia serve como base para entender e aplicar TDD e Use Cases no desenvolvimento. Use-o como referência para criar código mais confiável e maintível!* 🎓