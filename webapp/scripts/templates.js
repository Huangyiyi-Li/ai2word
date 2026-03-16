/**
 * AiToWords 模板系统
 * 预设模板 + 自定义模板
 */

class TemplateManager {
    constructor() {
        this.templates = this.getDefaultTemplates();
        this.customTemplates = this.loadCustomTemplates();
        this.init();
    }
    
    /**
     * 获取默认模板
     */
    getDefaultTemplates() {
        return {
            // 学术论文模板
            academic: {
                name: '学术论文',
                nameEn: 'Academic Paper',
                icon: '🎓',
                description: '适合学术论文、毕业设计',
                preview: '/templates/academic-preview.png',
                styles: {
                    fontFamily: 'Times New Roman',
                    fontSize: 12,
                    lineHeight: 1.5,
                    margins: {
                        top: 2.54, // 1 inch
                        right: 2.54,
                        bottom: 2.54,
                        left: 3.17 // 1.25 inch
                    },
                    heading1: {
                        fontSize: 16,
                        bold: true,
                        alignment: 'center'
                    },
                    heading2: {
                        fontSize: 14,
                        bold: true
                    },
                    paragraph: {
                        firstLineIndent: 2, // 2 characters
                        alignment: 'justify'
                    },
                    code: {
                        fontFamily: 'Courier New',
                        fontSize: 10,
                        background: '#f5f5f5'
                    }
                }
            },
            
            // 技术报告模板
            technical: {
                name: '技术报告',
                nameEn: 'Technical Report',
                icon: '💻',
                description: '适合技术文档、API 文档',
                preview: '/templates/technical-preview.png',
                styles: {
                    fontFamily: 'Arial',
                    fontSize: 11,
                    lineHeight: 1.6,
                    margins: {
                        top: 2,
                        right: 2,
                        bottom: 2,
                        left: 2
                    },
                    heading1: {
                        fontSize: 18,
                        bold: true,
                        color: '#2563eb'
                    },
                    heading2: {
                        fontSize: 14,
                        bold: true,
                        color: '#1e40af'
                    },
                    code: {
                        fontFamily: 'Fira Code',
                        fontSize: 9,
                        background: '#1e293b',
                        color: '#e2e8f0',
                        lineNumbers: true
                    },
                    blockquote: {
                        borderLeft: '4px solid #3b82f6',
                        background: '#eff6ff',
                        padding: 12
                    }
                }
            },
            
            // 商业报告模板
            business: {
                name: '商业报告',
                nameEn: 'Business Report',
                icon: '📊',
                description: '适合商业分析、市场报告',
                preview: '/templates/business-preview.png',
                styles: {
                    fontFamily: 'Calibri',
                    fontSize: 11,
                    lineHeight: 1.4,
                    margins: {
                        top: 2.5,
                        right: 2.5,
                        bottom: 2.5,
                        left: 2.5
                    },
                    heading1: {
                        fontSize: 20,
                        bold: true,
                        color: '#059669'
                    },
                    heading2: {
                        fontSize: 16,
                        bold: true,
                        color: '#047857'
                    },
                    table: {
                        headerBg: '#d1fae5',
                        borderStyle: 'solid',
                        borderColor: '#6ee7b7'
                    },
                    chart: {
                        defaultWidth: 500,
                        defaultHeight: 300
                    }
                }
            },
            
            // 简历模板
            resume: {
                name: '个人简历',
                nameEn: 'Resume',
                icon: '📄',
                description: '适合求职简历、个人简介',
                preview: '/templates/resume-preview.png',
                styles: {
                    fontFamily: 'Helvetica',
                    fontSize: 10,
                    lineHeight: 1.3,
                    margins: {
                        top: 1.5,
                        right: 2,
                        bottom: 1.5,
                        left: 2
                    },
                    heading1: {
                        fontSize: 24,
                        bold: true,
                        alignment: 'center'
                    },
                    heading2: {
                        fontSize: 12,
                        bold: true,
                        borderBottom: '2px solid #4f46e5'
                    },
                    paragraph: {
                        firstLineIndent: 0
                    }
                }
            },
            
            // 读书笔记模板
            notes: {
                name: '读书笔记',
                nameEn: 'Reading Notes',
                icon: '📚',
                description: '适合读书笔记、学习笔记',
                preview: '/templates/notes-preview.png',
                styles: {
                    fontFamily: 'Georgia',
                    fontSize: 11,
                    lineHeight: 1.8,
                    margins: {
                        top: 3,
                        right: 2.5,
                        bottom: 3,
                        left: 2.5
                    },
                    heading1: {
                        fontSize: 18,
                        bold: true,
                        color: '#7c3aed'
                    },
                    heading2: {
                        fontSize: 14,
                        bold: true,
                        color: '#6d28d9'
                    },
                    blockquote: {
                        borderLeft: '4px solid #a78bfa',
                        background: '#f5f3ff',
                        italic: true
                    }
                }
            },
            
            // 通用模板
            general: {
                name: '通用文档',
                nameEn: 'General Document',
                icon: '📝',
                description: '适合一般文档、聊天记录',
                preview: '/templates/general-preview.png',
                styles: {
                    fontFamily: 'Arial',
                    fontSize: 11,
                    lineHeight: 1.6,
                    margins: {
                        top: 2.5,
                        right: 2.5,
                        bottom: 2.5,
                        left: 2.5
                    },
                    heading1: {
                        fontSize: 16,
                        bold: true
                    },
                    heading2: {
                        fontSize: 14,
                        bold: true
                    }
                }
            }
        };
    }
    
