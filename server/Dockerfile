# Use an official Node.js runtime as a parent image
FROM node:18-slim

# INSTALAMOS A DEPENDÊNCIA DO OPENSSL QUE O PRISMA EXIGE
RUN apt-get update -y && apt-get install -y openssl

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# ================================================================
# ALTERAÇÃO 1: Copiar o novo script para dentro do container
# ================================================================
COPY entrypoint.sh /app/entrypoint.sh

# ================================================================
# ALTERAÇÃO 2: Tornar o script executável
# ================================================================
RUN chmod +x /app/entrypoint.sh

# ================================================================
# ALTERAÇÃO 3: Definir o script como o ponto de entrada do container
# O comando antigo (CMD) será executado pelo nosso script no final.
# ================================================================
ENTRYPOINT ["/app/entrypoint.sh"]

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the app in development mode
CMD ["npm", "run", "dev"]
