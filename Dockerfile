FROM node:18-alpine

WORKDIR /app

# Copie package.json UNIQUEMENT
COPY package*.json ./

# npm install (génère lockfile)
RUN npm install

# Copie tout le code
COPY . .

# Lance bot
CMD ["node", "index.js"]
EXPOSE 3000
