#!/bin/sh

# Espera um pouco para garantir que o banco de dados esteja pronto
echo "Waiting for postgres..."
sleep 5

# Gera o Prisma Client (corrige o primeiro erro)
echo "Generating Prisma Client..."
npx prisma generate

# Aplica as migrações do banco de dados (corrige o segundo erro)
echo "Applying database migrations..."
npx prisma migrate dev --name init

echo "Migrations applied. Starting server..."
# Finalmente, executa o comando principal do Dockerfile (npm run dev)
exec "$@"
