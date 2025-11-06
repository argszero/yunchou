FROM node:lts-slim as builder-frontend
ADD ./frontend/package.json /frontend/package.json
WORKDIR /frontend
# RUN npm install --registry https://mirrors.cloud.tencent.com/npm/
RUN npm install
ADD ./frontend /frontend
RUN npm run build

FROM --platform=linux/amd64 node:lts-alpine
ENV LANG C.UTF-8
ENV TIME_ZONE=Asia/Shanghai

RUN set -ex \
        && apk -U upgrade \
        && ln -snf /usr/share/zoneinfo/$TIME_ZONE /etc/localtime && echo $TIME_ZONE > /etc/timezone \
        && rm -rf /tmp/* /var/cache/apk/*

WORKDIR /app

# 复制前端构建文件
COPY --from=builder-frontend /frontend/dist ./frontend/dist

# 复制后端文件
COPY ./backend/package.json ./backend/
COPY ./backend/server.js ./backend/
COPY ./backend/config/ ./backend/config/
COPY ./backend/utils/ ./backend/utils/
COPY ./backend/models/ ./backend/models/
COPY ./backend/routes/ ./backend/routes/
COPY ./backend/database/ ./backend/database/

# 安装后端依赖
WORKDIR /app/backend
RUN npm install --production

# 暴露端口
EXPOSE 8080

# 启动后端服务器
CMD ["node", "server.js"]