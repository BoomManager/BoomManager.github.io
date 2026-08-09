/**
 * Service Worker - 廖志伟个人主页
 * 策略：网络优先（保证内容新鲜），离线时回退缓存与离线页
 */

const CACHE_VERSION = 'lzw-v3-20260809-progressive';
const CORE_CACHE = CACHE_VERSION + '-core';
const OFFLINE_URL = 'offline.html';

// 核心资源（首页 + 公共资源 + 离线页）
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/skills.html',
    '/business.html',
    '/works.html',
    '/about.html',
    '/offline.html',
    '/assets/css/common.css',
    '/assets/css/typo.css',
    '/assets/css/font-awesome.min.css',
    '/assets/js/common.js',
    '/assets/images/profile.jpg',
    '/assets/images/avatar.jpg',
    '/assets/images/favicon.ico',
    '/manifest.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CORE_CACHE).then(function(cache) {
            // 逐个缓存，避免单个失败导致整体 reject
            return Promise.all(
                CORE_ASSETS.map(function(url) {
                    return cache.add(url).catch(function() { /* 忽略单个失败 */ });
                })
            );
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// 激活：清理旧版本缓存
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    return key.startsWith('lzw-v') && key !== CORE_CACHE;
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// 接收主线程消息：立即激活新 SW
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 请求拦截：网络优先，失败回退缓存，再失败回退离线页
self.addEventListener('fetch', function(event) {
    const request = event.request;

    // 仅处理 GET 请求
    if (request.method !== 'GET') return;

    // 跨域请求直接放行（不缓存）
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // HTML 文档请求：网络优先 + 离线回退
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request).then(function(response) {
                // 成功则缓存一份
                const copy = response.clone();
                caches.open(CORE_CACHE).then(function(cache) {
                    cache.put(request, copy).catch(function() {});
                });
                return response;
            }).catch(function() {
                // 网络失败：尝试缓存
                return caches.match(request).then(function(cached) {
                    if (cached) return cached;
                    // 缓存也没有：返回离线页
                    return caches.match(OFFLINE_URL);
                });
            })
        );
        return;
    }

    // 静态资源（CSS/JS/图片）：缓存优先，回退网络
    if (request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font') {
        event.respondWith(
            caches.match(request).then(function(cached) {
                if (cached) return cached;
                return fetch(request).then(function(response) {
                    // 缓存成功的响应
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CORE_CACHE).then(function(cache) {
                            cache.put(request, copy).catch(function() {});
                        });
                    }
                    return response;
                }).catch(function() {
                    // 网络与缓存都失败：返回空响应避免报错
                    return new Response('', { status: 504, statusText: 'Offline' });
                });
            })
        );
    }
});
