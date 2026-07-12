FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_DEMO_ADMIN_MODE=false
ENV VITE_DEMO_ADMIN_MODE=$VITE_DEMO_ADMIN_MODE
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
