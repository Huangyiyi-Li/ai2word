/**
 * AiToWords 性能优化器
 * 代码压缩、懒加载、缓存优化
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = {};
        this.init();
    }
    
    init() {
        this.measurePerformance();
        this.optimizeImages();
        this.enableLazyLoading();
        this.setupCache();
    }
    
    /**
     * 测量性能
     */
    measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    
                    this.metrics = {
                        // DNS 查询时间
                        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
                        // TCP 连接时间
                        tcp: perfData.connectEnd - perfData.connectStart,
                        // 请求响应时间
                        request: perfData.responseEnd - perfData.requestStart,
                        // DOM 解析时间
                        domParse: perfData.domInteractive - perfData.responseEnd,
                        // 资源加载时间
                        resourceLoad: perfData.loadEventStart - perfData.domContentLoadedEventEnd,
                        // 总加载时间
                        total: perfData.loadEventEnd - perfData.fetchStart
                    };
                    
                    console.log('性能指标:', this.metrics);
                    this.sendToAnalytics();
                }, 0);
            });
        }
    }
    
    /**
     * 发送到分析平台
     */
    sendToAnalytics() {
        if (window.gtag && this.metrics.total) {
            gtag('event', 'performance_metrics', {
                'dns_time': Math.round(this.metrics.dns),
                'tcp_time': Math.round(this.metrics.tcp),
                'request_time': Math.round(this.metrics.request),
                'dom_parse_time': Math.round(this.metrics.domParse),
                'total_load_time': Math.round(this.metrics.total)
            });
        }
    }
    
    /**
     * 图片优化
     */
    optimizeImages() {
        // 使用 Intersection Observer 懒加载图片
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px'
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // 回退方案
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
    
    /**
     * 启用懒加载
     */
    enableLazyLoading() {
        // 延迟加载非关键脚本
        const scripts = document.querySelectorAll('script[data-lazy]');
        
        scripts.forEach(script => {
            const lazyScript = document.createElement('script');
            lazyScript.src = script.dataset.src;
            lazyScript.async = true;
            
            // 页面加载完成后加载
            window.addEventListener('load', () => {
                setTimeout(() => {
                    document.body.appendChild(lazyScript);
                }, 2000);
            });
        });
    }
    
    /**
     * 设置缓存
     */
    setupCache() {
        // 缓存常用数据
        const cacheConfig = {
            templates: 3600000, // 1小时
            history: 1800000,   // 30分钟
            settings: 86400000  // 24小时
        };
        
        Object.entries(cacheConfig).forEach(([key, ttl]) => {
            const cached = localStorage.getItem(`cache_${key}`);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp > ttl) {
                    localStorage.removeItem(`cache_${key}`);
                }
            }
        });
    }
    
    /**
     * 预加载资源
     */
    preloadResources() {
        // 预加载关键字体
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.as = 'font';
        fontLink.type = 'font/woff2';
        fontLink.crossOrigin = 'anonymous';
        fontLink.href = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
        document.head.appendChild(fontLink);
    }
    
    /**
     * 防抖函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// 导出工具函数
window.debounce = PerformanceOptimizer.debounce;
window.throttle = PerformanceOptimizer.throttle;
