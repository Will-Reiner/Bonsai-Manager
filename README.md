# Bonsai Manager

Uma aplicação full-stack desenhada para ajudar entusiastas de bonsai a gerir a sua coleção, agendar cuidados e acompanhar o desenvolvimento de cada planta. O projeto consiste num backend robusto em Node.js com uma base de dados PostgreSQL, tudo a correr em Docker, e uma aplicação mobile em React Native construída com Expo.

## ✨ Funcionalidades

* **Backend (API RESTful):**
    * Autenticação Segura: Registo e login de utilizadores com JWT e sistema de papéis (USER / ADMIN).
    * Gestão de Coleção Pessoal: CRUD completo e seguro para as Plantas de cada utilizador.
    * Catálogo Global: CRUD completo para a gestão de Espécies, Atividades e Tipos de Recurso (protegido por administradores).
    * Tracking Detalhado: CRUD para a Agenda de cuidados, Histórico de atividades, Fotos e Recursos (inventário) de cada utilizador.
    * Relações Complexas: Suporte para relações muitos-para-muitos, como múltiplos recursos necessários para uma atividade.
* **Frontend (React Native):**
    * Aplicação Multiplataforma: Construída com Expo e TypeScript para Android e iOS.
    * Fluxo de Autenticação: Ecrãs de login/registo, gestão de estado global com React Context e persistência de sessão.
    * Visualização e Gestão: Telas para listar a coleção, ver detalhes da planta (com histórico), adicionar, editar e apagar plantas.
    * Painel Administrativo: Uma área exclusiva para utilizadores ADMIN gerirem os dados globais da aplicação (Espécies, Atividades, etc.).

## 💻 Tecnologias Utilizadas

| Backend                 | Frontend                  | Banco de Dados           |
| ----------------------- | ------------------------- | ------------------------ |
| Node.js                 | React Native              | PostgreSQL               |
| TypeScript              | Expo SDK                  | Prisma (ORM)             |
| Express.js              | TypeScript                | Docker & Docker Compose  |
| Zod (Validação)         | React Navigation          | JWT (Autenticação)       |
| Helmet (Segurança)      | Axios                     |                          |
| BcryptJS                | React Context API         |                          |

## 🚦 Pré-requisitos

Para executar este projeto localmente, vai precisar de ter instalado:

* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* Um editor de código, como o [VS Code](https://code.visualstudio.com/)
* A aplicação [Expo Go](https://expo.dev/go) no seu telemóvel (Android/iOS) para testes.

## 🚀 Como Executar o Projeto

Siga estes passos para configurar e executar o ambiente de desenvolvimento completo.

### 1. Backend (API + Base de Dados)

O backend é totalmente gerido e orquestrado pelo Docker.

**a. Inicie o Docker Desktop:**
Certifique-se de que o Docker Desktop está a ser executado na sua máquina.

**b. Inicie os Serviços:**
Abra um terminal na **pasta raiz do projeto** (`Bonsai_Manager`) e execute o seguinte comando:

```bash
docker compose up --build

```

Este comando irá:

1. Construir a imagem da sua API.  
2. Iniciar os containers da API e da base de dados PostgreSQL.  
3. Executar automaticamente o script entrypoint.sh, que gera o Prisma Client e aplica as migrações da base de dados.

A sua API estará pronta e a funcionar em http://localhost:3000. Pode deixar este terminal a correr para ver os logs em tempo real.

### 2. Frontend (Aplicação Móvel)

**a. Abra um novo terminal.**

**b. Instale as Dependências:**
Navegue para a pasta da aplicação mobile e instale todos os pacotes necessários:

```bash
cd mobile-app
npm install

```

**c. Configure o IP da API (Passo Crucial):**
Para que a aplicação no seu telemóvel consiga comunicar com o backend que está a correr no seu computador, precisa de usar o endereço IP da sua máquina na sua rede local.

1. Abra o ficheiro mobile-app/src/api/index.ts.  
2. Altere a constante API\_URL para o seu endereço IP. Exemplo:  
   const API\_URL \= '\[http://192.168.0.73:3000/api\](http://192.168.0.73:3000/api)';

**d. Inicie o Servidor de Desenvolvimento:**  
Ainda na pasta mobile-app, execute:  

```bash
npx expo run:android  

```

Isto irá iniciar o Metro Bundler e abrir uma página no seu navegador com um QR Code. Use a aplicação **Expo Go** no seu telemóvel para ler o QR Code e carregar a aplicação. Certifique-se de que o seu telemóvel e o computador estão na mesma rede Wi-Fi.

### 3. (Opcional) Tornar-se Administrador

Para aceder ao Painel Administrativo, precisa de promover o seu utilizador a ADMIN.

1. Registe um utilizador normalmente através da aplicação.
2. Abra um novo terminal na pasta server.
3. Execute o Prisma Studio com o seguinte comando:

```bash
docker compose exec api npx prisma studio
```

4. No seu navegador, vá ao modelo **Usuario**, encontre o seu utilizador e altere o campo **role** de **USER** para **ADMIN**.

## **📝 Endpoints Principais da API (Referência Rápida)**


* POST /api/auth/register: Registar um novo utilizador.
* POST /api/auth/login: Fazer login e obter um token JWT
* GET /api/auth/me: Obter dados do utilizador logado (requer token).
* GET /api/plantas: Listar todas as plantas do utilizador logado (requer token).
* POST /api/plantas: Adicionar uma nova planta (requer token).
* GET /api/especies: Listar todas as espécies (público).
* POST /api/especies: Criar uma nova espécie (requer token de Admin).
* GET /api/atividades: Listar todas as atividades (público).
* POST /api/atividades: Criar uma nova atividade (requer token de Admin).
* ... e muitos mais para agendas, historicos, fotos e recursos.