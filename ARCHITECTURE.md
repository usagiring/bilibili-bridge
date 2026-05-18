# bilibili-bridge 架构分析文档

> 生成日期：2026-05-18 | 版本：v0.2.21

---

## 1. 项目概述

**bilibili-bridge** 是一个 Bilibili 直播弹幕桥接服务，作为中间层后端服务，连接 Bilibili 直播平台与前端展示页面。它通过 WebSocket 连接 Bilibili 直播服务器，实时获取弹幕、礼物、互动等数据，并通过 HTTP API + WebSocket 转发给前端消费。

| 属性 | 说明 |
|------|------|
| 包名 | `@tokine/bilibili-bridge` |
| 版本 | v0.2.21 |
| 运行时 | Node.js + TypeScript → 编译为 CommonJS |
| HTTP 框架 | Koa |
| WebSocket | ws |
| 数据库 | NeDB（嵌入式文件数据库） |
| 包管理 | pnpm workspace（monorepo） |
| 协议解析 | Protobuf + Brotli |

---

## 2. 项目结构

```
bilibili-bridge/
├── app.ts                        # Koa 应用入口，路由注册、静态资源托管
├── index.ts                      # 外部导出入口，初始化配置并启动 app
├── package.json
├── tsconfig.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── README.md
├── bin/
│   └── json.json                 # 测试数据
├── lib/
│   ├── doc/
│   │   └── api.yaml              # OpenAPI 3.0 接口文档（WIP）
│   ├── model/                    # 数据模型层
│   │   ├── comment.ts            # 弹幕模型 + NeDB CRUD
│   │   ├── gift.ts               # 礼物模型 + NeDB CRUD
│   │   ├── interact.ts           # 互动（进入直播间等）+ NeDB CRUD
│   │   ├── lottery.ts            # 抽奖记录 + NeDB CRUD
│   │   ├── user.ts               # 用户模型 + NeDB CRUD
│   │   └── other.ts              # 其他消息模型
│   ├── route/                    # HTTP API 路由层
│   │   ├── index.ts              # 路由汇总注册 + AJV 校验中间件
│   │   ├── room.ts               # 直播间相关（连接/断开/录制/状态）
│   │   ├── comment.ts            # 弹幕查询/统计
│   │   ├── gift.ts               # 礼物查询/统计/配置
│   │   ├── interact.ts           # 互动查询/统计
│   │   ├── lottery.ts            # 抽奖历史 CRUD
│   │   ├── asr.ts                # 语音识别 + 机器翻译接口
│   │   ├── user.ts               # 用户查询/统计
│   │   ├── message.ts            # 消息发送
│   │   ├── statistic.ts          # 统计数据
│   │   ├── setting.ts            # 设置管理
│   │   ├── data.ts               # 综合数据接口
│   │   └── bilibili-proxy.ts     # B站 API 代理
│   └── service/                  # 核心服务层
│       ├── state.ts              # 全局配置管理（基于 lodash get/set）
│       ├── runtime.ts            # 运行时状态管理（连接池、ASR 实例等）
│       ├── event.ts              # 事件总线（EventEmitter 单例）
│       ├── const.ts              # 常量定义（事件名、命令、B站 CMD 映射）
│       ├── wss.ts                # WebSocket 服务（向前端推送）
│       ├── handler.ts            # 自动回复规则引擎
│       ├── nedb.ts               # NeDB 数据库初始化 + Promise 封装 + 索引
│       ├── util.ts               # 工具函数（日期、正则、颜色转换）
│       ├── auth.ts               # JWT 认证
│       ├── ajv.ts                # JSON Schema 校验封装
│       ├── statistic.ts          # 统计服务
│       ├── bilibili/             # B站核心逻辑
│       │   ├── index.ts          # 消息解析器（弹幕/礼物/互动/用户）
│       │   ├── sdk.ts            # B站 HTTP API 封装
│       │   ├── ws.ts             # B站 WebSocket 客户端（连接弹幕服务器）
│       │   ├── handler.ts        # B站消息事件处理（分发 + 持久化）
│       │   └── record.ts         # 直播录制服务
│       ├── gift/
│       │   └── index.ts          # 礼物配置获取服务
│       ├── protobuf/
│       │   ├── dm.proto          # B站弹幕 Protobuf 协议定义
│       │   └── index.ts          # Protobuf 解析逻辑
│       └── tts/
│           ├── index.ts          # 文字转语音
│           └── system.ts         # 系统 TTS
└── packages/                     # monorepo 子包
    ├── asr/                      # @tokine/asr — 阿里云语音识别
    │   ├── index.ts
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── ffmpeg.ts         # FFmpeg 音频处理
    │       └── alicloud/
    │           ├── client.ts     # 阿里云客户端
    │           ├── index.ts      # 实时 ASR 封装
    │           └── speech-recognition.ts  # 一句话识别封装
    └── mt/                       # @tokine/mt — 阿里云机器翻译
        ├── index.ts
        ├── package.json
        └── tsconfig.json
```

