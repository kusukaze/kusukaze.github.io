self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('message', async (event) => {
    if (event.data.type === 'DOWNLOAD_DICT') {
        await downloadDictRaw(event.data.url, event.source);
    }
});

async function downloadDictRaw(url, client) {
    try {
        const cacheBustUrl = url + '?t=' + Date.now();
        const response = await fetch(cacheBustUrl, { cache: 'no-store' });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let received = 0;
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            client.postMessage({ type: 'PROGRESS', received, total });
        }

        // 合并并解码为原始文本（不做任何解析）
        const allChunks = new Uint8Array(received);
        let pos = 0;
        for (const chunk of chunks) { allChunks.set(chunk, pos); pos += chunk.length; }
        const text = new TextDecoder('utf-8').decode(allChunks);

        // 将原始文本发回主页面，由主页面执行脚本
        client.postMessage({ type: 'COMPLETE_TEXT', text });

    } catch (error) {
        client.postMessage({ type: 'ERROR', error: error.message });
    }
}