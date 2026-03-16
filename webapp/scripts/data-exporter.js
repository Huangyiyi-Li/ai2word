/**
 * AiToWords 数据导出系统
 * 支持 JSON、CSV 导出
 */

class DataExporter {
    constructor() {
        this.init();
    }
    
    init() {
        this.createExportUI();
    }
    
    /**
     * 创建导出 UI
     */
    createExportUI() {
        const container = document.createElement('div');
        container.id = 'data-exporter';
        container.className = 'export-panel';
        container.innerHTML = `
            <div class="export-header">
                <h3>📊 数据导出</h3>
            </div>
            
            <div class="export-options">
                <div class="export-group">
                    <label>导出类型</label>
                    <select id="export-type">
                        <option value="history">历史记录</option>
                        <option value="templates">模板配置</option>
                        <option value="settings">用户设置</option>
                        <option value="all">全部数据</option>
                    </select>
                </div>
                
                <div class="export-group">
                    <label>导出格式</label>
                    <select id="export-format">
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" id="export-data-btn">
                    📥 导出数据
                </button>
                
                <div class="import-section">
                    <h4>导入数据</h4>
                    <input type="file" id="import-file" accept=".json,.csv" style="display: none;">
                    <button class="btn btn-secondary" id="import-data-btn">
                        📤 选择文件
                    </button>
                </div>
            </div>
        `;
        
        // 插入到设置面板
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.appendChild(container);
        }
        
        this.addStyles();
        this.bindEvents();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .export-panel {
                margin-top: 20px;
                padding: 16px;
                background: white;
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            
            .export-header h3 {
                margin: 0 0 16px 0;
                font-size: 16px;
                color: var(--text-primary);
            }
            
            .export-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .export-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .export-group label {
                font-size: 13px;
                color: var(--text-secondary);
            }
            
            .export-group select,
            .export-group input {
                padding: 8px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 14px;
            }
            
            .import-section {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--border);
            }
            
            .import-section h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: var(--text-primary);
            }
        `;
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // 导出
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        // 导入
        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });
        
        document.getElementById('import-file')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }
    
    /**
     * 导出数据
     */
    exportData() {
        const type = document.getElementById('export-type').value;
        const format = document.getElementById('export-format').value;
        
        let data = {};
        
        switch (type) {
            case 'history':
                data = {
                    type: 'history',
                    exportDate: new Date().toISOString(),
                    data: JSON.parse(localStorage.getItem('aitowords_history') || '[]')
                };
                break;
                
            case 'templates':
                data = {
                    type: 'templates',
                    exportDate: new Date().toISOString(),
                    data: JSON.parse(localStorage.getItem('aitowords_custom_templates') || '{}')
                };
                break;
                
            case 'settings':
                data = {
                    type: 'settings',
                    exportDate: new Date().toISOString(),
                    data: {
                        currentTemplate: JSON.parse(localStorage.getItem('aitowords_current_template') || '{}'),
                        language: localStorage.getItem('aitowords_language'),
                        theme: localStorage.getItem('aitowords_theme')
                    }
                };
                break;
                
            case 'all':
                data = {
                    type: 'all',
                    exportDate: new Date().toISOString(),
                    data: {
                        history: JSON.parse(localStorage.getItem('aitowords_history') || '[]'),
                        templates: JSON.parse(localStorage.getItem('aitowords_custom_templates') || '{}'),
                        settings: {
                            currentTemplate: JSON.parse(localStorage.getItem('aitowords_current_template') || '{}'),
                            language: localStorage.getItem('aitowords_language'),
                            theme: localStorage.getItem('aitowords_theme')
                        }
                    }
                };
                break;
        }
        
        // 导出
        const filename = `aitowords_${type}_${Date.now()}`;
        
        if (format === 'json') {
            this.downloadJSON(data, filename + '.json');
        } else if (format === 'csv') {
            this.downloadCSV(data, filename + '.csv');
        }
        
        window.showSuccess?.('数据已导出');
    }
    
    /**
     * 导入数据
     */
    async importData(file) {
        if (!file) return;
        
        try {
            const content = await this.readFile(file);
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
            } else if (file.name.endsWith('.csv')) {
                data = this.parseCSV(content);
            }
            
            // 导入数据
            if (data.type === 'history') {
                localStorage.setItem('aitowords_history', JSON.stringify(data.data));
            } else if (data.type === 'templates') {
                localStorage.setItem('aitowords_custom_templates', JSON.stringify(data.data));
            } else if (data.type === 'settings') {
                Object.entries(data.data).forEach(([key, value]) => {
                    localStorage.setItem(`aitowords_${key}`, JSON.stringify(value));
                });
            } else if (data.type === 'all') {
                localStorage.setItem('aitowords_history', JSON.stringify(data.data.history));
                localStorage.setItem('aitowords_custom_templates', JSON.stringify(data.data.templates));
                Object.entries(data.data.settings).forEach(([key, value]) => {
                    localStorage.setItem(`aitowords_${key}`, JSON.stringify(value));
                });
            }
            
            window.showSuccess?.('数据已导入，请刷新页面');
            
            // 刷新页面
            setTimeout(() => {
                if (confirm('数据已导入，是否刷新页面以应用更改？')) {
                    window.location.reload();
                }
            }, 1000);
            
        } catch (error) {
            window.showError?.('IMPORT', '导入失败：' + error.message);
        }
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
     * 下载 JSON
     */
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * 下载 CSV
     */
    downloadCSV(data, filename) {
        let csv = '';
        
        if (data.type === 'history') {
            csv = 'ID,Date,Filename,WordCount,Preview\n';
            data.data.forEach(item => {
                csv += `${item.id},"${item.timestamp}","${item.filename}",${item.wordCount},"${item.preview.replace(/"/g, '""')}"\n`;
            });
        } else {
            // 其他类型转为 JSON
            csv = JSON.stringify(data, null, 2);
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * 解析 CSV
     */
    parseCSV(content) {
        // 简单 CSV 解析
        // 实际使用中可能需要更复杂的解析器
        return {
            type: 'history',
            data: []
        };
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.dataExporter = new DataExporter();
});
