FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_LOCAL_ADMIN_MODE=false
ARG VITE_LOCAL_ADMIN_TOKEN
ENV VITE_LOCAL_ADMIN_MODE=$VITE_LOCAL_ADMIN_MODE
ENV VITE_LOCAL_ADMIN_TOKEN=$VITE_LOCAL_ADMIN_TOKEN
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
