const i18nData = {
    zh: {
        title: "AiToWords - AI对话导出",
        heroTitle: "Markdown 转 Word",
        heroDesc: "免费在线转换工具，支持 LaTeX 公式、Mermaid 图表、代码高亮。纯浏览器处理，无需上传。",
        featLatex: "LaTeX 公式",
        featMermaid: "Mermaid 图表",
        featCode: "代码高亮",
        featPrivacy: "隐私安全",
        tabEditor: "编辑器",
        clearBtn: "清空",
        exportBtn: "⬇️ 导出 Word",
        inputHeader: "Markdown 输入",
        previewHeader: "预览",
        placeholder: "在此输入或粘贴 Markdown 内容...\n\n支持拖拽 .md 文件到此处",
        previewHint: "输入内容后将在此显示预览...",
        footerText: "AiToWords - 免费开源的 Markdown 转 Word 工具",
        installExt: "🔌 安装插件",
        examples: "示例",
        backToList: "返回列表",
        manualInputTitle: "手动输入",
        manualPlaceholder: "粘贴 Markdown 内容...",
        selectAll: "全选",
        selectAssistant: "仅AI回复",
        selectedCount: "已选: {count}",
        emptyState: "打开任意 AI 对话页面",
        emptyHint: "支持 ChatGPT、Claude、DeepSeek、通义千问、文心一言、Kimi",
        waitingStatus: "等待检测AI平台...",
        manualExportBtn: "导出 Word",
        faqTitle: "常见问题",
        faqQ1: "这需要收费吗？",
        faqA1: "完全免费。AiToWords 是一个开源项目，您可以免费使用所有功能。",
        faqQ2: "数据安全吗？",
        faqA2: "绝对安全。所有转换过程都在您的浏览器本地完成，不会将任何数据上传到服务器。",
        faqQ3: "支持哪些 AI 平台？",
        faqA3: "理论上支持所有 AI 平台的 Markdown 内容。我们专门优化了 ChatGPT、DeepSeek、Claude 和 Gemini 的导出效果。"
    },
    en: {
        title: "AiToWords - AI to Word Export",
        heroTitle: "Markdown to Word",
        heroDesc: "Free online converter supporting LaTeX math, Mermaid charts, and code highlighting. Browser-only processing, privacy first.",
        featLatex: "LaTeX Math",
        featMermaid: "Mermaid Charts",
        featCode: "Code Highlight",
        featPrivacy: "Privacy First",
        tabEditor: "Editor",
        clearBtn: "Clear",
        exportBtn: "⬇️ Export Word",
        inputHeader: "Markdown Input",
        previewHeader: "Preview",
        placeholder: "Type or paste Markdown here...\n\nDrag & drop .md files supported",
        previewHint: "Preview will appear here...",
        footerText: "AiToWords - Free & Open Source Markdown to Word Tool",
        installExt: "🔌 Install Extension",
        examples: "Examples",
        backToList: "Back",
        manualInputTitle: "Manual Input",
        manualPlaceholder: "Paste Markdown content...",
        selectAll: "Select All",
        selectAssistant: "AI Only",
        selectedCount: "Selected: {count}",
        emptyState: "Open any AI Chat Page",
        emptyHint: "Supports ChatGPT, Claude, DeepSeek, Qwen, Ernie Bot, Kimi",
        waitingStatus: "Waiting for AI platform...",
        manualExportBtn: "Export Word",
        faqTitle: "FAQ",
        faqQ1: "Is it free?",
        faqA1: "Completely free. AiToWords is an open-source project.",
        faqQ2: "Is my data safe?",
        faqA2: "Absolutely safe. All processing happens locally in your browser. No data is uploaded.",
        faqQ3: "Which AI platforms are supported?",
        faqA3: "Theoretically supports all Markdown content. Optimized for ChatGPT, DeepSeek, Claude, and Gemini."
    }
};

class I18nManager {
    constructor() {
        this.lang = localStorage.getItem('aitowords_lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
        this.isReady = false;
        // 延迟更新，确保 DOM 已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updatePage();
                this.isReady = true;
            });
        } else {
            this.updatePage();
            this.isReady = true;
        }
    }

    setLang(lang) {
        this.lang = lang;
        localStorage.setItem('aitowords_lang', lang);
        this.updatePage();
        // 触发自定义事件，通知其他组件语言已切换
        window.dispatchEvent(new CustomEvent('languageChange', { detail: { lang: this.lang } }));
    }

    toggle() {
        this.setLang(this.lang === 'zh' ? 'en' : 'zh');
    }

    getText(key, params = {}) {
        if (!i18nData[this.lang] || !i18nData[this.lang][key]) {
            console.warn(`[i18n] Missing translation for key: ${key} in lang: ${this.lang}`);
            return key;
        }
        let text = i18nData[this.lang][key];
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
        return text;
    }

    updatePage() {
        document.documentElement.lang = this.lang === 'zh' ? 'zh-CN' : 'en';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.getText(key);
            if (translation && translation !== key) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Update specific elements that might request dynamic text
        const countEl = document.getElementById('selectedCount');
        if (countEl && countEl.dataset.count) {
            countEl.textContent = this.getText('selectedCount', { count: countEl.dataset.count });
        }
    }
}

// Auto-init if running in browser environment
if (typeof window !== 'undefined') {
    window.i18n = new I18nManager();
}
