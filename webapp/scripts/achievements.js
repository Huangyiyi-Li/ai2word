/**
 * AiToWords 本地成就系统
 * 无需后端， */

class AchievementSystem {
    constructor() {
        this.achievements = this.getAchievements();
        this.init();
    }
    
    /**
     * 获取成就定义
     */
    getAchievements() {
        return {
            firstExport: {
                id: 'first_export',
                name: '🎉 鬼斩初体验',
                description: '完成第一次导出',
                icon: '🎖️',
                condition: (stats) => stats.totalExports >= 1,
                points: 10
            },
            export10: {
                id: 'export_10',
                name: '🥉 转换达人',
                description: '累计导出 10 次',
                icon: '⭐',
                condition: (stats) => stats.totalExports >= 10,
                points: 20
            },
            export50: {
                id: 'export_50',
                name: '🌟 转换大师',
                description: '累计导出 50 次',
                icon: '🏆',
                condition: (stats) => stats.totalExports >= 50,
                points: 50
            },
            export100: {
                id: 'export_100',
                name: '💎 传奇人物',
                description: '累计导出 100 次',
                icon: '👑',
                condition: (stats) => stats.totalExports >= 100,
                points: 100
            },
            useAllTemplates: {
                id: 'use_all_templates',
                name: '🎨 模板收藏家',
                description: '使用所有 6 个预设模板',
                icon: '🎨',
                condition: (stats) => stats.usedTemplates && stats.usedTemplates.length >= 6,
                points: 30
            },
            batchExport: {
                id: 'batch_export',
                name: '⚡ 批量处理专家',
                description: '使用批量处理功能',
                icon: '⚡',
                condition: (stats) => stats.batchExports >= 1,
                points: 15
            },
            shareSuccess: {
                id: 'share_success',
                name: '📢 传播大使',
                description: '成功分享 1 次',
                icon: '📣',
                condition: (stats) => stats.shares >= 1,
                points: 25
            },
            weekUser: {
                id: 'week_user',
                name: '🗓️ 周活用户',
                description: '连续使用 7 天',
                icon: '📅',
                condition: (stats) => stats.daysUsed >= 7,
                points: 50
            },
            monthUser: {
                id: 'month_user',
                name: '🏅 月度之星',
                description: '连续使用 30 天',
                icon: '🌟',
                condition: (stats) => stats.daysUsed >= 30,
                points: 100
            }
        };
    }
    
    /**
     * 初始化
     */
    init() {
        this.loadStats();
        this.checkAchievements();
        this.renderUI();
    }
    
    /**
     * 加载统计数据
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('aitowords_stats');
            this.stats = saved ? JSON.parse(saved) : {
                totalExports: 0,
                usedTemplates: [],
                batchExports: 0,
                shares: 0,
                daysUsed: 0,
                firstUseDate: new Date().toDateString(),
                lastUseDate: new Date().toDateString(),
                unlockedAchievements: []
            };
            
            // 更新最后使用日期
            const today = new Date().toDateString();
            if (this.stats.lastUseDate !== today) {
                this.stats.lastUseDate = today;
                
                // 计算连续使用天数
                const firstDate = new Date(this.stats.firstUseDate);
                const todayDate = new Date(today);
                const daysUsed = Math.floor((todayDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
                this.stats.daysUsed = daysUsed;
                
                this.saveStats();
            }
        } catch (error) {
                console.error('Failed to load stats:', error);
                this.stats = {
                    totalExports: 0,
                    usedTemplates: [],
                    batchExports: 0,
                    shares: 0,
                    daysUsed: 0,
                    firstUseDate: new Date().toDateString(),
                    lastUseDate: new Date().toDateString(),
                    unlockedAchievements: []
            };
        }
    }
    
    /**
     * 保存统计数据
     */
    saveStats() {
        try {
            localStorage.setItem('aitowords_stats', JSON.stringify(this.stats));
        } catch (error) {
                console.error('Failed to save stats:', error);
            }
    }
    
    /**
     * 检查成就
     */
    checkAchievements() {
        let newUnlocked = false;
        
        for (const [key, achievement] of Object.entries(this.achievements)) {
            if (!this.stats.unlockedAchievements.includes(key)) {
                if (achievement.condition(this.stats)) {
                    this.unlockAchievement(key, achievement);
                    newUnlocked = true;
                }
            }
        }
        
        return newUnlocked;
    }
    
