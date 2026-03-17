# 部署文档

本文档说明如何在服务器上部署深宫职场生存录应用。

## 服务器环境要求

- Linux 服务器（CentOS/Rocky/Alibaba Cloud 等）
- Node.js 18+
- Nginx
- PM2（进程管理）

## 目录规划

```
/opt/gongting-server/    # 后端代码
/home/zss/              # 前端静态文件
```

## 部署步骤

### 1. 上传代码

#### 后端

```bash
# 本地打包
cd /path/to/gongting
tar -czvf gongting-server.tar.gz server/

# 上传到服务器
scp gongting-server.tar.gz root@YOUR_SERVER_IP:/opt/

# 服务器上解压
ssh root@YOUR_SERVER_IP
cd /opt
tar -xzvf gongting-server.tar.gz
mv server gongting-server
rm gongting-server.tar.gz
```

#### 前端

```bash
# 本地构建并打包
cd /path/to/gongting
npm run build
tar -czvf zss.tar.gz dist/

# 上传到服务器
scp zss.tar.gz root@YOUR_SERVER_IP:/home/

# 服务器上解压
ssh root@YOUR_SERVER_IP
cd /home
tar -xzvf zss.tar.gz
mv dist zss
rm zss.tar.gz
```

### 2. 安装后端依赖

```bash
cd /opt/gongting-server
npm install
```

### 3. 配置 Nginx

编辑 `/etc/nginx/conf.d/gongting.conf`（或添加新文件）：

```nginx
server {
  listen 80;
  server_name YOUR_SERVER_IP;

  # 前端静态文件
  location /intrigue/ {
    alias /home/zss/;
    try_files $uri $uri/ /intrigue/index.html;
  }

  # API 代理
  location /intrigue/api/ {
    proxy_pass http://127.0.0.1:3001/api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # 其他现有配置...
}
```

重载 Nginx：

```bash
nginx -t && nginx -s reload
```

### 4. 启动后端服务

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动后端
cd /opt/gongting-server
pm2 start index.js --name gongting-api

# 设置开机自启
pm2 startup
pm2 save
```

### 5. 初始化管理员

```bash
# 调用 API 设置管理员密钥（密钥至少16位）
curl -X POST http://YOUR_SERVER_IP/intrigue/api/admin/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"key": "your_admin_key_here"}'
```

## 服务管理

### 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs gongting-api

# 重启服务
pm2 restart gongting-api

# 停止服务
pm2 stop gongting-api
```

### 端口说明

| 端口 | 用途 |
|------|------|
| 80 | Nginx HTTP |
| 3001 | 后端 API |

## 访问地址

- 前端：`http://YOUR_SERVER_IP/intrigue/`
- API：`http://YOUR_SERVER_IP/intrigue/api/`

## 备份与恢复

### 备份数据库

```bash
cp /opt/gongting-server/gongting.db /backup/gongting-$(date +%Y%m%d).db
```

### 恢复数据库

```bash
# 停止服务
pm2 stop gongting-api

# 恢复数据库
cp /backup/gongting-20240101.db /opt/gongting-server/gongting.db

# 重启服务
pm2 restart gongting-api
```
