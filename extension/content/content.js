// MD2Word - Content Script
// 扫描AI对话页面，提取消息内容

// 各平台选择器配置
const platformConfigs = {
    chatgpt: {
        name: 'ChatGPT',
        hostPatterns: ['chat.openai.com', 'chatgpt.com'],
        selectors: {
            messageContainer: '[data-message-id]',
            userMessage: '[data-message-author-role="user"]',
            assistantMessage: '[data-message-author-role="assistant"]',
            messageContent: '.markdown, .whitespace-pre-wrap',
            conversationContainer: '[class*="react-scroll-to-bottom"]'
        }
    },
    claude: {
        name: 'Claude',
        hostPatterns: ['claude.ai'],
        selectors: {
            messageContainer: '[data-testid="user-message"], [data-testid="ai-message"]',
            userMessage: '[data-testid="user-message"]',
            assistantMessage: '[data-testid="ai-message"]',
            messageContent: '.prose, .font-claude-message',
            conversationContainer: '[class*="conversation"]'
        }
    },
    deepseek: {
        name: 'DeepSeek',
        hostPatterns: ['chat.deepseek.com'],
        selectors: {
            messageContainer: '.message-item',
            userMessage: '.message-item.user',
            assistantMessage: '.message-item.assistant',
            messageContent: '.markdown-body',
            conversationContainer: '.chat-container'
        }
    },
    tongyi: {
        name: '通义千问',
        hostPatterns: ['tongyi.aliyun.com'],
        selectors: {
            messageContainer: '[class*="chatItem"]',
            userMessage: '[class*="userItem"]',
            assistantMessage: '[class*="assistantItem"]',
            messageContent: '[class*="content"]',
            conversationContainer: '[class*="chatList"]'
        }
    },
    yiyan: {
        name: '文心一言',
        hostPatterns: ['yiyan.baidu.com'],
        selectors: {
            messageContainer: '[class*="chat-item"]',
            userMessage: '[class*="user-chat"]',
            assistantMessage: '[class*="bot-chat"]',
            messageContent: '[class*="chat-content"]',
            conversationContainer: '[class*="chat-list"]'
        }
    },
    kimi: {
        name: 'Kimi',
        hostPatterns: ['kimi.moonshot.cn'],
        selectors: {
            messageContainer: '[class*="message"]',
            userMessage: '[class*="human"]',
            assistantMessage: '[class*="assistant"]',
            messageContent: '.md-content, [class*="markdown"]',
            conversationContainer: '[class*="chat-container"]'
        }
    }
};

// 检测当前平台
function detectPlatform() {
    const hostname = window.location.hostname;
    for (const [key, config] of Object.entries(platformConfigs)) {
        if (config.hostPatterns.some(pattern => hostname.includes(pattern))) {
            return { key, config };
        }
    }
    return null;
}

// 提取消息内容
function extractMessages() {
    const platform = detectPlatform();
    if (!platform) {
        return { success: false, error: '不支持的平台', messages: [] };
    }

    const { config } = platform;
    const messages = [];

    // 尝试多种选择器策略
    let messageElements = document.querySelectorAll(config.selectors.messageContainer);

    // 如果没找到，尝试通用选择器
    if (messageElements.length === 0) {
        messageElements = document.querySelectorAll('[data-message-id], [class*="message"]');
    }

    messageElements.forEach((element, index) => {
        const isUser = element.matches(config.selectors.userMessage) ||
            element.querySelector(config.selectors.userMessage) ||
            element.classList.toString().toLowerCase().includes('user') ||
            element.classList.toString().toLowerCase().includes('human');

        const contentElement = element.querySelector(config.selectors.messageContent) || element;

        // 获取内容，处理LaTeX
        const content = extractContentWithLatex(contentElement);
        const textContent = contentElement.textContent?.trim() || '';

        if (textContent.length > 0) {
            messages.push({
                id: `msg-${index}`,
                role: isUser ? 'user' : 'assistant',
                content: content,
                textContent: textContent,
                timestamp: Date.now()
            });
        }
    });

    return {
        success: true,
        platform: config.name,
        messages: messages
    };
}

