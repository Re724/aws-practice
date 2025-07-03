# Node.jsベースでビルド
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Nginxで配信
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# Nginxのポート
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
