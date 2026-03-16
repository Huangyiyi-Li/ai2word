/**
 * AiToWords 历史记录系统
 * 本地存储最近 10 条导出记录
 */

class HistoryManager {
    constructor() {
        this.storageKey = 'aitowords_history';
        this.maxRecords = 10;
        this.history = this.loadHistory();
        this.init();
    }
    
    /**
     * 加载历史记录
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    /**
     * 保存历史记录
     */
    saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }
    
    /**
     * 初始化
     */
    init() {
        this.renderHistoryPanel();
        this.bindEvents();
    }
    
    /**
     * 添加记录
     */
    addRecord(content, filename, wordCount) {
        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            preview: this.generatePreview(content),
            content: content,
            filename: filename,
            wordCount: wordCount
        };
        
        // 添加到开头
        this.history.unshift(record);
        
        // 限制数量
        if (this.history.length > this.maxRecords) {
            this.history = this.history.slice(0, this.maxRecords);
        }
        
        this.saveHistory();
        this.renderHistoryPanel();
        
        return record;
    }
    
    /**
     * 生成预览
     */
    generatePreview(content) {
        // 截取前 100 个字符作为预览
        return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    }
    
    /**
     * 删除记录
     */
    deleteRecord(id) {
        this.history = this.history.filter(r => r.id !== id);
        this.saveHistory();
        this.renderHistoryPanel();
    }
    
    /**
     * 清空历史
     */
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.history = [];
            this.saveHistory();
            this.renderHistoryPanel();
            window.showSuccess?.('历史记录已清空');
        }
    }
    
    /**
     * 重新导出
     */
    async reExport(id) {
        const record = this.history.find(r => r.id === id);
        if (!record) {
            window.showError?.('HISTORY', '找不到历史记录');
            return;
        }
        
        try {
            // 重新导出
            if (window.converter && window.converter.convertAndDownload) {
                await window.converter.convertAndDownload(record.content, record.filename);
                window.showSuccess?.('导出成功');
            } else {
                window.showError?.('EXPORT', '转换器未就绪');
            }
        } catch (error) {
            window.showError?.('EXPORT', error.message);
        }
    }
    
    /**
     * 渲染历史面板
     */
    renderHistoryPanel() {
        const container = document.getElementById('history-panel');
        if (!container) return;
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <p>📭 暂无历史记录</p>
                    <p class="hint">导出文档后会自动记录在这里</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="history-header">
                <h3>📜 历史记录</h3>
                <button class="btn btn-secondary btn-sm" id="clear-history">清空</button>
            </div>
            <div class="history-list">
        `;
        
        for (const record of this.history) {
            const date = new Date(record.timestamp);
            const timeAgo = this.getTimeAgo(date);
            
            html += `
                <div class="history-item" data-id="${record.id}">
                    <div class="history-info">
                        <div class="history-filename">${record.filename}</div>
                        <div class="history-meta">
                            <span class="history-time">${timeAgo}</span>
                            <span class="history-words">${record.wordCount} 字</span>
                        </div>
                        <div class="history-preview">${record.preview}</div>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-sm btn-primary history-reexport" data-id="${record.id}">
                            📥 重新导出
                        </button>
                        <button class="btn btn-sm btn-secondary history-delete" data-id="${record.id}">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    /**
     * 计算时间差
     */
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes} 分钟前`;
        if (hours < 24) return `${hours} 小时前`;
        if (days < 7) return `${days} 天前`;
        
        return date.toLocaleDateString();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 清空历史
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clear-history') {
                this.clearHistory();
            }
        });
        
        // 重新导出
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-reexport')) {
                const id = parseInt(e.target.dataset.id);
                this.reExport(id);
            }
        });
        
        // 删除记录
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-delete')) {
                const id = parseInt(e.target.dataset.id);
                if (confirm('确定要删除这条记录吗？')) {
                    this.deleteRecord(id);
                }
            }
        });
    }
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    #history-panel {
        background: var(--bg-secondary);
        border-radius: 12px;
        padding: 16px;
        margin-top: 16px;
    }
    
    .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .history-header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--text-primary);
    }
    
    .history-empty {
        text-align: center;
        padding: 32px 16px;
        color: var(--text-secondary);
    }
    
    .history-empty .hint {
        font-size: 13px;
        margin-top: 8px;
    }
    
    .history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .history-item {
        background: white;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        transition: all 0.2s;
    }
    
    .history-item:hover {
        border-color: var(--primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .history-info {
        flex: 1;
        min-width: 0;
    }
    
    .history-filename {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .history-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 8px;
    }
    
    .history-preview {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.4;
        max-height: 40px;
        overflow: hidden;
    }
    
    .history-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }
    
    @media (max-width: 768px) {
        .history-item {
            flex-direction: column;
        }
        
        .history-actions {
            width: 100%;
        }
        
        .history-actions button {
            flex: 1;
        }
    }
`;
document.head.appendChild(style);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
});