---

## 3. 核心架构

### 3.1 整体数据流

```
┌──────────────────┐                          ┌──────────────────────┐
│  Bilibili 直播    │   WebSocket (WSS)        │   bilibili-bridge    │
│  弹幕服务器        │ ◄──────────────────────► │   (本服务)            │
│  broadcastlv.     │   弹幕 / 礼物 / 互动      │                      │
│  chat.bilibili.com│   人气 / 抽奖 / 状态      │   ┌────────────────┐ │
└──────────────────┘                          │   │ EventEmitter   │ │
                                              │   │ 事件总线        │ │
                                              │   └───────┬────────┘ │
                                              │           │          │
                                              │   ┌───────▼────────┐ │
                                              │   │ Handler 分发    │ │
                                              │   │ 自动回复 / 存储  │ │
                                              │   └───────┬────────┘ │
                                              │           │          │
                                              └───────────┼──────────┘
                                                          │
                                          HTTP REST API   │  WebSocket
                                          (Koa Router)    │  (ws Server)
                                                          │
                                                          ▼
                                              ┌──────────────────────┐
                                              │  前端页面              │
                                              │  bilibili-danmaku-    │
                                              │  page                 │
                                              └──────────────────────┘
```

### 3.2 三层架构

| 层 | 职责 | 对应目录 |
|-----|------|----------|
| **路由层 (Route)** | HTTP API 定义、请求校验（AJV）、参数解析 | `lib/route/` |
| **服务层 (Service)** | 核心业务逻辑、B站连接、事件处理、自动回复 | `lib/service/` |
| **模型层 (Model)** | 数据模型定义、数据库 CRUD 封装 | `lib/model/` |

### 3.3 双 WebSocket 设计

| WebSocket | 方向 | 说明 |
|-----------|------|------|
| B站 WS 客户端 (`lib/service/bilibili/ws.ts`) | 消费 | 连接到 `wss://broadcastlv.chat.bilibili.com:443/sub`，接收 B站实时数据 |
| 对外 WS 服务 (`lib/service/wss.ts`) | 生产 | 将解析后的数据广播给所有连接的前端客户端 |

### 3.4 事件驱动架构

```
B站 WebSocket 消息
       │
       ▼
WSClient (ws.ts)
  - Brotli 解压
  - Protobuf 解析
       │
       ▼
EventEmitter (event.ts)
  ├── EVENTS.NINKI      → 人气值更新 → wss.broadcast
  ├── EVENTS.MESSAGE    → handler.ts 分发
  │   ├── DANMU_MSG     → parseComment  → commentJob → NeDB + autoReply + wss
  │   ├── INTERACT_WORD → parseInteract → interactJob → NeDB + autoReply + wss
  │   ├── SEND_GIFT     → parseGift     → giftJob     → NeDB + autoReply + wss
  │   ├── SUPER_CHAT    → parseGift     → giftJob     → NeDB + autoReply + wss
  │   ├── GUARD_BUY     → parseGift     → giftJob     → NeDB + autoReply + wss
  │   ├── LIVE          → wss.broadcast(LIVE)
  │   ├── PREPARING     → wss.broadcast(PREPARING)
  │   ├── ANCHOR_LOT_*  → Lottery 处理  → NeDB + wss
  │   ├── WATCHED_CHANGE→ wss.broadcast
  │   └── LIKE_CHANGE   → wss.broadcast
  └── EVENTS.AUTO_REPLY → handler.ts 自动回复引擎 → sendMessage to B站
```

