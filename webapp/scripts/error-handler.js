/**
 * AiToWords 错误处理系统
 * 友好的错误提示 + 一键重试 + 自动恢复
 */

class ErrorHandler {
    constructor() {
        this.errorTypes = {
            NETWORK: {
                title: '网络错误',
                icon: '🌐',
                color: '#ef4444',
                solutions: ['检查网络连接', '稍后重试', '使用离线模式']
            },
            FORMAT: {
                title: '格式错误',
                icon: '📝',
                color: '#f59e0b',
                solutions: ['检查 Markdown 语法', '查看格式指南', '使用示例内容']
            },
            EXPORT: {
                title: '导出失败',
                icon: '📄',
                color: '#ef4444',
                solutions: ['检查浏览器权限', '关闭广告拦截器', '重新尝试']
            },
            PARSE: {
                title: '解析错误',
                icon: '⚙️',
                color: '#ef4444',
                solutions: ['简化复杂格式', '分段处理', '联系支持']
            },
            UNKNOWN: {
                title: '未知错误',
                icon: '❓',
                color: '#6b7280',
                solutions: ['刷新页面', '清除缓存', '联系支持']
            }
        };
        
        this.init();
    }
    
    init() {
        // 全局错误捕获
        window.addEventListener('error', (e) => {
            console.error('Global error:', e);
            this.handleError('UNKNOWN', e.message);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e);
            this.handleError('NETWORK', e.reason?.message || '异步操作失败');
        });
    }
    
    /**
     * 处理错误
     */
    handleError(type, message, options = {}) {
        const errorType = this.errorTypes[type] || this.errorTypes.UNKNOWN;
        
        console.error(`[${errorType.title}]`, message);
        
        // 显示错误提示
        this.showErrorToast(errorType, message, options);
        
        // 记录错误（可上报）
        this.logError(type, message, options);
        
        // 尝试自动恢复
        if (options.autoRecover !== false) {
            this.attemptRecovery(type, options);
        }
    }
    
    /**
     * 显示错误提示
     */
    showErrorToast(errorType, message, options) {
        // 移除旧提示
        const existingToast = document.querySelector('.error-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="error-toast-content">
                <div class="error-toast-header">
                    <span class="error-toast-icon">${errorType.icon}</span>
                    <span class="error-toast-title">${errorType.title}</span>
                    <button class="error-toast-close" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
                </div>
                <div class="error-toast-body">
                    <p class="error-toast-message">${message}</p>
                    <div class="error-toast-solutions">
                        <strong>解决建议：</strong>
                        <ul>
                            ${errorType.solutions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="error-toast-actions">
                    ${options.onRetry ? '<button class="error-toast-btn retry-btn">🔄 重试</button>' : ''}
                    ${options.onHelp ? '<button class="error-toast-btn help-btn">❓ 帮助</button>' : ''}
                    <button class="error-toast-btn dismiss-btn">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 绑定事件
        const retryBtn = toast.querySelector('.retry-btn');
        if (retryBtn && options.onRetry) {
            retryBtn.addEventListener('click', () => {
                toast.remove();
                options.onRetry();
            });
        }
        
        const helpBtn = toast.querySelector('.help-btn');
        if (helpBtn && options.onHelp) {
            helpBtn.addEventListener('click', () => {
                options.onHelp();
            });
        }
        
        toast.querySelector('.dismiss-btn').addEventListener('click', () => {
            toast.remove();
        });
        
        // 自动关闭（30秒）
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 30000);
    }
    
    /**
     * 记录错误
     */
    logError(type, message, options) {
        const errorLog = {
            type,
            message,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            options
        };
        
        // 存储到本地（最近 10 条）
        try {
            const logs = JSON.parse(localStorage.getItem('aitowords_error_log') || '[]');
            logs.unshift(errorLog);
            if (logs.length > 10) logs.pop();
            localStorage.setItem('aitowords_error_log', JSON.stringify(logs));
        } catch (e) {
            console.error('Failed to log error:', e);
        }
        
        // 可选：上报到服务器
        // this.reportError(errorLog);
    }
    
    /**
     * 尝试自动恢复
     */
    attemptRecovery(type, options) {
        switch (type) {
            case 'NETWORK':
                // 自动重试（最多 3 次）
                if (options.retryCount < 3) {
                    setTimeout(() => {
                        if (options.onRetry) {
                            options.onRetry();
                        }
                    }, 2000);
                }
                break;
                
            case 'EXPORT':
                // 尝试使用备用导出方法
                console.log('Attempting fallback export method...');
                break;
        }
    }
    
    /**
     * 显示成功提示
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="success-toast-content">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    /**
     * 显示警告提示
     */
    showWarning(message) {
        const toast = document.createElement('div');
        toast.className = 'warning-toast';
        toast.innerHTML = `
            <div class="warning-toast-content">
                <span>⚠️</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .error-toast,
    .success-toast,
    .warning-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10002;
        animation: slideInRight 0.3s ease;
    }
    
    .error-toast-content {
        background: #fee2e2;
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 16px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .error-toast-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }
    
    .error-toast-icon {
        font-size: 20px;
    }
    
    .error-toast-title {
        font-weight: 600;
        color: #dc2626;
        flex: 1;
    }
    
    .error-toast-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 18px;
        color: #991b1b;
    }
    
    .error-toast-body {
        margin-bottom: 12px;
    }
    
    .error-toast-message {
        color: #7f1d1d;
        margin-bottom: 8px;
    }
    
    .error-toast-solutions {
        font-size: 14px;
        color: #991b1b;
    }
    
    .error-toast-solutions ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
    }
    
    .error-toast-actions {
        display: flex;
        gap: 8px;
    }
    
    .error-toast-btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .retry-btn {
        background: #dc2626;
        color: white;
    }
    
    .retry-btn:hover {
        background: #b91c1c;
    }
    
    .help-btn {
        background: white;
        color: #dc2626;
        border: 1px solid #dc2626;
    }
    
    .dismiss-btn {
        background: transparent;
        color: #991b1b;
    }
    
    .success-toast-content {
        background: #d1fae5;
        border: 1px solid #10b981;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #047857;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .warning-toast-content {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b45309;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);

// 初始化
window.errorHandler = new ErrorHandler();

// 便捷方法
window.showError = (type, message, options) => window.errorHandler.handleError(type, message, options);
window.showSuccess = (message) => window.errorHandler.showSuccess(message);
window.showWarning = (message) => window.errorHandler.showWarning(message);
