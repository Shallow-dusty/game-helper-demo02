/**
 * PWA 配置指南 - 血染钟楼魔典 v0.9.0
 */

# PWA (渐进式 Web 应用) 配置

## 概述

血染钟楼魔典现已支持 PWA 功能，允许用户：
- ✅ 安装到主屏幕 (安装提示)
- ✅ 离线使用 (基本功能)
- ✅ 后台运行
- ✅ 推送通知 (可选，待实现)

## 已实现的功能

### 1. Manifest.json
**位置**: `/public/manifest.json`

定义了 PWA 的基本信息：
- 应用名称、图标、主题色
- 快捷方式 (创建房间、加入房间)
- 分享功能目标 (Share Target API)
- Maskable 图标支持 (自适应显示)

### 2. Service Worker
**位置**: `/public/service-worker.js`

实现了离线缓存策略：

#### 缓存策略
- **静态资源** (JS/CSS/图像): 缓存优先
  - 优先使用缓存，后台更新
  - 加快加载速度，支持完全离线

- **API 请求**: 网络优先
  - 优先使用网络获取最新数据
  - 网络失败时使用缓存的响应

- **HTML/动态内容**: 网络优先
  - 确保获得最新内容
  - 离线时使用缓存版本

#### 生命周期
1. **安装 (Install)**: 缓存静态资源
2. **激活 (Activate)**: 清理旧缓存
3. **Fetch**: 拦截网络请求，应用缓存策略

### 3. Index.html 配置
**位置**: `/index.html`

添加了 PWA 必需的 meta 标签：
```html
<meta name="theme-color" content="#8b5cf6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/img/icon-192.png" />
```

### 4. Service Worker 注册
**位置**: `/src/index.tsx`

在应用启动时注册 Service Worker：
- 监听更新事件
- 输出日志便于调试
- 处理控制器变化

## 使用指南

### 用户安装应用

#### Android
1. 访问应用 URL
2. 点击地址栏的"安装"按钮
3. 确认安装
4. 应用出现在主屏幕

#### iOS (限制)
- 不支持自动安装提示
- 用户需手动操作：
  1. 打开 Safari
  2. 点击分享按钮
  3. 选择"添加到主屏幕"
  4. 确认

#### 桌面浏览器
- Chrome/Edge: 地址栏会显示安装提示
- Firefox: 需要用户手动操作

### 离线使用

当用户离线时：
1. **已访问的页面**: 使用缓存版本正常显示
2. **API 请求**:
   - 首次访问时自动缓存成功的响应
   - 离线时自动使用缓存响应
3. **新页面**: 显示"离线"提示

### 更新应用

Service Worker 检测到新版本时：
1. 下载新的 Service Worker
2. 安装但不激活 (等待用户刷新)
3. 用户刷新页面后应用新版本

可选实现：显示"有新版本"的通知栏让用户主动刷新

## 文件结构

```
/public/
├── manifest.json           # PWA 配置文件
├── service-worker.js       # 离线缓存逻辑
└── /img/
    ├── icon-192.png       # 192x192 图标
    ├── icon-512.png       # 512x512 图标
    ├── icon-maskable-192.png
    ├── icon-maskable-512.png
    ├── screenshot-narrow.png  # 安装提示截图
    └── screenshot-wide.png

/src/
└── index.tsx              # Service Worker 注册代码
```

## 性能指标

PWA 优化带来的改进：
- **首次访问**: 标准加载 (无缓存优势)
- **后续访问**: 缓存优先，加载时间减少 70-80%
- **离线**: 无网络时仍可使用已访问的功能

## 浏览器兼容性

| 浏览器 | Service Worker | 安装提示 | 离线支持 |
|--------|----------------|---------|---------|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ✅ | ❌ | ✅ |
| Safari | ✅ (iOS 11.3+) | ❌ | ✅ |
| Opera | ✅ | ✅ | ✅ |

## 待实现功能

- [~] **推送通知** - 前端能力已集成，后端推送链路待完善
- [~] **后台同步** - 本地离线队列已实现，服务端同步接口待生产化
- [ ] **周期同步** - 定期检查房间状态
- [ ] **安装提示优化** - 自定义安装 UI
- [x] **更新提示** - 新版本提示栏

## 测试方法

### 1. 检查 Service Worker 注册
在浏览器控制台：
```javascript
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
```

### 2. 检查缓存
Chrome DevTools -> Application -> Cache Storage
```
✓ grimoire-static-v1  (静态资源)
✓ grimoire-dynamic-v1 (动态内容)
```

### 3. 离线测试
1. Chrome DevTools -> Network -> Offline
2. 刷新页面
3. 验证页面是否正确加载

### 4. 灯塔审计 (Lighthouse)
Chrome DevTools -> Lighthouse
- 检查 PWA 得分 (目标 >= 90)
- 检查具体的不足项

## 生产部署

### 必需步骤
1. ✅ 添加 manifest.json
2. ✅ 创建 Service Worker
3. ✅ 配置 HTTPS (必需)
4. ✅ 添加 icon 图片文件
5. 测试所有浏览器

### 可选优化
- [x] 签名 icons 使用 maskable
- [x] 实现更新提示 UI
- [~] 配置推送通知（前端完成，后端待完善）
- [x] 添加截图图片

## 常见问题

### Q: 为什么离线时某些功能不工作？
A: Service Worker 缓存的是 HTTP 响应。如果功能依赖实时数据库连接（如 Supabase），离线时会失败。解决方案：
- 使用本地存储缓存关键数据
- 实现队列系统缓存离线操作
- 等到网络恢复后同步

### Q: 如何强制更新 Service Worker？
A: 用户：浏览器设置 -> 应用管理 -> 卸载
开发者：修改 CACHE_NAME 版本号强制缓存更新

### Q: iOS 支持 PWA 吗？
A: 有限支持。iOS 15+ 支持 Service Worker，但：
- 没有自动安装提示
- 必须从 Safari 手动安装到主屏幕
- 某些功能限制 (如推送通知)

## 参考资源

- [MDN - Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [Web.dev Progressive Web Apps](https://web.dev/progressive-web-apps/)
