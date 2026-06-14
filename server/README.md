# 本地运行指南 (Redis + Flask API)

## 快速开始

### 1. 安装依赖

```bash
cd server
pip install -r requirements.txt
```

### 2. 启动 Redis

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### 3. 导入数据到 Redis

```bash
python import_to_redis.py --data-dir ../data
```

### 4. 启动 API 服务器

```bash
python api_server.py --port 5000
```

### 5. 启用前端 API 模式

编辑 `js/app.js`，将 `API_MODE` 改为 `true`:

```javascript
const CONFIG = {
    API_MODE: true,  // 改为 true
    API_BASE: 'http://localhost:5000'
};
```

### 6. 启动前端服务器

```bash
python -m http.server 8080
```

访问 http://localhost:8080

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/datasets` | GET | 获取所有可用数据集 |
| `/api/<dataset>` | GET | 获取指定数据集 |
| `/api/<dataset>/search` | GET | 搜索数据集 (?q=关键词) |
| `/api/<dataset>/stats` | GET | 获取统计信息 |
| `/api/<dataset>/cluster` | GET | 获取聚类数据 (?type=type) |
| `/health` | GET | 健康检查 |

## 静态文件模式

如果不需要 Redis，也可以直接使用静态文件模式：

1. 启动 HTTP 服务器: `python -m http.server 8080`
2. 访问 http://localhost:8080

（无需修改配置，`API_MODE` 默认为 `false`）