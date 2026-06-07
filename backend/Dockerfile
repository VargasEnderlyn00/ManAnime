FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm ci --only=production --prefix backend

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "backend/server.js"]
