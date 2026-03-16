/**
 * AiToWords 内容搜索模块
 * 功能：在输入框中搜索、高亮、跳转匹配内容
 */

class ContentSearch {
    constructor() {
        this.container = null;
        this.searchInput = null;
        this.matches = [];
        this.currentIndex = -1;
        this.originalContent = '';
        this.isCaseSensitive = false;
        this.useRegex = false;
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
        this.addStyles();
    }

    /**
     * 创建搜索 UI
     */
    createUI() {
        // 查找输入框容器
        const inputContainer = document.querySelector('.input-section');
        if (!inputContainer) return;

        // 创建搜索容器
        this.container = document.createElement('div');
        this.container.className = 'content-search-container';
        this.container.innerHTML = `
            <div class="search-toolbar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" placeholder="搜索内容..." />
                    <button class="search-close" title="关闭">×</button>
                </div>
                <div class="search-options">
                    <button class="search-option-btn case-sensitive" title="区分大小写 (Aa)">Aa</button>
                    <button class="search-option-btn use-regex" title="正则表达式 (.*)">.*</button>
                </div>
                <div class="search-nav">
                    <span class="match-count">0/0</span>
                    <button class="nav-btn prev" title="上一个 (Shift+Enter)">▲</button>
                    <button class="nav-btn next" title="下一个 (Enter)">▼</button>
                </div>
            </div>
            <div class="search-info">
                <span class="search-status">按 Ctrl+F 打开搜索</span>
            </div>
        `;

        // 插入到输入框之前
        const textarea = document.getElementById('markdownInput');
        if (textarea && textarea.parentNode) {
            textarea.parentNode.insertBefore(this.container, textarea);
        }

        // 缓存元素
        this.searchInput = this.container.querySelector('.search-input');
        this.matchCountEl = this.container.querySelector('.match-count');
        this.statusEl = this.container.querySelector('.search-status');
        this.caseBtn = this.container.querySelector('.case-sensitive');
        this.regexBtn = this.container.querySelector('.use-regex');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索输入
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // 回车搜索下一个
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    this.prevMatch();
                } else {
                    this.nextMatch();
                }
            }
            if (e.key === 'Escape') {
                this.hide();
            }
        });

        // 导航按钮
        this.container.querySelector('.prev').addEventListener('click', () => this.prevMatch());
        this.container.querySelector('.next').addEventListener('click', () => this.nextMatch());
        this.container.querySelector('.search-close').addEventListener('click', () => this.hide());

        // 选项按钮
        this.caseBtn.addEventListener('click', () => {
            this.isCaseSensitive = !this.isCaseSensitive;
            this.caseBtn.classList.toggle('active', this.isCaseSensitive);
            this.performSearch(this.searchInput.value);
        });

        this.regexBtn.addEventListener('click', () => {
            this.useRegex = !this.useRegex;
            this.regexBtn.classList.toggle('active', this.useRegex);
            this.performSearch(this.searchInput.value);
        });

        // 全局快捷键 Ctrl+F
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.show();
            }
        });
    }

    /**
     * 执行搜索
     */
    performSearch(query) {
        const textarea = document.getElementById('markdownInput');
        if (!textarea) return;

        // 保存原始内容
        if (!this.originalContent) {
            this.originalContent = textarea.value;
        }

        // 清空搜索
        if (!query) {
            this.clearSearch();
            return;
        }

        try {
            // 构建正则表达式
            let regex;
            const flags = this.isCaseSensitive ? 'g' : 'gi';
            
            if (this.useRegex) {
                regex = new RegExp(query, flags);
            } else {
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regex = new RegExp(escaped, flags);
            }

            // 查找匹配
            this.matches = [];
            const content = textarea.value;
            let match;
            
            while ((match = regex.exec(content)) !== null) {
                this.matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
                // 防止零长度匹配导致死循环
                if (match[0].length === 0) regex.lastIndex++;
            }

            // 更新 UI
            this.updateUI();

            // 如果有匹配，高亮第一个
            if (this.matches.length > 0) {
                this.currentIndex = 0;
                this.highlightMatch();
            }

        } catch (e) {
            this.statusEl.textContent = '正则表达式错误';
            this.statusEl.className = 'search-status error';
        }
    }

    /**
     * 高亮当前匹配
     */
    highlightMatch() {
        const textarea = document.getElementById('markdownInput');
        if (!textarea || this.matches.length === 0) return;

        const match = this.matches[this.currentIndex];
        
        // 设置选区
        textarea.focus();
        textarea.setSelectionRange(match.start, match.end);
        
        // 滚动到可视区域
        this.scrollToMatch(textarea, match);

        // 更新计数
        this.updateUI();
    }

    /**
     * 滚动到匹配位置
     */
    scrollToMatch(textarea, match) {
        // 计算行号
        const lines = textarea.value.substring(0, match.start).split('\n');
        const lineNumber = lines.length;
        
        // 估算滚动位置
        const lineHeight = 20; // 估算行高
        const scrollPos = (lineNumber - 3) * lineHeight; // 提前3行显示
        
        textarea.scrollTop = Math.max(0, scrollPos);
    }

    /**
     * 下一个匹配
     */
    nextMatch() {
        if (this.matches.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.matches.length;
        this.highlightMatch();
    }

    /**
     * 上一个匹配
     */
    prevMatch() {
        if (this.matches.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
        this.highlightMatch();
    }

    /**
     * 清空搜索
     */
    clearSearch() {
        this.matches = [];
        this.currentIndex = -1;
        this.updateUI();
    }

    /**
     * 更新 UI
     */
    updateUI() {
        const count = this.matches.length;
        if (count > 0) {
            this.matchCountEl.textContent = `${this.currentIndex + 1}/${count}`;
            this.statusEl.textContent = `找到 ${count} 处匹配`;
            this.statusEl.className = 'search-status success';
        } else if (this.searchInput.value) {
            this.matchCountEl.textContent = '0/0';
            this.statusEl.textContent = '未找到匹配';
            this.statusEl.className = 'search-status';
        } else {
            this.matchCountEl.textContent = '0/0';
            this.statusEl.textContent = '按 Ctrl+F 打开搜索';
            this.statusEl.className = 'search-status';
        }
    }

    /**
     * 显示搜索
     */
    show() {
        this.container.classList.add('active');
        this.searchInput.focus();
        this.searchInput.select();
        
        // 如果有内容，自动搜索
        const textarea = document.getElementById('markdownInput');
        if (textarea && textarea.value && this.searchInput.value) {
            this.performSearch(this.searchInput.value);
        }
    }

    /**
     * 隐藏搜索
     */
    hide() {
        this.container.classList.remove('active');
        this.clearSearch();
        
        // 恢复焦点到输入框
        const textarea = document.getElementById('markdownInput');
        if (textarea) textarea.focus();
    }

    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('content-search-styles')) return;

        const style = document.createElement('style');
        style.id = 'content-search-styles';
        style.textContent = `
            .content-search-container {
                display: none;
                margin-bottom: 12px;
                background: #f8f9fa;
                border: 1px solid #e1e4e8;
                border-radius: 8px;
                padding: 12px;
            }
            
            .content-search-container.active {
                display: block;
            }
            
            .search-toolbar {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .search-input-wrapper {
                flex: 1;
                display: flex;
                align-items: center;
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 0 8px;
                min-width: 200px;
            }
            
            .search-input-wrapper:focus-within {
                border-color: #4f46e5;
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }
            
            .search-icon {
                margin-right: 8px;
                opacity: 0.5;
            }
            
            .search-input {
                flex: 1;
                border: none;
                background: transparent;
                padding: 8px 0;
                font-size: 14px;
                outline: none;
            }
            
            .search-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #6b7280;
                padding: 0 4px;
            }
            
            .search-close:hover {
                color: #ef4444;
            }
            
            .search-options {
                display: flex;
                gap: 4px;
            }
            
            .search-option-btn {
                padding: 6px 10px;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                font-family: monospace;
            }
            
            .search-option-btn:hover {
                background: #f3f4f6;
            }
            
            .search-option-btn.active {
                background: #4f46e5;
                color: white;
                border-color: #4f46e5;
            }
            
            .search-nav {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .match-count {
                font-size: 13px;
                color: #6b7280;
                min-width: 40px;
                text-align: center;
            }
            
            .nav-btn {
                padding: 6px 10px;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .nav-btn:hover {
                background: #f3f4f6;
            }
            
            .nav-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .search-info {
                margin-top: 8px;
                font-size: 12px;
            }
            
            .search-status {
                color: #6b7280;
            }
            
            .search-status.success {
                color: #10b981;
            }
            
            .search-status.error {
                color: #ef4444;
            }
            
            /* 移动端适配 */
            @media (max-width: 640px) {
                .search-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .search-nav {
                    justify-content: space-between;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.contentSearch = new ContentSearch();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSearch;
}
