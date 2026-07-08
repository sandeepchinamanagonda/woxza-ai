FROM node:22-alpine

WORKDIR /app
COPY backend/package.json ./package.json
RUN npm install --omit=dev
COPY backend/src ./src
COPY backend/migrations ./migrations
COPY backend/demo_prompts ./demo_prompts

ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "src/server.js"]
