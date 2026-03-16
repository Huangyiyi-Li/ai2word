/**
 * AiToWords 批量处理系统
 * 支持多文件同时上传和导出
 */

class BatchProcessor {
    constructor() {
        this.files = [];
        this.maxFiles = 10;
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        this.createBatchUI();
        this.bindEvents();
    }
    
    /**
     * 创建批量处理 UI
     */
    createBatchUI() {
        const container = document.createElement('div');
        container.id = 'batch-processor';
        container.className = 'batch-panel';
        container.innerHTML = `
            <div class="batch-header">
                <h3>📦 批量处理</h3>
                <button class="btn btn-secondary btn-sm" id="toggle-batch">
                    展开
                </button>
            </div>
            
            <div class="batch-content" style="display: none;">
                <div class="batch-dropzone" id="batch-dropzone">
                    <div class="dropzone-icon">📁</div>
                    <p>拖拽多个 .md 文件到此处</p>
                    <p class="hint">或点击选择文件（最多 ${this.maxFiles} 个）</p>
                    <input type="file" id="batch-file-input" multiple accept=".md,.txt" style="display: none;">
                </div>
                
                <div class="batch-files" id="batch-files"></div>
                
                <div class="batch-actions" id="batch-actions" style="display: none;">
                    <button class="btn btn-secondary" id="clear-batch">清空列表</button>
                    <button class="btn btn-primary" id="start-batch">
                        开始导出 (<span id="batch-count">0</span> 个文件)
                    </button>
                </div>
                
                <div class="batch-progress" id="batch-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progress-current">0</span> / <span id="progress-total">0</span>
                    </div>
                </div>
                
                <div class="batch-results" id="batch-results" style="display: none;"></div>
            </div>
        `;
        
        // 插入到页面
        const mainContent = document.querySelector('.main-content') || document.body;
        mainContent.appendChild(container);
        
        this.addStyles();
    }
    
