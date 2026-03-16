/**
 * 新手引导系统
 * 功能：首次访问引导、功能演示、工具提示
 */

class OnboardingManager {
    constructor() {
        this.storageKey = 'aitowords_onboarding';
        this.currentStep = 0;
        this.steps = [
            {
                target: '#markdownInput',
                title: '输入内容',
                content: '在这里粘贴 ChatGPT 或其他 AI 的对话内容',
                position: 'right'
            },
            {
                target: '#preview',
                title: '实时预览',
                content: '右侧会实时显示转换后的 Word 格式',
                position: 'left'
            },
            {
                target: '#exportBtn',
                title: '导出文档',
                content: '点击这里下载转换好的 Word 文档',
                position: 'top'
            }
        ];
        
        this.init();
    }
    
    /**
     * 初始化引导系统
     */
    init() {
        // 检查是否首次访问
        if (this.isFirstVisit()) {
            // 延迟显示欢迎弹窗
            setTimeout(() => this.showWelcomeModal(), 1500);
        }
        
        // 检查是否需要显示引导
        if (this.needsGuidance()) {
            setTimeout(() => this.startGuidance(), 2000);
        }
    }
    
    /**
     * 检查是否首次访问
     */
    isFirstVisit() {
        return !localStorage.getItem(this.storageKey);
    }
    
    /**
     * 检查是否需要引导
     */
    needsGuidance() {
        const data = this.getData();
        return !data || !data.completed;
    }
    
    /**
     * 获取存储数据
     */
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * 保存数据
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save onboarding data:', e);
        }
    }
    
    /**
     * 显示欢迎弹窗
     */
    showWelcomeModal() {
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'welcome-modal';
        modal.innerHTML = `
            <div class="welcome-modal-content">
                <h2>👋 欢迎使用 AiToWords!</h2>
                <p>将 AI 对话完美转换为 Word 文档，保留公式、图表和代码高亮</p>
                
                <ul class="welcome-steps">
                    <li>
                        <span>1</span>
                        <div>粘贴 ChatGPT/DeepSeek/Claude 的对话内容</div>
                    </li>
                    <li>
                        <span>2</span>
                        <div>实时预览 Word 格式效果</div>
                    </li>
                    <li>
                        <span>3</span>
                        <div>一键导出，完美保留所有格式</div>
                    </li>
                </ul>
                
                <div class="welcome-buttons">
                    <button class="welcome-btn-primary" id="startTour">
                        🚀 开始使用
                    </button>
                    <button class="welcome-btn-secondary" id="skipTour">
                        跳过引导
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加动画
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        
        // 绑定事件
        modal.querySelector('#startTour').addEventListener('click', () => {
            this.closeModal(modal);
            this.startGuidance();
        });
        
        modal.querySelector('#skipTour').addEventListener('click', () => {
            this.closeModal(modal);
            this.completeOnboarding();
        });
    }
    
    /**
     * 关闭弹窗
     */
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    /**
     * 开始引导
     */
    startGuidance() {
        this.currentStep = 0;
        this.showStep();
        
        // 自动加载示例
        if (typeof loadExample === 'function') {
            loadExample('basic');
        }
    }
    
    /**
     * 显示当前步骤
     */
    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.completeOnboarding();
            return;
        }
        
        const step = this.steps[this.currentStep];
        const target = document.querySelector(step.target);
        
        if (!target) {
            this.nextStep();
            return;
        }
        
        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.className = 'overlay active';
        document.body.appendChild(overlay);
        
        // 高亮目标元素
        target.classList.add('feature-highlight');
        
        // 创建提示
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${step.position} active`;
        tooltip.innerHTML = `
            <strong>${step.title}</strong><br>
            ${step.content}
            <br><br>
            <button class="tooltip-next-btn">${this.currentStep < this.steps.length - 1 ? '下一步' : '完成'}</button>
        `;
        
        // 定位提示
        const rect = target.getBoundingClientRect();
        switch (step.position) {
            case 'right':
                tooltip.style.top = `${rect.top}px`;
                tooltip.style.left = `${rect.right + 16}px`;
                break;
            case 'left':
                tooltip.style.top = `${rect.top}px`;
                tooltip.style.right = `${window.innerWidth - rect.left + 16}px`;
                break;
            case 'top':
                tooltip.style.bottom = `${window.innerHeight - rect.top + 16}px`;
                tooltip.style.left = `${rect.left}px`;
                break;
        }
        
        document.body.appendChild(tooltip);
        
        // 绑定事件
        tooltip.querySelector('.tooltip-next-btn').addEventListener('click', () => {
            this.nextStep();
            overlay.remove();
            tooltip.remove();
            target.classList.remove('feature-highlight');
        });
        
        // 点击遮罩跳过
        overlay.addEventListener('click', () => {
            this.completeOnboarding();
            overlay.remove();
            tooltip.remove();
            target.classList.remove('feature-highlight');
        });
    }
    
    /**
     * 下一步
     */
    nextStep() {
        this.currentStep++;
        this.showStep();
    }
    
    /**
     * 完成引导
     */
    completeOnboarding() {
        this.saveData({
            completed: true,
            completedAt: new Date().toISOString()
        });
        
        // 显示完成提示
        this.showToast('✅ 引导完成！开始使用吧！', 'success');
    }
    
    /**
     * 显示提示
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .tooltip-next-btn {
        background: white;
        color: #4f46e5;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .tooltip-next-btn:hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.onboardingManager = new OnboardingManager();
});
