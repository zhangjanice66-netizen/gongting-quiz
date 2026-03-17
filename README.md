# 深宫职场生存录

一个互动心理测试应用，用户输入验证码后完成职场性格测试。

## 功能特性

- 验证码验证系统
- 12道职场心理测试题
- 6种测试结果类型
- 管理员后台（生成验证码、查看统计数据）
- 验证码生命周期追踪（创建 → 输入 → 提交）

## 快速开始

### 开发环境

```bash
# 安装前端依赖
npm install

# 启动前端开发服务器 (端口 5173)
npm run dev

# 启动后端 (端口 3001)
cd server
npm install
npm start
```

### 生产环境构建

```bash
# 构建前端
npm run build

# 前端输出目录: dist/
```

## 项目结构

```
gongting/
├── src/                 # 前端源码
│   ├── components/      # React 组件
│   ├── data/            # 测试题目数据
│   ├── utils/           # 工具函数
│   └── App.tsx          # 主应用
├── server/              # 后端服务
│   ├── index.js         # Express 服务入口
│   ├── db.js            # 数据库初始化
│   └── gongting.db      # SQLite 数据库文件
├── dist/                # 前端构建产物
└── public/              # 静态资源
```

## 测试结果类型

| 类型 | 说明 |
|------|------|
| 权倾朝野型 | 管理能力突出 |
| 内卷达人型 | 勤奋努力型 |
| 实力超群型 | 专业能力强 |
| 社交高手型 | 人际交往能力强 |
| 降维打击型 | 综合能力强 |
| 平庸度日型 | 普通人 |

## 技术栈

- **前端**: React + TypeScript + Vite + Framer Motion
- **后端**: Node.js + Express + sql.js
- **数据库**: SQLite (sql.js)

## 相关文档

- [部署文档](./DEPLOY.md)
- [API 接口文档](./API.md)
- [数据库设计](./DATABASE.md)
- [功能说明](./FEATURES.md)

## 许可证

MIT
