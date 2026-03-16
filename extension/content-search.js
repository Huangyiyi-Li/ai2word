/**
 * AiToWords 插件 - 对话搜索功能
 * 注入到 ChatGPT/DeepSeek 等页面，提供搜索对话历史的能力
 */

(function() {
    'use strict';

    // 避免重复注入
    if (window.__aitowords_search_injected) return;
    window.__aitowords_search_injected = true;

    // 搜索管理器
    class ConversationSearch {
        constructor() {
            this.container = null;
            this.searchInput = null;
            this.resultsContainer = null;
            this.matches = [];
            this.currentIndex = -1;
            this.isVisible = false;
            this.init();
        }

        init() {
            this.createUI();
            this.injectStyles();
            this.bindEvents();
            console.log('[AiToWords] 对话搜索功能已加载');
        }

        /**
         * 创建搜索 UI
         */
        createUI() {
            // 悬浮按钮
            this.floatingBtn = document.createElement('div');
            this.floatingBtn.className = 'aitowords-search-float-btn';
            this.floatingBtn.innerHTML = '🔍';
            this.floatingBtn.title = '搜索对话 (Alt+S)';
            document.body.appendChild(this.floatingBtn);

            // 搜索面板
            this.container = document.createElement('div');
            this.container.className = 'aitowords-search-panel';
            this.container.innerHTML = `
                <div class="search-header">
                    <h3>🔍 搜索对话</h3>
                    <button class="close-btn" title="关闭 (Esc)">×</button>
                </div>
                <div class="search-body">
                    <div class="search-input-wrapper">
                        <input type="text" class="search-input" placeholder="输入关键词搜索..." />
                        <div class="search-options">
                            <button class="option-btn case-sensitive" title="区分大小写">Aa</button>
                            <button class="option-btn use-regex" title="正则表达式">.*</button>
                        </div>
                    </div>
                    <div class="search-stats">
                        <span class="match-count">找到 0 处匹配</span>
                    </div>
                    <div class="search-results">
                        <!-- 搜索结果列表 -->
                    </div>
                </div>
            `;

            document.body.appendChild(this.container);

            // 缓存元素
            this.searchInput = this.container.querySelector('.search-input');
            this.resultsContainer = this.container.querySelector('.search-results');
            this.matchCountEl = this.container.querySelector('.match-count');
            this.caseBtn = this.container.querySelector('.case-sensitive');
            this.regexBtn = this.container.querySelector('.use-regex');
        }

        /**
         * 注入样式
         */
        injectStyles() {
            if (document.getElementById('aitowords-search-styles')) return;

            const style = document.createElement('style');
            style.id = 'aitowords-search-styles';
            style.textContent = `
                .aitowords-search-float-btn {
                    position: fixed;
                    bottom: 80px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    z-index: 99999;
                    transition: all 0.3s;
                }

                .aitowords-search-float-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
                }

                .aitowords-search-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.9);
                    width: 600px;
                    max-width: 90vw;
                    max-height: 80vh;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    z-index: 100000;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .aitowords-search-panel.active {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translate(-50%, -50%) scale(1);
                }

                .search-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 16px 16px 0 0;
                }

                .search-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .search-body {
                    padding: 20px;
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .search-input-wrapper {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .search-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 15px;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .search-input:focus {
                    border-color: #667eea;
                }

                .search-options {
                    display: flex;
                    gap: 4px;
                }

                .option-btn {
                    padding: 8px 12px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    font-family: monospace;
                    transition: all 0.2s;
                }

                .option-btn:hover {
                    background: #f3f4f6;
                }

                .option-btn.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }

                .search-stats {
                    margin-bottom: 12px;
                    font-size: 13px;
                    color: #6b7280;
                }

                .search-results {
                    flex: 1;
                    overflow-y: auto;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    background: #f9fafb;
                }

                .search-result-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid #e5e7eb;
                    background: white;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .search-result-item:last-child {
                    border-bottom: none;
                }

                .search-result-item:hover {
                    background: #f3f4f6;
                }

                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }

                .result-role {
                    font-size: 12px;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 4px;
                    background: #e5e7eb;
                }

                .result-role.user {
                    background: #dbeafe;
                    color: #1e40af;
                }

                .result-role.assistant {
                    background: #dcfce7;
                    color: #166534;
                }

                .result-actions {
                    display: flex;
                    gap: 4px;
                }

                .action-btn {
                    padding: 4px 8px;
                    font-size: 11px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn.jump {
                    background: #667eea;
                    color: white;
                }

                .action-btn.export {
                    background: #10b981;
                    color: white;
                }

                .action-btn:hover {
                    opacity: 0.8;
                }

                .result-content {
                    font-size: 13px;
                    color: #4b5563;
                    line-height: 1.5;
                }

                .result-content .highlight {
                    background: #fef08a;
                    padding: 1px 2px;
                    border-radius: 2px;
                    font-weight: 600;
                }

                .no-results {
                    padding: 40px 20px;
                    text-align: center;
                    color: #9ca3af;
                }

                .no-results-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }

                @media (max-width: 640px) {
                    .aitowords-search-panel {
                        width: 95vw;
                        max-height: 90vh;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        /**
         * 绑定事件
         */
        bindEvents() {
            // 悬浮按钮点击
            this.floatingBtn.addEventListener('click', () => this.toggle());

            // 搜索输入
            this.searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });

            // 快捷键
            document.addEventListener('keydown', (e) => {
                // Alt+S 打开搜索
                if (e.altKey && e.key === 's') {
                    e.preventDefault();
                    this.toggle();
                }
                // Esc 关闭
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });

            // 关闭按钮
            this.container.querySelector('.close-btn').addEventListener('click', () => this.hide());

            // 选项按钮
            this.caseBtn.addEventListener('click', () => {
                this.caseBtn.classList.toggle('active');
                this.performSearch(this.searchInput.value);
            });

            this.regexBtn.addEventListener('click', () => {
                this.regexBtn.classList.toggle('active');
                this.performSearch(this.searchInput.value);
            });
        }

        /**
         * 切换显示/隐藏
         */
        toggle() {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }

        /**
         * 显示搜索面板
         */
        show() {
            this.isVisible = true;
            this.container.classList.add('active');
            this.searchInput.focus();
            this.searchInput.select();
        }

        /**
         * 隐藏搜索面板
         */
        hide() {
            this.isVisible = false;
            this.container.classList.remove('active');
        }

        /**
         * 执行搜索
         */
        performSearch(query) {
            if (!query) {
                this.clearResults();
                return;
            }

            try {
                const messages = this.getAllMessages();
                const isCaseSensitive = this.caseBtn.classList.contains('active');
                const useRegex = this.regexBtn.classList.contains('active');

                // 构建正则
                const flags = isCaseSensitive ? 'g' : 'gi';
                const regex = useRegex 
                    ? new RegExp(query, flags)
                    : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

                // 搜索匹配
                this.matches = [];
                messages.forEach((msg, index) => {
                    const text = msg.element.textContent;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        this.matches.push({
                            index,
                            element: msg.element,
                            role: msg.role,
                            text: text,
                            match: match[0],
                            start: match.index,
                            end: match.index + match[0].length
                        });
                        if (match[0].length === 0) regex.lastIndex++;
                    }
                });

                // 更新 UI
                this.updateResults();

            } catch (e) {
                console.error('[AiToWords] 搜索错误:', e);
                this.matchCountEl.textContent = '正则表达式错误';
            }
        }

        /**
         * 获取所有对话消息
         */
        getAllMessages() {
            // ChatGPT/DeepSeek/豆包等平台的通用选择器
            const selectors = [
                '[data-message-author-role]', // ChatGPT
                '.message-content', // 通用
                '.markdown', // 通用
                '[class*="Message"]', // 通用
                '.conversation-item' // 通用
            ];

            const messages = [];

            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    // 推断角色
                    let role = 'unknown';
                    if (el.getAttribute('data-message-author-role')) {
                        role = el.getAttribute('data-message-author-role');
                    } else if (el.closest('[class*="user"]')) {
                        role = 'user';
                    } else if (el.closest('[class*="assistant"]') || el.closest('[class*="bot"]')) {
                        role = 'assistant';
                    }

                    if (el.textContent.trim()) {
                        messages.push({ element: el, role });
                    }
                });
            });

            return messages;
        }

        /**
         * 更新搜索结果
         */
        updateResults() {
            const count = this.matches.length;
            this.matchCountEl.textContent = `找到 ${count} 处匹配`;

            if (count === 0) {
                this.resultsContainer.innerHTML = `
                    <div class="no-results">
                        <div class="no-results-icon">🔍</div>
                        <p>未找到匹配内容</p>
                    </div>
                `;
                return;
            }

            let html = '';
            this.matches.slice(0, 50).forEach((match, idx) => {
                const preview = this.getPreview(match);
                html += `
                    <div class="search-result-item" data-index="${idx}">
                        <div class="result-header">
                            <span class="result-role ${match.role}">${match.role}</span>
                            <div class="result-actions">
                                <button class="action-btn jump" data-index="${idx}">跳转</button>
                                <button class="action-btn export" data-index="${idx}">导出</button>
                            </div>
                        </div>
                        <div class="result-content">${preview}</div>
                    </div>
                `;
            });

            this.resultsContainer.innerHTML = html;

            // 绑定结果项事件
            this.resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('action-btn')) {
                        const idx = parseInt(item.dataset.index);
                        this.jumpToMatch(idx);
                    }
                });
            });

            // 绑定按钮事件
            this.resultsContainer.querySelectorAll('.action-btn.jump').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.dataset.index);
                    this.jumpToMatch(idx);
                });
            });

            this.resultsContainer.querySelectorAll('.action-btn.export').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.dataset.index);
                    this.exportMatch(idx);
                });
            });
        }

        /**
         * 获取预览文本
         */
        getPreview(match) {
            const text = match.text;
            const start = Math.max(0, match.start - 30);
            const end = Math.min(text.length, match.end + 30);
            
            let preview = text.substring(start, end);
            
            // 高亮匹配部分
            const matchStart = match.start - start;
            const matchEnd = match.end - start;
            
            const before = preview.substring(0, matchStart);
            const highlighted = preview.substring(matchStart, matchEnd);
            const after = preview.substring(matchEnd);
            
            return `${before}<span class="highlight">${highlighted}</span>${after}`;
        }

        /**
         * 跳转到匹配位置
         */
        jumpToMatch(index) {
            const match = this.matches[index];
            if (!match) return;

            // 滚动到元素
            match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 高亮闪烁效果
            const originalBg = match.element.style.backgroundColor;
            match.element.style.backgroundColor = '#fef08a';
            setTimeout(() => {
                match.element.style.backgroundColor = originalBg;
            }, 1500);

            this.hide();
        }

        /**
         * 导出匹配内容
         */
        exportMatch(index) {
            const match = this.matches[index];
            if (!match) return;

            // 调用插件导出功能
            if (window.__aitowords_export) {
                window.__aitowords_export([match.element]);
            } else {
                // 备用方案：复制到剪贴板
                const text = match.element.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    alert('已复制到剪贴板！');
                });
            }
        }

        /**
         * 清空结果
         */
        clearResults() {
            this.matches = [];
            this.matchCountEl.textContent = '找到 0 处匹配';
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">💬</div>
                    <p>输入关键词开始搜索</p>
                </div>
            `;
        }
    }

    // 初始化
    setTimeout(() => {
        window.__aitowords_search = new ConversationSearch();
    }, 1000);

})();
