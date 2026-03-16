/**
 * AiToWords 用户反馈系统
 * 收集用户意见和评分
 */

class FeedbackSystem {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkFeedbackPrompt();
        this.bindEvents();
    }
    
    /**
     * 检查是否显示反馈提示
     */
    checkFeedbackPrompt() {
        const usageCount = parseInt(localStorage.getItem('aitowords_usage_count') || '0');
        const hasGivenFeedback = localStorage.getItem('aitowords_feedback_given');
        
        // 使用 3 次后显示反馈提示
        if (usageCount >= 3 && !hasGivenFeedback) {
            setTimeout(() => this.showFeedbackPrompt(), 3000);
        }
        
        // 更新使用次数
        localStorage.setItem('aitowords_usage_count', usageCount + 1);
    }
    
    /**
     * 显示反馈提示
     */
    showFeedbackPrompt() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal';
        modal.innerHTML = `
            <div class="feedback-content">
                <button class="feedback-close">&times;</button>
                <h3>喜欢 AiToWords 吗？</h3>
                <p>您的反馈对我们很重要！</p>
                
                <div class="rating-stars">
                    <span class="star" data-rating="1">⭐</span>
                    <span class="star" data-rating="2">⭐</span>
                    <span class="star" data-rating="3">⭐</span>
                    <span class="star" data-rating="4">⭐</span>
                    <span class="star" data-rating="5">⭐</span>
                </div>
                
                <div class="feedback-form" style="display: none;">
                    <textarea placeholder="告诉我们您的建议或问题（可选）" rows="3"></textarea>
                    <button class="btn btn-primary">提交反馈</button>
                </div>
                
                <div class="feedback-actions">
                    <button class="btn btn-secondary" id="skip-feedback">稍后再说</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addFeedbackStyles();
        this.bindFeedbackEvents(modal);
    }
    
    /**
     * 添加样式
     */
    addFeedbackStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .feedback-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .feedback-content {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 400px;
                width: 90%;
                position: relative;
                text-align: center;
            }
            
            .feedback-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
            }
            
            .feedback-content h3 {
                margin: 0 0 8px 0;
                font-size: 20px;
            }
            
            .feedback-content p {
                color: var(--text-secondary);
                margin-bottom: 24px;
            }
            
            .rating-stars {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 24px;
            }
            
            .star {
                font-size: 32px;
                cursor: pointer;
                transition: all 0.2s;
                filter: grayscale(100%);
            }
            
            .star:hover,
            .star.active {
                filter: grayscale(0%);
                transform: scale(1.2);
            }
            
            .feedback-form {
                margin-bottom: 16px;
            }
            
            .feedback-form textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                font-size: 14px;
                resize: vertical;
                margin-bottom: 12px;
            }
            
            .feedback-actions {
                display: flex;
                gap: 12px;
            }
            
            .feedback-actions button {
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 绑定反馈事件
     */
    bindFeedbackEvents(modal) {
        let selectedRating = 0;
        
        // 星星评分
        const stars = modal.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i < selectedRating);
                });
                
                // 显示反馈表单
                modal.querySelector('.feedback-form').style.display = 'block';
            });
        });
        
        // 提交反馈
        modal.querySelector('.feedback-form button').addEventListener('click', () => {
            const feedback = modal.querySelector('textarea').value;
            
            // 发送到 GA
            if (window.gtag) {
                gtag('event', 'user_feedback', {
                    'rating': selectedRating,
                    'feedback': feedback
                });
            }
            
            // 标记已反馈
            localStorage.setItem('aitowords_feedback_given', 'true');
            
            // 显示感谢
            modal.querySelector('.feedback-content').innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">🙏</div>
                <h3>感谢您的反馈！</h3>
                <p>我们会持续改进产品</p>
                <button class="btn btn-primary" onclick="this.closest('.feedback-modal').remove()">
                    关闭
                </button>
            `;
            
            // 3秒后自动关闭
            setTimeout(() => modal.remove(), 3000);
        });
        
        // 跳过
        modal.querySelector('#skip-feedback').addEventListener('click', () => {
            modal.remove();
        });
        
        // 关闭
        modal.querySelector('.feedback-close').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听导出成功事件
        document.addEventListener('export-success', () => {
            this.checkFeedbackPrompt();
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackSystem = new FeedbackSystem();
});