    /**
     * 添加样式
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .batch-panel {
                background: var(--bg-secondary);
                border-radius: 12px;
                padding: 16px;
                margin-top: 20px;
                border: 1px solid var(--border);
            }
            
            .batch-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .batch-header h3 {
                margin: 0;
                font-size: 16px;
                color: var(--text-primary);
            }
            
            .batch-content {
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .batch-dropzone {
                border: 2px dashed var(--border);
                border-radius: 12px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                background: white;
            }
            
            .batch-dropzone:hover {
                border-color: var(--primary);
                background: rgba(79, 70, 229, 0.05);
            }
            
            .batch-dropzone.dragover {
                border-color: var(--primary);
                background: rgba(79, 70, 229, 0.1);
                transform: scale(1.02);
            }
            
            .dropzone-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            .batch-dropzone p {
                margin: 8px 0;
                color: var(--text-primary);
            }
            
            .batch-dropzone .hint {
                font-size: 13px;
                color: var(--text-secondary);
            }
            
            .batch-files {
                margin-top: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .batch-file-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: white;
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 12px;
                transition: all 0.2s;
            }
            
            .batch-file-item:hover {
                border-color: var(--primary);
            }
            
            .batch-file-item.processing {
                border-color: #f59e0b;
                background: #fffbeb;
            }
            
            .batch-file-item.success {
                border-color: #10b981;
                background: #f0fdf4;
            }
            
            .batch-file-item.error {
                border-color: #ef4444;
                background: #fef2f2;
            }
            
            .file-info {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }
            
            .file-icon {
                font-size: 24px;
            }
            
            .file-details {
                flex: 1;
                min-width: 0;
            }
            
            .file-name {
                font-weight: 600;
                color: var(--text-primary);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .file-meta {
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            
            .file-status {
                font-size: 20px;
            }
            
            .file-remove {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .file-remove:hover {
                background: rgba(239, 68, 68, 0.1);
            }
            
            .batch-actions {
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }
            
            .batch-actions button {
                flex: 1;
            }
            
            .batch-progress {
                margin-top: 16px;
            }
            
            .progress-bar {
                height: 8px;
                background: var(--border);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--primary);
                transition: width 0.3s;
                width: 0%;
            }
            
            .progress-text {
                text-align: center;
                margin-top: 8px;
                font-size: 14px;
                color: var(--text-secondary);
            }
            
            .batch-results {
                margin-top: 16px;
                padding: 16px;
                border-radius: 8px;
                background: white;
            }
            
            .result-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                border-bottom: 1px solid var(--border);
            }
            
            .result-item:last-child {
                border-bottom: none;
            }
            
            @media (max-width: 768px) {
                .batch-dropzone {
                    padding: 24px 16px;
                }
                
                .dropzone-icon {
                    font-size: 36px;
                }
                
                .batch-file-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .file-remove {
                    align-self: flex-end;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 展开/收起
        const toggleBtn = document.getElementById('toggle-batch');
        const content = document.querySelector('.batch-content');
        
        toggleBtn.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? '收起' : '展开';
        });
        
        // 文件选择
        const dropzone = document.getElementById('batch-dropzone');
        const fileInput = document.getElementById('batch-file-input');
        
        dropzone.addEventListener('click', () => fileInput.click());
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // 清空列表
        document.getElementById('clear-batch').addEventListener('click', () => {
            this.clearFiles();
        });
        
        // 开始导出
        document.getElementById('start-batch').addEventListener('click', () => {
            this.startBatchExport();
        });
    }
    
    /**
     * 处理文件
     */
    async handleFiles(fileList) {
        const files = Array.from(fileList);
        
        if (this.files.length + files.length > this.maxFiles) {
            window.showError?.('BATCH', `最多只能处理 ${this.maxFiles} 个文件`);
            return;
        }
        
        for (const file of files) {
            if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
                continue;
            }
            
            try {
                const content = await this.readFile(file);
                const wordCount = content.length;
                
                this.files.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    content: content,
                    size: file.size,
                    wordCount: wordCount,
                    status: 'pending' // pending, processing, success, error
                });
            } catch (error) {
                console.error('Failed to read file:', file.name, error);
            }
        }
        
        this.renderFileList();
        this.updateActions();
    }
    
    /**
     * 读取文件
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    /**
     * 渲染文件列表
     */
    renderFileList() {
        const container = document.getElementById('batch-files');
        
        if (this.files.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = this.files.map(file => `
            <div class="batch-file-item ${file.status}" data-id="${file.id}">
                <div class="file-info">
                    <div class="file-icon">📄</div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            ${this.formatSize(file.size)} · ${file.wordCount} 字
                        </div>
                    </div>
                </div>
                <div class="file-status">
                    ${this.getStatusIcon(file.status)}
                </div>
                <button class="file-remove" data-id="${file.id}">✕</button>
            </div>
        `).join('');
        
        // 绑定删除事件
        container.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseFloat(btn.dataset.id);
                this.removeFile(id);
            });
        });
    }
    
    /**
     * 获取状态图标
     */
    getStatusIcon(status) {
        const icons = {
            pending: '⏳',
            processing: '⚙️',
            success: '✅',
            error: '❌'
        };
        return icons[status] || '';
    }
    
    /**
     * 格式化文件大小
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    /**
     * 移除文件
     */
    removeFile(id) {
        this.files = this.files.filter(f => f.id !== id);
        this.renderFileList();
        this.updateActions();
    }
    
    /**
     * 清空文件
     */
    clearFiles() {
        this.files = [];
        this.renderFileList();
        this.updateActions();
        document.getElementById('batch-results').style.display = 'none';
    }
    
    /**
     * 更新操作按钮
     */
    updateActions() {
        const actions = document.getElementById('batch-actions');
        const count = document.getElementById('batch-count');
        
        if (this.files.length > 0) {
            actions.style.display = 'flex';
            count.textContent = this.files.length;
        } else {
            actions.style.display = 'none';
        }
    }
    
    /**
     * 开始批量导出
     */
    async startBatchExport() {
        if (this.files.length === 0) return;
        
        const progress = document.getElementById('batch-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressCurrent = document.getElementById('progress-current');
        const progressTotal = document.getElementById('progress-total');
        const resultsContainer = document.getElementById('batch-results');
        
        progress.style.display = 'block';
        progressTotal.textContent = this.files.length;
        resultsContainer.style.display = 'none';
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            
            // 更新进度
            progressCurrent.textContent = i + 1;
            progressFill.style.width = ((i + 1) / this.files.length * 100) + '%';
            
            // 更新文件状态
            file.status = 'processing';
            this.renderFileList();
            
            try {
                // 导出文件
                const filename = file.name.replace(/\.(md|txt)$/, '.docx');
                
                if (window.converter && window.converter.convertAndDownload) {
                    await window.converter.convertAndDownload(file.content, filename);
                    file.status = 'success';
                    successCount++;
                } else {
                    throw new Error('Converter not ready');
                }
            } catch (error) {
                file.status = 'error';
                errorCount++;
                console.error('Export failed:', file.name, error);
            }
            
            this.renderFileList();
            
            // 短暂延迟，避免浏览器阻止连续下载
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 显示结果
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <h4>导出完成</h4>
            <div class="result-item">
                <span>✅ 成功:</span>
                <strong>${successCount}</strong>
            </div>
            ${errorCount > 0 ? `
                <div class="result-item" style="color: #ef4444;">
                    <span>❌ 失败:</span>
                    <strong>${errorCount}</strong>
                </div>
            ` : ''}
            <div class="result-item">
                <span>📊 总计:</span>
                <strong>${this.files.length}</strong>
            </div>
        `;
        
        window.showSuccess?.(`批量导出完成：${successCount} 成功，${errorCount} 失败`);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.batchProcessor = new BatchProcessor();
});
