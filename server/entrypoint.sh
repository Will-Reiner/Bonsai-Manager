#!/bin/sh

# Espera um pouco para garantir que o banco de dados esteja pronto
echo "Waiting for postgres..."
sleep 5

# Instala dependências (necessário porque /app/node_modules é um volume vazio no runtime)
echo "Installing node dependencies..."
npm install

# Gera o Prisma Client (corrige o primeiro erro)
echo "Generating Prisma Client..."
npx prisma generate

# Aplica as migrações já versionadas (comando de PRODUÇÃO — não cria migrações novas)
echo "Applying database migrations (deploy)..."
npx prisma migrate deploy

echo "Migrations applied. Starting server..."
# Finalmente, executa o comando principal do Dockerfile (npm run dev)
exec "$@"
