/**
 * AiToWords 移动端优化
 * 响应式布局和触摸优化
 */

class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.init();
    }
    
    /**
     * 检测移动设备
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth < 768;
    }
    
    /**
     * 初始化
     */
    init() {
        if (this.isMobile) {
            this.optimizeForMobile();
        }
        
        this.addMobileStyles();
        this.handleResize();
    }
    
    /**
     * 移动端优化
     */
    optimizeForMobile() {
        // 禁用双击缩放
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 优化输入框
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.setAttribute('autocapitalize', 'off');
            textarea.setAttribute('autocomplete', 'off');
            textarea.setAttribute('autocorrect', 'off');
            textarea.setAttribute('spellcheck', 'false');
        }
        
        // 添加快速操作栏
        this.createMobileToolbar();
        
        // 优化滚动
        this.optimizeScrolling();
    }
    
    /**
     * 创建移动端工具栏
     */
    createMobileToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'mobile-toolbar';
        toolbar.innerHTML = `
            <button class="mobile-action" id="mobile-paste">
                📋 粘贴
            </button>
            <button class="mobile-action" id="mobile-clear">
                🗑️ 清空
            </button>
            <button class="mobile-action" id="mobile-sample">
                📝 示例
            </button>
            <button class="mobile-action" id="mobile-export">
                📥 导出
            </button>
        `;
        
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            inputSection.insertBefore(toolbar, inputSection.firstChild);
        }
        
        this.bindMobileEvents();
    }
    
    /**
     * 绑定移动端事件
     */
    bindMobileEvents() {
        // 粘贴
        document.getElementById('mobile-paste')?.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                const textarea = document.getElementById('markdown-input');
                if (textarea) {
                    textarea.value = text;
                    textarea.dispatchEvent(new Event('input'));
                    window.showSuccess?.('已粘贴');
                }
            } catch (error) {
                window.showError?.('CLIPBOARD', '无法访问剪贴板');
            }
        });
        
        // 清空
        document.getElementById('mobile-clear')?.addEventListener('click', () => {
            const textarea = document.getElementById('markdown-input');
            if (textarea && confirm('确定要清空内容吗？')) {
                textarea.value = '';
                textarea.dispatchEvent(new Event('input'));
                window.showSuccess?.('已清空');
            }
        });
        
        // 示例
        document.getElementById('mobile-sample')?.addEventListener('click', () => {
            const sample = `# AI 对话示例

这是一个 **示例对话**，展示 AiToWords 的转换效果。

## 数学公式

爱因斯坦质能方程：

$$E = mc^2$$

## 代码示例

\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`

## 列表示例

- 支持 Markdown
- 保留 LaTeX 公式
- 代码语法高亮
`;
            
            const textarea = document.getElementById('markdown-input');
            if (textarea) {
                textarea.value = sample;
                textarea.dispatchEvent(new Event('input'));
                window.showSuccess?.('已加载示例');
            }
        });
        
        // 导出
        document.getElementById('mobile-export')?.addEventListener('click', () => {
            const exportBtn = document.getElementById('convert-btn');
            if (exportBtn) {
                exportBtn.click();
            }
        });
    }
    
    /**
     * 优化滚动
     */
    optimizeScrolling() {
        // 平滑滚动到输入框
        const textarea = document.getElementById('markdown-input');
        if (textarea) {
            textarea.addEventListener('focus', () => {
                setTimeout(() => {
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        }
    }
    
    /**
     * 添加移动端样式
     */
    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 移动端工具栏 */
            .mobile-toolbar {
                display: none;
                position: sticky;
                top: 0;
                z-index: 100;
                background: var(--bg-primary);
                border-bottom: 1px solid var(--border);
                padding: 8px;
                margin-bottom: 12px;
                gap: 8px;
                justify-content: space-around;
            }
            
            .mobile-action {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: white;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mobile-action:active {
                background: var(--bg-secondary);
                transform: scale(0.95);
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .mobile-toolbar {
                    display: flex;
                }
                
                /* 主容器 */
                body {
                    padding: 12px;
                }
                
                /* 标题 */
                h1 {
                    font-size: 24px !important;
                    margin-bottom: 16px !important;
                }
                
                /* 输入输出区域 */
                .main-content {
                    flex-direction: column;
                    gap: 16px;
                }
                
                .input-section, .output-section {
                    width: 100%;
                }
                
                /* 文本框 */
                textarea {
                    min-height: 200px !important;
                    font-size: 16px; /* 防止 iOS 缩放 */
                }
                
                /* 按钮 */
                .btn {
                    padding: 12px 16px;
                    font-size: 14px;
                }
                
                /* 设置面板 */
                #settingsPanel {
                    position: fixed !important;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    background: white;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                /* 预览区 */
                .preview-content {
                    font-size: 14px;
                }
                
                /* FAQ */
                .faq-item {
                    padding: 12px;
                }
                
                /* Footer */
                .footer {
                    padding: 16px;
                }
                
                /* 隐藏侧边栏 */
                .sidebar {
                    display: none;
                }
            }
            
            /* 超小屏幕 */
            @media (max-width: 480px) {
                h1 {
                    font-size: 20px !important;
                }
                
                .btn {
                    padding: 10px 14px;
                    font-size: 13px;
                }
                
                textarea {
                    min-height: 150px !important;
                }
            }
            
            /* 横屏模式 */
            @media (max-width: 768px) and (orientation: landscape) {
                textarea {
                    min-height: 120px !important;
                }
            }
            
            /* 触摸优化 */
            @media (hover: none) and (pointer: coarse) {
                /* 增大触摸目标 */
                button, a, input, textarea {
                    min-height: 44px;
                }
                
                /* 移除 hover 效果 */
                .btn:hover {
                    transform: none;
                }
                
                /* 使用 active 状态 */
                .btn:active {
                    transform: scale(0.98);
                    opacity: 0.9;
                }
            }
            
            /* 安全区域（刘海屏） */
            @supports (padding: max(0px)) {
                body {
                    padding-top: max(12px, env(safe-area-inset-top));
                    padding-bottom: max(12px, env(safe-area-inset-bottom));
                    padding-left: max(12px, env(safe-area-inset-left));
                    padding-right: max(12px, env(safe-area-inset-right));
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = this.detectMobile();
                
                // 如果移动状态改变，重新优化
                if (wasMobile !== this.isMobile) {
                    if (this.isMobile) {
                        this.optimizeForMobile();
                    }
                }
            }, 250);
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
});
