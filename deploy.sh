#!/bin/bash

# 项目名称
PROJECT_NAME="yunchou"

# 应用端口
PORT="8081"

# 生成时间戳作为镜像标签
TIMESTAMP=$(date +%s)
IMAGE_NAME="registry.cn-hangzhou.aliyuncs.com/argszero/${PROJECT_NAME}:${TIMESTAMP}"
echo ${IMAGE_NAME}

# 构建 Docker 镜像
echo "Building Docker image..."
docker build . --file Dockerfile --tag ${IMAGE_NAME}

# 登录到阿里云容器仓库
echo "Logging in to Aliyun Container Registry..."
# docker login --username argszero_ali registry.cn-hangzhou.aliyuncs.com

# 推送镜像到仓库
echo "Pushing Docker image..."
docker push ${IMAGE_NAME}

# 生成远程执行的命令
REMOTE_COMMANDS=$(cat << EOF
mkdir -p /root/app/${PROJECT_NAME}
cd /root/app/${PROJECT_NAME}
cat > docker-compose.yml << 'EOL'
version: '3'
services:
  app:
    image: ${IMAGE_NAME}
    deploy:
      resources:
        limits:
          memory: 256M
    ports:
      - "${PORT}:3000"
    restart: always
    networks:
      - args

networks:
  args:
    external: true
EOL
docker compose pull
docker compose up -d
EOF
)

# SSH 连接到服务器并执行命令
echo "Deploying to server..."
ssh root@39.105.53.16 "${REMOTE_COMMANDS}"

echo "Deployment completed!" 