---

## 4. 主要功能模块详解

### 4.1 弹幕接收与解析

- **连接协议**：通过 WebSocket 连接 B站弹幕服务器，使用 JSON 认证包（uid、roomid、buvid、key）
- **消息格式**：Brotli 压缩 + Protobuf 编码（`lib/service/protobuf/dm.proto`）
- **解析器**：`lib/service/bilibili/index.ts` 中的 `parseComment` / `parseGift` / `parseInteractWord`

### 4.2 自动回复引擎

`lib/service/handler.ts` 实现了基于规则的自动回复系统：

- **触发条件**：弹幕 / 礼物 / 互动 / SC
- **规则配置**：`autoReplyRules` 存储在全局 state 中
- **标签系统**：支持 LEVEL（等级）、ROLE（角色）、GIFT（礼物）、MEDAL（勋章）、FILTER 等标签组合
- **动作**：文本回复（TEXT_REPLY）或语音回复（SPEAK_REPLY）
- **频率控制**：通过 `sendUserCache` 限制同一用户发送频率

### 4.3 语音识别 (ASR)

子包 `@tokine/asr` 封装了阿里云语音识别服务：

- **实时语音识别**：通过 WebSocket 接收前端音频流 → FFmpeg 转码 → 阿里云 ASR
- **一句话识别**：`speech-recognition.ts` 封装阿里云一句话识别 API
- **WebSocket 通道**：前端通过 `EVENTS.AUDIO` 事件发送音频数据到 Bridge

### 4.4 机器翻译 (MT)

子包 `@tokine/mt` 封装了阿里云机器翻译 API：

- 使用 AK/SK 初始化阿里云 `alimt20181012` 客户端
- 支持通用文本翻译（`translateGeneral`）
- 通过 `/translate/*` API 端点对外提供服务

### 4.5 直播录制

- 通过 `lib/route/room.ts` 的 `/room/:roomId/record/start` 接口触发
- 调用 `@tokine/bilibili-recorder` 外部包进行录制
- 支持录制质量（qn）、平台、Cookie 等参数配置
- 通过 WebSocket 推送录制进度（`RECORD_RATE`、`RECORD_END`、`RECORD_ERROR`）

### 4.6 数据持久化

使用 **NeDB** 作为嵌入式数据库，所有数据存储在 `USER_DATA_PATH` 目录下：

| 数据库 | 文件 | 索引字段 | 说明 |
|--------|------|----------|------|
| userDB | `user` | uid (unique) | 用户信息 |
| commentDB | `comment` | uid, roomId, sendAt | 弹幕记录 |
| interactDB | `interact` | uid, roomId, sendAt | 互动记录 |
| giftDB | `gift` | uid, roomId, sendAt | 礼物记录 |
| lotteryDB | `lottery` | — | 抽奖记录 |
| otherDB | `other` | — | 其他消息 |

---

## 5. API 接口一览

### 5.1 直播间 (Room)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/room/:roomId/info` | 获取直播间信息 |
| POST | `/room/:roomId/connect` | 连接直播间弹幕 |
| POST | `/room/:roomId/disconnect` | 断开直播间连接 |
| GET | `/room/:roomId/real-time/viewer/count` | 实时观众数 |
| GET | `/room/:roomId/status` | 直播间连接状态 |
| POST | `/room/:roomId/record/start` | 开始录制 |
| POST | `/room/:roomId/record/cancel` | 取消录制 |

### 5.2 弹幕 (Comment)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/comment/query` | 弹幕历史查询 |
| POST | `/comment/count` | 弹幕数量统计 |

### 5.3 礼物 (Gift)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/room/:roomId/gift/map` | 获取礼物配置映射 |
| POST | `/gift/query` | 礼物历史查询 |
| POST | `/gift/count` | 礼物数量统计 |