    /**
     * 加载自定义模板
     */
    loadCustomTemplates() {
        try {
            const saved = localStorage.getItem('aitowords_custom_templates');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }
    
    /**
     * 保存自定义模板
     */
    saveCustomTemplates() {
        try {
            localStorage.setItem('aitowords_custom_templates', JSON.stringify(this.customTemplates));
        } catch (e) {
            console.error('Failed to save custom templates:', e);
        }
    }
    
    /**
     * 初始化
     */
    init() {
        this.renderTemplateSelector();
        this.bindEvents();
    }
    
    /**
     * 渲染模板选择器
     */
    renderTemplateSelector() {
        const container = document.getElementById('template-selector');
        if (!container) return;
        
        // 默认模板
        let html = '<h3>预设模板</h3><div class="template-grid">';
        
        for (const [key, template] of Object.entries(this.templates)) {
            html += `
                <div class="template-card" data-template="${key}">
                    <div class="template-icon">${template.icon}</div>
                    <div class="template-name">${template.name}</div>
                    <div class="template-desc">${template.description}</div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // 自定义模板
        if (Object.keys(this.customTemplates).length > 0) {
            html += '<h3>自定义模板</h3><div class="template-grid">';
            
            for (const [key, template] of Object.entries(this.customTemplates)) {
                html += `
                    <div class="template-card custom-template" data-template="${key}">
                        <div class="template-icon">🎨</div>
                        <div class="template-name">${template.name}</div>
                        <div class="template-actions">
                            <button class="template-edit-btn" data-template="${key}">✏️</button>
                            <button class="template-delete-btn" data-template="${key}">🗑️</button>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        // 添加模板按钮
        html += `
            <button id="add-template-btn" class="btn btn-secondary">
                ➕ 添加自定义模板
            </button>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 模板选择
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.template-actions')) return;
                
                const templateKey = card.dataset.template;
                const isCustom = card.classList.contains('custom-template');
                this.applyTemplate(templateKey, isCustom);
            });
        });
        
        // 编辑自定义模板
        document.querySelectorAll('.template-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateKey = btn.dataset.template;
                this.editCustomTemplate(templateKey);
            });
        });
        
        // 删除自定义模板
        document.querySelectorAll('.template-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateKey = btn.dataset.template;
                this.deleteCustomTemplate(templateKey);
            });
        });
        
        // 添加自定义模板
        const addBtn = document.getElementById('add-template-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showTemplateEditor());
        }
    }
    
    /**
     * 应用模板
     */
    applyTemplate(templateKey, isCustom = false) {
        const template = isCustom ? this.customTemplates[templateKey] : this.templates[templateKey];
        
        if (!template) {
            console.error('Template not found:', templateKey);
            return;
        }
        
        // 保存当前选择的模板
        localStorage.setItem('aitowords_current_template', JSON.stringify({
            key: templateKey,
            isCustom: isCustom
        }));
        
        // 应用模板样式到转换器
        if (window.converter) {
            window.converter.setStyles(template.styles);
        }
        
        // 更新 UI
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-template="${templateKey}"]`)?.classList.add('active');
        
        // 显示成功提示
        window.showSuccess?.(`已应用模板: ${template.name}`);
    }
    
    /**
     * 显示模板编辑器
     */
    showTemplateEditor(templateKey = null) {
        const template = templateKey ? this.customTemplates[templateKey] : null;
        
        // 创建编辑器弹窗
        const modal = document.createElement('div');
        modal.className = 'template-editor-modal';
        modal.innerHTML = `
            <div class="template-editor-content">
                <h2>${template ? '编辑模板' : '创建自定义模板'}</h2>
                
                <div class="form-group">
                    <label>模板名称</label>
                    <input type="text" id="template-name" value="${template?.name || ''}" placeholder="输入模板名称">
                </div>
                
                <div class="form-group">
                    <label>字体</label>
                    <select id="template-font">
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Calibri">Calibri</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Helvetica">Helvetica</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>字号</label>
                        <input type="number" id="template-fontsize" value="${template?.styles?.fontSize || 11}" min="8" max="24">
                    </div>
                    <div class="form-group">
                        <label>行距</label>
                        <input type="number" id="template-lineheight" value="${template?.styles?.lineHeight || 1.6}" step="0.1" min="1" max="3">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>页边距</label>
                    <div class="form-row">
                        <input type="number" id="template-margin-top" placeholder="上" value="${template?.styles?.margins?.top || 2.5}" step="0.1">
                        <input type="number" id="template-margin-right" placeholder="右" value="${template?.styles?.margins?.right || 2.5}" step="0.1">
                        <input type="number" id="template-margin-bottom" placeholder="下" value="${template?.styles?.margins?.bottom || 2.5}" step="0.1">
                        <input type="number" id="template-margin-left" placeholder="左" value="${template?.styles?.margins?.left || 2.5}" step="0.1">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-secondary" id="cancel-template">取消</button>
                    <button class="btn btn-primary" id="save-template">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('#cancel-template').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#save-template').addEventListener('click', () => {
            const name = document.getElementById('template-name').value;
            if (!name) {
                alert('请输入模板名称');
                return;
            }
            
            const newTemplate = {
                name: name,
                icon: '🎨',
                description: '自定义模板',
                styles: {
                    fontFamily: document.getElementById('template-font').value,
                    fontSize: parseInt(document.getElementById('template-fontsize').value),
                    lineHeight: parseFloat(document.getElementById('template-lineheight').value),
                    margins: {
                        top: parseFloat(document.getElementById('template-margin-top').value),
                        right: parseFloat(document.getElementById('template-margin-right').value),
                        bottom: parseFloat(document.getElementById('template-margin-bottom').value),
                        left: parseFloat(document.getElementById('template-margin-left').value)
                    }
                }
            };
            
            if (templateKey) {
                this.customTemplates[templateKey] = newTemplate;
            } else {
                const key = 'custom_' + Date.now();
                this.customTemplates[key] = newTemplate;
            }
            
            this.saveCustomTemplates();
            this.renderTemplateSelector();
            modal.remove();
            
            window.showSuccess?.('模板已保存');
        });
    }
    
    /**
     * 编辑自定义模板
     */
    editCustomTemplate(templateKey) {
        this.showTemplateEditor(templateKey);
    }
    
    /**
     * 删除自定义模板
     */
    deleteCustomTemplate(templateKey) {
        if (confirm('确定要删除这个模板吗？')) {
            delete this.customTemplates[templateKey];
            this.saveCustomTemplates();
            this.renderTemplateSelector();
            
            window.showSuccess?.('模板已删除');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.templateManager = new TemplateManager();
});
