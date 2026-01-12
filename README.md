# LiveBridge Server

LiveBridge Server 是一个转发服务，可以以sse的形式轻量的转发数据。当然不是弹幕数据也行。
同时有proxy功能，以便图片的获取（不然阿b因为跨域安全问题给你拦截了）
b站弹幕数据获取：[injector](https://github.com/sylw114/live-bridge-injector) 以及展示前端：[web](https://github.com/sylw114/live-bridge-web)

## 功能特性

- **SSE 实时推送**：通过 Server-Sent Events 技术实现实时弹幕数据推送
- **HTTP 代理**：提供代理 API 端点，绕过目标网站的 Origin 限制
- **弹幕数据接收**：接收来自不同平台的弹幕数据并转发给所有连接的客户端
- **静态文件服务**：提供 Web 前端资源访问

## 安装与启动

0. 安装[nodejs](nodejs.org)和typescript
```bash
npm i typescript -g
```
1. 安装项目依赖
```bash
npm i
```
2. 修改配置（可选: `src/config.ts`）并编译
```bash
tsc
```
3. 启动服务
```bash
node .
```

# 提醒
不要挂公网，没做任何防护措施，内网还不够两台电脑之间分享这点数据的话那还是很离谱了
