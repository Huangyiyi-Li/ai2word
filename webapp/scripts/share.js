/**
 * AiToWords 分享功能
 * 支持社交媒体分享、二维码生成、复制链接
 */

class ShareManager {
    constructor() {
        this.url = window.location.href;
        this.title = 'AiToWords - 免费 AI 对话转 Word 工具';
        this.description = '支持 ChatGPT、DeepSeek、豆包、元宝等 AI 平台，完美保留 LaTeX 公式、Mermaid 图表、代码高亮';
        this.init();
    }
    
    init() {
        this.createShareButtons();
        this.bindEvents();
    }
    
    /**
     * 创建分享按钮
     */
    createShareButtons() {
        const container = document.createElement('div');
        container.className = 'share-container';
        container.innerHTML = `
            <div class="share-section">
                <h4>📤 分享给朋友</h4>
                <div class="share-buttons">
                    <button class="share-btn" id="share-weibo" title="分享到微博">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#e6162d" d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.439v.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.388-1.024.428-1.909.003-2.538-.8-1.181-2.986-1.118-5.49-.034 0 0-.785.345-.584-.283.388-1.239.332-2.276-.273-2.877-1.373-1.366-5.025.05-8.157 3.17C.496 11.722-.07 14.866.003 17.547c.14 5.148 4.109 8.265 8.135 8.265 5.279 0 10.35-4.154 11.611-9.303.765-3.126-.634-4.896-1.69-5.219v-.031z"/>
                        </svg>
                        <span>微博</span>
                    </button>
                    
                    <button class="share-btn" id="share-twitter" title="分享到 Twitter">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#1da1f2" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        <span>Twitter</span>
                    </button>
                    
                    <button class="share-btn" id="share-copy" title="复制链接">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#666" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>复制链接</span>
                    </button>
                    
                    <button class="share-btn" id="share-native" title="系统分享" style="display: none;">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#666" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        <span>分享</span>
                    </button>
                </div>
                
            </div>
        `;
        
        // 插入到页面底部
        const footer = document.querySelector('.footer') || document.body;
        footer.insertBefore(container, footer.firstChild);
        
        this.addStyles();
        
        // 检测是否支持原生分享
        if (navigator.share) {
            document.getElementById('share-native').style.display = 'inline-flex';
        }
    }
    
    /**
     * 添加样式
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .share-section {
                padding: 24px;
                background: var(--bg-secondary);
                border-radius: 12px;
                margin: 20px 0;
            }
            
            .share-section h4 {
                margin: 0 0 16px 0;
                font-size: 16px;
                color: var(--text-primary);
            }
            
            .share-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            
            .share-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                background: white;
                border: 1px solid var(--border);
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                color: var(--text-primary);
                transition: all 0.2s;
            }
            
            .share-btn:hover {
                background: var(--bg-secondary);
                border-color: var(--primary);
                transform: translateY(-1px);
            }
            
            .share-btn svg {
                flex-shrink: 0;
            }
            
            @media (max-width: 768px) {
                .share-buttons {
                    flex-direction: column;
                }
                
                .share-btn {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 微博分享
        document.getElementById('share-weibo').addEventListener('click', () => {
            this.shareToWeibo();
        });
        
        // Twitter 分享
        document.getElementById('share-twitter').addEventListener('click', () => {
            this.shareToTwitter();
        });
        
        // 复制链接
        document.getElementById('share-copy').addEventListener('click', () => {
            this.copyLink();
        });
        
        // 原生分享
        document.getElementById('share-native').addEventListener('click', () => {
            this.nativeShare();
        });
    }
    
    /**
     * 分享到微博
     */
    shareToWeibo() {
        const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(this.url)}&title=${encodeURIComponent(this.title + ' - ' + this.description)}`;
        window.open(url, '_blank', 'width=600,height=400');
        
        if (window.gtag) {
            gtag('event', 'share', { 'method': 'weibo' });
        }
    }
    
    /**
     * 分享到 Twitter
     */
    shareToTwitter() {
        const text = `${this.title}\n\n${this.description}\n\n${this.url}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'width=600,height=400');
        
        if (window.gtag) {
            gtag('event', 'share', { 'method': 'twitter' });
        }
    }
    
    /**
     * 复制链接
     */
    async copyLink() {
        try {
            await navigator.clipboard.writeText(this.url);
            
            // 显示成功提示
            const btn = document.getElementById('share-copy');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span>✓ 已复制</span>';
            btn.style.borderColor = '#10b981';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.borderColor = '';
            }, 2000);
            
            if (window.gtag) {
                gtag('event', 'share', { 'method': 'copy' });
            }
        } catch (error) {
            alert('复制失败，请手动复制：' + this.url);
        }
    }
    
    /**
     * 原生分享（移动端）
     */
    async nativeShare() {
        try {
            await navigator.share({
                title: this.title,
                text: this.description,
                url: this.url
            });
            
            if (window.gtag) {
                gtag('event', 'share', { 'method': 'native' });
            }
        } catch (error) {
            console.log('Share cancelled');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.shareManager = new ShareManager();
});