// 从渲染后的HTML中提取原始LaTeX
function extractContentWithLatex(element) {
    // 克隆元素以便操作
    const clone = element.cloneNode(true);

    // 调试：输出所有数学相关元素
    const allMathRelated = clone.querySelectorAll('[class*="math"], [class*="katex"], [class*="mjx"], [class*="Math"], .katex, .katex-display, mjx-container');
    console.log('[MD2Word Content] 找到数学相关元素数量:', allMathRelated.length);
    if (allMathRelated.length > 0) {
        allMathRelated.forEach((el, i) => {
            if (i < 5) { // 只输出前5个
                console.log(`[MD2Word Content] 数学元素 #${i} class:`, el.className);
                console.log(`[MD2Word Content] 数学元素 #${i} tagName:`, el.tagName);
                const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
                if (annotation) {
                    console.log(`[MD2Word Content] 数学元素 #${i} annotation内容:`, annotation.textContent.substring(0, 100));
                }
            }
        });
    }

    // 处理KaTeX渲染的公式 - 从annotation中提取原始LaTeX
    // KaTeX通常将公式渲染为 .katex 或 .katex-display
    const katexElements = clone.querySelectorAll('.katex, .katex-display, .katex-html');
    katexElements.forEach(katex => {
        // 尝试从annotation标签获取原始LaTeX
        const annotation = katex.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
            const latex = annotation.textContent.trim();
            // 判断是行内还是块级公式
            const isBlock = katex.classList.contains('katex-display') ||
                katex.closest('.katex-display') !== null;
            const replacement = isBlock ? `$$${latex}$$` : `$${latex}$`;
            katex.replaceWith(document.createTextNode(replacement));
            return;
        }

        // MathJax处理 - 尝试从 .MJX-TEX 或 script 标签获取
        const mjxTex = katex.querySelector('.MJX-TEX, script[type="math/tex"]');
        if (mjxTex) {
            const latex = mjxTex.textContent.trim();
            katex.replaceWith(document.createTextNode(`$$${latex}$$`));
            return;
        }
    });

    // 处理MathJax渲染的公式
    const mathjaxElements = clone.querySelectorAll('.MathJax, .mjx-chtml, .mjx-container, mjx-container');
    mathjaxElements.forEach(mj => {
        // 尝试从各种可能的位置获取原始LaTeX
        let latex = null;

        // 从aria-label获取
        if (mj.getAttribute('aria-label')) {
            latex = mj.getAttribute('aria-label');
        }
        // 从data-original获取
        else if (mj.getAttribute('data-original') || mj.getAttribute('data-latex')) {
            latex = mj.getAttribute('data-original') || mj.getAttribute('data-latex');
        }
        // 从相邻的script标签获取
        else {
            const script = mj.querySelector('script[type="math/tex"], script[type="math/tex; mode=display"]');
            if (script) {
                latex = script.textContent;
            }
        }

        if (latex) {
            const isBlock = mj.classList.contains('display') ||
                mj.closest('[class*="display"]') !== null ||
                mj.tagName.toLowerCase().includes('display');
            const replacement = isBlock ? `$$${latex}$$` : `$${latex}$`;
            mj.replaceWith(document.createTextNode(replacement));
        }
    });

    // 处理DeepSeek特有的LaTeX渲染 - 检查.ds-math类
    const dsMathElements = clone.querySelectorAll('.ds-math, [class*="math-renderer"]');
    dsMathElements.forEach(dsMath => {
        // DeepSeek可能将LaTeX存储在data属性中
        const latex = dsMath.getAttribute('data-value') ||
            dsMath.getAttribute('data-latex') ||
            dsMath.getAttribute('data-formula');
        if (latex) {
            const isBlock = dsMath.classList.contains('ds-math-block') ||
                dsMath.closest('.ds-math-block') !== null;
            const replacement = isBlock ? `$$${latex}$$` : `$${latex}$`;
            dsMath.replaceWith(document.createTextNode(replacement));
        }
    });

    // 返回处理后的HTML
    return clone.innerHTML;
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCAN_MESSAGES') {
        const result = extractMessages();
        sendResponse(result);
    }
    return true;
});

// 页面加载完成后自动扫描
let lastScanResult = null;

function autoScan() {
    const result = extractMessages();
    if (result.success && result.messages.length > 0) {
        // 检查是否有变化
        const newHash = JSON.stringify(result.messages.map(m => m.textContent.substring(0, 50)));
        const oldHash = lastScanResult ? JSON.stringify(lastScanResult.messages.map(m => m.textContent.substring(0, 50))) : '';

        if (newHash !== oldHash) {
            lastScanResult = result;
            chrome.runtime.sendMessage({
                type: 'MESSAGES_SCANNED',
                messages: result.messages,
                platform: result.platform
            });
        }
    }
}

// 使用MutationObserver监听DOM变化
const observer = new MutationObserver((mutations) => {
    // 防抖处理
    clearTimeout(window.md2wordScanTimeout);
    window.md2wordScanTimeout = setTimeout(autoScan, 500);
});

// 开始观察
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 初始扫描
setTimeout(autoScan, 1000);

console.log('MD2Word Content Script 已加载');
