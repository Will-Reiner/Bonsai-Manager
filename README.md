# Bonsai Manager

Uma aplicação full-stack desenhada para ajudar entusiastas de bonsai a gerir a sua coleção, agendar cuidados e acompanhar o desenvolvimento de cada planta. O projeto consiste num backend robusto em Node.js com uma base de dados PostgreSQL, tudo a correr em Docker, e uma aplicação mobile em React Native construída com Expo.

## ✨ Funcionalidades

* **Backend (API RESTful):**
    * Autenticação de utilizadores com JWT (registo e login por email/senha).
    * CRUD completo para gestão de **Espécies** de plantas (ex: *Pitanga*, *Caliandra*).
    * CRUD completo e seguro para a Coleção de **Plantas** de cada utilizador.
    * CRUD para um catálogo de **Atividades** de cuidado (ex: *Transplante*, *Poda de Raízes*, *Aramagem*).
    * CRUD para a **Agenda** de cuidados, permitindo agendar atividades para plantas específicas.
    * Sistema de Histórico, Recursos, Fotos e mais, conforme o plano inicial.
* **Frontend (React Native):**
    * Aplicação mobile multiplataforma construída com Expo e TypeScript.
    * Fluxo de autenticação com ecrã de login, logout e gestão de estado global.
    * Visualização da coleção de plantas pessoal, com dados obtidos da API.
    * Navegação entre ecrãs (Lista da Coleção, Detalhes da Planta, Adicionar Planta).
    * Formulário para adicionar novas plantas à coleção, com seleção de espécies.

## 💻 Tecnologias Utilizadas

| Backend                 | Frontend                  |
| ----------------------- | ------------------------- |
| Node.js                 | React Native              |
| TypeScript              | Expo SDK                  |
| Express.js              | TypeScript                |
| Prisma (ORM)            | React Navigation          |
| PostgreSQL              | Axios                     |
| Docker & Docker Compose | React Context API         |

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
npx expo start

```

Isto irá iniciar o Metro Bundler e abrir uma página no seu navegador com um QR Code. Use a aplicação **Expo Go** no seu telemóvel para ler o QR Code e carregar a aplicação. Certifique-se de que o seu telemóvel e o computador estão na mesma rede Wi-Fi.

## **📝 Endpoints Principais da API (Referência Rápida)**

* POST /api/auth/register: Registar um novo utilizador.  
* POST /api/auth/login: Fazer login.  
* GET /api/auth/me: Obter dados do utilizador logado (requer token).  
* GET /api/especies: Listar todas as espécies.  
* POST /api/especies: Criar uma nova espécie (requer token).  
* GET /api/plantas: Listar todas as plantas do utilizador logado (requer token).  
* POST /api/plantas: Adicionar uma nova planta à coleção (requer token).  
* GET /api/atividades: Listar todas as atividades.  
* GET /api/agenda: Listar a agenda do utilizador logado (requer token).