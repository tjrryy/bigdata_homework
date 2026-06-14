# 多跳问答知识库可视化

基于 HotpotQA 数据集的多跳推理问答可视化系统。

## 在线访问

**GitHub Pages**: https://tjrryy.github.io/bigdata_homework

## 功能特性

- **搜索查询** - 关键词搜索问答数据
- **聚类分析** - 按类型/问题开头词/答案类型聚类
- **数据统计** - 可视化展示各类别分布

## 支持的数据集

- 训练集 (Train): 2000条样本
- 验证集 (Dev): 500条样本
- 测试集 (Test): 500条样本

## 本地运行

### 静态模式（无需后端）

```bash
cd web
python -m http.server 8080
# 访问 http://localhost:8080
```

### API模式（需要Redis）

详见 [server/README.md](server/README.md)

```bash
# 1. 安装依赖
cd server
pip install -r requirements.txt

# 2. 启动Redis
brew services start redis

# 3. 导入数据
python import_to_redis.py --data-dir data

# 4. 启动API服务器
python api_server.py --port 5000

# 5. 修改前端配置
# 编辑 js/app.js，设置 API_MODE = true

# 6. 启动前端
python -m http.server 8080
```

## 项目结构

```
.
├── index.html          # 主页面
├── js/app.js          # 应用逻辑
├── css/style.css      # 样式
├── data/              # 样本数据
│   ├── train_samples.json
│   ├── dev_samples.json
│   └── test_samples.json
└── server/            # 后端服务（可选）
    ├── api_server.py
    ├── import_to_redis.py
    └── requirements.txt
```

## 数据来源

[HotpotQA](https://hotpotqa.github.io/) - 多跳推理问答数据集