### 5.4 语音识别 (ASR)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/asr/status` | ASR 状态查询 |
| POST | `/asr/initial` | 初始化 ASR 实例 |
| POST | `/asr/live/start` | 开始实时语音识别 |
| POST | `/asr/live/close` | 关闭实时语音识别 |
| POST | `/asr/close` | 关闭 ASR 实例 |

### 5.5 翻译 (Translate)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/translate/sentence` | 翻译句子 |
| POST | `/translate/open` | 开启翻译 |
| POST | `/translate/close` | 关闭翻译 |
| GET | `/translate/status` | 翻译状态 |

### 5.6 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/interact/query` | 互动历史查询 |
| POST | `/lottery/history/query` | 抽奖历史查询 |
| POST | `/message/send` | 发送消息到直播间 |
| POST | `/setting/*` | 设置管理 |
| POST | `/user/*` | 用户管理 |

---

## 6. 技术栈详情

### 6.1 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| koa | git:usagiring/koa#master | HTTP 框架 |
| @koa/router | ^13.1.0 | 路由 |
| @koa/cors | ^3.1.0 | 跨域 |
| ws | ^7.4.5 | WebSocket |
| protobufjs | ^7.2.4 | Protobuf 解析 |
| brotli | ^1.3.3 | Brotli 解压 |
| axios | ^1.7.2 | HTTP 请求 |
| nedb | ^1.8.0 | 嵌入式数据库 |
| ajv | ^8.3.0 | JSON Schema 校验 |
| jsonwebtoken | ^8.5.1 | JWT 认证 |
| lodash | ^4.17.21 | 工具库 |
| moment | ^2.29.1 | 日期处理 |
| @node-rs/jieba | ^1.4.1 | 中文分词 |
| @tokine/asr | workspace:* | 语音识别子包 |
| @tokine/mt | workspace:* | 机器翻译子包 |
| @tokine/bilibili-recorder | 0.1.0 | 直播录制 |

### 6.2 开发依赖

| 依赖 | 版本 |
|------|------|
| TypeScript | ^4.2.4 |
| ts-node | ^9.1.1 |
| nodemon | ^2.0.7 |
| ESLint | ^7.26.0 |
| Mocha | (test script) |

---

## 7. 启动与运行

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建
pnpm build

# 生产运行
pnpm start

# 测试运行
pnpm start:test
```

构建流程：
1. `build:asr` — 编译 `packages/asr`
2. `build:mt` — 编译 `packages/mt`
3. `build:self` — 编译主项目 + 复制 `.proto` 文件到 `dist/`

---

## 8. 配置项

通过 `index.ts` 的 `init(options)` 传入配置，存储于全局 `state` 对象：

| 配置项 | 说明 |
|--------|------|
| `PORT` | HTTP 服务端口（默认 3000） |
| `HTML_PATH` | 前端静态页面路径 |
| `USER_DATA_PATH` | NeDB 数据库存储路径（默认 `db`） |
| `userCookie` | B站用户 Cookie（用于认证） |
| `userInfoFrequencyLimit` | 用户信息获取频率限制 |
| `SAVE_ALL_BILI_MESSAGE` | 是否保存所有 B站消息 |
| `autoReplyRules` | 自动回复规则配置 |

---

## 9. 改进建议

1. **类型安全**：`state` 和 `runtime` 中大量使用 `any`，建议定义泛型接口
2. **错误处理**：WebSocket 重连机制可增强（指数退避）、异步操作增加 try-catch
3. **API 文档**：`doc/api.yaml` 未完成，建议补全或改用 Swagger 装饰器自动生成
4. **配置管理**：建议引入环境变量（dotenv）或配置文件支持，替代纯代码配置
5. **测试覆盖**：目前无测试文件，建议为核心模块补充单元测试
6. **日志系统**：引入结构化日志（如 pino、winston）替代 `console.log`
7. **依赖升级**：TypeScript 4.2 → 5.x、ESLint 7 → 9.x、使用 npm registry 代替 git 分支依赖
8. **进程管理**：建议使用 PM2 或 systemd 进行生产环境进程守护
