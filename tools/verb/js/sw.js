// Service Worker for dictionary download with progress tracking

self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    self.skipWaiting(); // 立即激活
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker 已激活');
    event.waitUntil(clients.claim()); // 立即控制所有页面
});

// 监听来自主页面的消息
self.addEventListener('message', async (event) => {
    if (event.data.type === 'DOWNLOAD_DICT') {
        await downloadDictionary(event.data.url, event.source);
    }
});

// 下载字典文件并报告进度
async function downloadDictionary(url, client) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

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

            // 发送进度更新
            client.postMessage({
                type: 'PROGRESS',
                received: received,
                total: total
            });
        }

        // 合并所有块
        const allChunks = new Uint8Array(received);
        let position = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }

        // 解码为文本
        const text = new TextDecoder('utf-8').decode(allChunks);

        // 解码为文本
        const text = new TextDecoder('utf-8').decode(allChunks);

        // 解析字典数据
        let dictData;
        try {
            // 先尝试作为纯 JSON 解析
            dictData = JSON.parse(text);
        } catch (e) {
            // JSON 解析失败，尝试从 JS 文件中提取数组
            // 匹配 var dict = [...]; 或 const dict = [...]; 等写法
            const match = text.match(/(?:var|let|const)\s+dict\s*=\s*(\[[\s\S]*\])\s*;?/);
            if (match) {
                try {
                    dictData = JSON.parse(match[1]);
                } catch (e2) {
                    // 如果 JSON.parse 仍然失败（例如数组中包含注释或非标准写法），回退到 eval
                    dictData = eval('(' + match[1] + ')');
                }
            } else {
                throw new Error('无法从 dict.js 中解析出字典数组');
            }
        }

        // 发送完成消息
        client.postMessage({
            type: 'COMPLETE',
            data: dictData
        });

    } catch (error) {
        // 发送错误消息
        client.postMessage({
            type: 'ERROR',
            error: error.message
        });
    }
}

// 拦截字典文件的 fetch 请求（用于共享）
self.addEventListener('fetch', (event) => {
    // 如果请求的是字典文件，可以尝试从 IndexedDB 提供
    // 这里保持简单，不做拦截，让主页面处理
});