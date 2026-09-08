# Build (`npm run build`) wykonywany lokalnie przed budową obrazu.
# Obraz tylko instaluje zależności produkcyjne i kopiuje gotowy katalog dist/.
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
