self.addEventListener('install', () => {
    console.log('[SW] Install');
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    console.log('[SW] Activate');
    e.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
    console.log('[SW] 收到消息:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        console.log('[SW] 收到 SKIP_WAITING，立即激活');
        self.skipWaiting();
    }

    if (event.data.type === 'DOWNLOAD_DICT') {
        console.log('[SW] 收到 DOWNLOAD_DICT 请求');
        downloadDictRaw(event.data.url, event.source);
    }
});

async function downloadDictRaw(url, client) {
    try {
        console.log('[SW] 开始下载:', url);
        const cacheBustUrl = url + '?t=' + Date.now();
        const response = await fetch(cacheBustUrl, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        console.log('[SW] Content-Length:', total);

        let received = 0;
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;

            // 每 50KB 或完成时发送进度
            if (received % 51200 < value.length || done) {
                client.postMessage({ type: 'PROGRESS', received, total });
            }
        }

        console.log('[SW] 下载完成，总大小:', received);

        // 合并并解码为原始文本
        const allChunks = new Uint8Array(received);
        let pos = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, pos);
            pos += chunk.length;
        }
        const text = new TextDecoder('utf-8').decode(allChunks);

        console.log('[SW] 发送 COMPLETE_TEXT，文本长度:', text.length);
        client.postMessage({ type: 'COMPLETE_TEXT', text });

    } catch (error) {
        console.error('[SW] 下载异常:', error);
        try {
            client.postMessage({ type: 'ERROR', error: error.message || String(error) });
        } catch (e) {
            console.error('[SW] 无法发送错误消息:', e);
        }
    }
}