    /**
     * 解锁成就
     */
    unlockAchievement(key, achievement) {
        this.stats.unlockedAchievements.push(key);
        this.saveStats();
        
        // 显示通知
        this.showAchievementNotification(achievement);
        
        // GA 追踪
        if (window.gtag) {
            gtag('event', 'unlock_achievement', {
                'achievement_id': key,
                'achievement_name': achievement.name
            });
        }
    }
    
    /**
     * 显示成就通知
     */
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>🏆 成就解锁！</h4>
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                    <p class="achievement-points">+${achievement.points} 积分</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后移除
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        this.addStyles();
    }
    
    /**
     * 记录导出
     */
    recordExport(templateName) {
        this.stats.totalExports++;
        
        if (templateName && !this.stats.usedTemplates.includes(templateName)) {
            this.stats.usedTemplates.push(templateName);
        }
        
        this.saveStats();
        this.checkAchievements();
    }
    
    /**
     * 记录批量导出
     */
    recordBatchExport(count) {
        this.stats.batchExports = (this.stats.batchExports || 0) + 1;
        this.saveStats();
        this.checkAchievements();
    }
    
    /**
     * 记录分享
     */
    recordShare() {
        this.stats.shares++;
        this.saveStats();
        this.checkAchievements();
    }
    
    /**
     * 渲染 UI
     */
    renderUI() {
        const container = document.createElement('div');
        container.id = 'achievement-panel';
        container.innerHTML = `
            <div class="achievement-header">
                <h3>🏆 成就系统</h3>
                <p class="achievement-summary">
                    已解锁 ${this.stats.unlockedAchievements.length}/${Object.keys(this.achievements).length} | 
                    积分: ${this.getTotalPoints()}
                </p>
            </div>
            <div class="achievement-list">
                ${this.renderAchievementList()}
            </div>
        `;
        
        // 插入到页面
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.appendChild(container);
        }
        
        this.addStyles();
    }
    
    /**
     * 渲染成就列表
     */
    renderAchievementList() {
        let html = '';
        
        for (const [key, achievement] of Object.entries(this.achievements)) {
            const unlocked = this.stats.unlockedAchievements.includes(key);
            const className = unlocked ? 'achievement-item unlocked' : 'achievement-item locked';
            
            html += `
                <div class="${className}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                        <p class="achievement-points">+${achievement.points} 积分</p>
                    </div>
                    ${unlocked ? '<span class="unlocked-badge">✓</span>' : ''}
                </div>
            `;
        }
        
        return html;
    }
    
    /**
     * 获取总积分
     */
    getTotalPoints() {
        return this.stats.unlockedAchievements.reduce((total, key) => {
            return total + (this.achievements[key]?.points || 0);
        }, 0);
    }
    
    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('achievement-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'achievement-styles';
        style.textContent = `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .fade-out {
                opacity: 0;
                transform: translateX(100%);
            }
            
            .achievement-content {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .achievement-icon {
                font-size: 48px;
            }
            
            .achievement-info h4 {
                margin: 0;
                font-size: 14px;
                opacity: 0.9;
            }
            
            .achievement-info h3 {
                margin: 4px 0;
                font-size: 18px;
            }
            
            .achievement-info p {
                margin: 4px 0;
                font-size: 13px;
                opacity: 0.8;
            }
            
            .achievement-points {
                font-weight: bold;
                color: #ffd700;
            }
            
            #achievement-panel {
                margin-top: 24px;
                padding: 16px;
                background: white;
                border-radius: 8px;
            }
            
            .achievement-header {
                margin-bottom: 16px;
            }
            
            .achievement-header h3 {
                margin: 0 0 8px 0;
            }
            
            .achievement-summary {
                color: var(--text-secondary);
                font-size: 13px;
                margin: 0;
            }
            
            .achievement-list {
                display: grid;
                gap: 8px;
            }
            
            .achievement-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            
            .achievement-item.unlocked {
                background: #f0fdf4;
                border-color: #10b981;
            }
            
            .achievement-item.locked {
                opacity: 0.5;
            }
            
            .achievement-item .achievement-icon {
                font-size: 32px;
            }
            
            .achievement-item .achievement-info h4 {
                margin: 0;
                font-size: 14px;
            }
            
            .achievement-item .achievement-info p {
                margin: 2px 0 0 0;
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .unlocked-badge {
                margin-left: auto;
                color: #10b981;
                font-size: 20px;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.achievementSystem = new AchievementSystem();
});
