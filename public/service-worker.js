/**
 * Service Worker - 血染钟楼魔典
 *
 * 功能：
 * 1. 离线缓存 - 缓存静态资源和关键页面
 * 2. 网络优先策略 - 优先使用网络，网络失败则使用缓存
 * 3. 后台同步 - 离线时的行动队列
 */

const CACHE_NAME = 'grimoire-v1';
const STATIC_CACHE_NAME = 'grimoire-static-v1';
const DYNAMIC_CACHE_NAME = 'grimoire-dynamic-v1';

// 静态资源缓存列表
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// 需要离线支持的 API 前缀
const API_PREFIXES = [
    '/api/',
];

// ============================================================
// Service Worker 安装
// ============================================================

self.addEventListener('install', (event: ExtendableEvent) => {
    console.log('Service Worker: 安装中...');

    event.waitUntil((async () => {
        try {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);
            console.log('Service Worker: 静态资源缓存成功');

            // 立即激活此 Service Worker
            await self.skipWaiting();
        } catch (error) {
            console.error('Service Worker: 安装失败', error);
        }
    })());
});

// ============================================================
// Service Worker 激活
// ============================================================

self.addEventListener('activate', (event: ExtendableEvent) => {
    console.log('Service Worker: 激活中...');

    event.waitUntil((async () => {
        try {
            const cacheNames = await caches.keys();

            // 删除旧的缓存
            const deletePromises = cacheNames
                .filter(name => name.startsWith('grimoire-') && name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
                .map(name => caches.delete(name));

            await Promise.all(deletePromises);
            console.log('Service Worker: 旧缓存已清理');

            // 立即获得所有控制权
            await self.clients.claim();
        } catch (error) {
            console.error('Service Worker: 激活失败', error);
        }
    })());
});

// ============================================================
// Fetch 事件处理
// ============================================================

self.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;
    const url = new URL(request.url);

    // 忽略非 GET 请求
    if (request.method !== 'GET') {
        return;
    }

    // 忽略跨域请求（除了特定的 API）
    if (url.origin !== self.location.origin && !isApiEndpoint(url)) {
        return;
    }

    // 区分策略处理不同类型的请求
    if (isStaticAsset(url)) {
        // 静态资源：缓存优先
        event.respondWith(cacheFirst(request));
    } else if (isApiEndpoint(url)) {
        // API 请求：网络优先（带降级缓存）
        event.respondWith(networkFirst(request));
    } else {
        // HTML/动态内容：网络优先
        event.respondWith(networkFirst(request));
    }
});

// ============================================================
// 缓存策略
// ============================================================

/**
 * 缓存优先策略 - 优先使用缓存，缓存不存在才请求网络
 */
async function cacheFirst(request: Request): Promise<Response> {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('Service Worker: 缓存优先策略失败', error);
        // 返回离线页面
        return createOfflineResponse();
    }
}

/**
 * 网络优先策略 - 优先使用网络，网络失败才使用缓存
 */
async function networkFirst(request: Request): Promise<Response> {
    try {
        const response = await fetch(request);

        // 仅缓存成功的响应
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // 网络失败，尝试使用缓存
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        console.error('Service Worker: 网络优先策略失败', error);

        // 返回离线响应
        if (request.destination === 'document') {
            return createOfflineResponse();
        } else {
            return new Response('Offline - No cached data', { status: 503 });
        }
    }
}

// ============================================================
// 辅助函数
// ============================================================

function isStaticAsset(url: URL): boolean {
    return [
        '.js',
        '.css',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.webp',
        '.woff',
        '.woff2',
        '.ttf',
        '.otf',
        '.eot'
    ].some(ext => url.pathname.endsWith(ext));
}

function isApiEndpoint(url: URL): boolean {
    return API_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
}

function createOfflineResponse(): Response {
    return new Response('Offline - No network connection', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/plain; charset=UTF-8'
        })
    });
}

// ============================================================
// 消息处理（可选 - 用于客户端与 Service Worker 通信）
// ============================================================

self.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// 周期同步（PWA）
// ============================================================

self.addEventListener('periodicsync', (event: any) => {
    if (event.tag !== 'room-state-sync') {
        return;
    }

    event.waitUntil((async () => {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((client: any) => {
            client.postMessage({ type: 'PERIODIC_ROOM_SYNC' });
        });
    })());
});
