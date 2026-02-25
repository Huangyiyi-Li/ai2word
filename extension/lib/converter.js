// MD2Word - 增强版 Markdown 转 Word 核心转换逻辑
console.log('%c[MD2Word] Converter v2.0 - Latex Fixes Loaded', 'background: #222; color: #bada55');
// 支持: Markdown, LaTeX公式(可编辑OMML), Mermaid图表(图片), 代码块, 表格, 任务列表等
// 转换流程: LaTeX → MathML (Temml) → OMML (XSLTProcessor+MML2OMML.xsl) → Word (JSZip)

// ============== 全局变量 ==============
let xslStylesheet = null;  // 缓存XSL样式表
let mathCounter = 0;       // 公式计数器

// ============== 个性化设置系统 ==============
const DEFAULT_SETTINGS = {
    preserveHeadingStyle: true,   // 是否在 Word 中保留 Markdown 标题样式（粗体/斜体等）
    preserveItalic: true,         // 是否保留斜体格式
    preserveBold: true,           // 是否保留粗体格式
    removeExtraSpaces: false,     // 是否去除标点符号前的多余空格
    blockquoteItalic: true,       // 引用块是否使用斜体
    blockquoteColor: '666666'     // 引用块文字颜色（空字符串表示使用默认颜色）
};

function getConvertSettings() {
    // 优先从全局变量读取（插件侧边栏和 webapp 均可设置）
    if (window._convertSettings) {
        return { ...DEFAULT_SETTINGS, ...window._convertSettings };
    }
    // 其次从 localStorage 读取
    try {
        const stored = localStorage.getItem('aitowords_settings');
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('[MD2Word] 读取设置失败:', e);
    }
    return { ...DEFAULT_SETTINGS };
}

function saveConvertSettings(settings) {
    window._convertSettings = { ...DEFAULT_SETTINGS, ...settings };
    try {
        localStorage.setItem('aitowords_settings', JSON.stringify(window._convertSettings));
    } catch (e) {
        console.warn('[MD2Word] 保存设置失败:', e);
    }
}

// 去除中文/英文标点符号前的多余空格
function cleanExtraSpaces(text) {
    // 匹配中文标点前的空格: " ，"  " 。"  " ："  " ；"  " ！"  " ？"  " 、" 等
    let cleaned = text.replace(/\s+([，。：；！？、）》」』】〉〗〕\)\]\}>])/g, '$1');
    // 匹配英文标点前的空格（仅紧邻的）: " ,"  " ."  " ;"  " :" 等
    cleaned = cleaned.replace(/\s+([,\.;:!?])(?=\s|$|[^a-zA-Z0-9])/g, '$1');
    return cleaned;
}

// 导出设置函数供全局使用
window.getConvertSettings = getConvertSettings;
window.saveConvertSettings = saveConvertSettings;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;

// ============== LaTeX公式处理 ==============

// 修复不完整的LaTeX（如缺少\begin{cases}等）
function fixIncompleteLatex(latex) {
    let fixed = latex;

    // 定义需要修复的环境列表
    const environments = ['cases', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix', 'align', 'aligned', 'array', 'gathered'];

    for (const env of environments) {
        const endPattern = new RegExp(`\\\\end\\{${env}\\}`, 'g');
        const beginPattern = new RegExp(`\\\\begin\\{${env}\\}`, 'g');

        const endMatches = (fixed.match(endPattern) || []).length;
        const beginMatches = (fixed.match(beginPattern) || []).length;

        // 如果有\end{env}但缺少对应的\begin{env}，在开头添加
        if (endMatches > beginMatches) {
            const missingCount = endMatches - beginMatches;
            for (let i = 0; i < missingCount; i++) {
                fixed = `\\begin{${env}} ` + fixed;
                console.log(`[MD2Word] 自动修复: 添加 \\begin{${env}}`);
            }
        }
        // 如果有\begin{env}但缺少对应的\end{env}，在末尾添加
        else if (beginMatches > endMatches) {
            const missingCount = beginMatches - endMatches;
            for (let i = 0; i < missingCount; i++) {
                fixed = fixed + ` \\end{${env}}`;
                console.log(`[MD2Word] 自动修复: 添加 \\end{${env}}`);
            }
        }
    }

    return fixed;
}

// 使用Temml将LaTeX转换为MathML
function latexToMathML(latex) {
    console.log('[MD2Word] latexToMathML 开始, LaTeX:', latex.substring(0, 50) + '...');
    if (!window.temml) {
        console.error('[MD2Word] ❌ Temml库未加载! window.temml =', window.temml);
        return null;
    }
    console.log('[MD2Word] ✓ Temml库已加载');

    // 首先尝试修复不完整的LaTeX
    const fixedLatex = fixIncompleteLatex(latex);
    if (fixedLatex !== latex) {
        console.log('[MD2Word] LaTeX已修复:', fixedLatex.substring(0, 80) + '...');
    }

    try {
        // Temml渲染LaTeX为MathML
        const mathml = temml.renderToString(fixedLatex, {
            xml: true,           // 输出XML格式
            displayMode: fixedLatex.includes('\\begin') || fixedLatex.includes('\\frac'), // 块级模式
            throwOnError: false
        });

        // 提取<math>...</math>部分
        const parser = new DOMParser();
        const doc = parser.parseFromString(mathml, 'text/html');
        const mathElement = doc.querySelector('math');
        if (mathElement) {
            // 添加MathML命名空间
            mathElement.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
            return mathElement.outerHTML;
        }
        return null;
    } catch (e) {
        console.error('Temml渲染失败:', e);
        return null;
    }
}

// 加载XSL样式表 (使用浏览器原生XSLTProcessor)
async function loadXSLStylesheet() {
    if (xslStylesheet) {
        console.log('[MD2Word] XSL样式表已缓存，直接使用');
        return xslStylesheet;
    }

    try {
        console.log('[MD2Word] 开始加载XSL样式表...');
        // 尝试加载XSL文件
        let xslUrl;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            // 插件环境
            xslUrl = chrome.runtime.getURL('assets/MML2OMML.xsl');
        } else {
            // 网页环境 (假设assets在同级或根目录)
            xslUrl = 'assets/MML2OMML.xsl';
        }
        console.log('[MD2Word] XSL URL:', xslUrl);
        const response = await fetch(xslUrl);
        console.log('[MD2Word] fetch响应状态:', response.status);
        const xslText = await response.text();
        console.log('[MD2Word] XSL内容长度:', xslText.length);

        const parser = new DOMParser();
        xslStylesheet = parser.parseFromString(xslText, 'text/xml');

        // 检查解析错误
        const parseError = xslStylesheet.querySelector('parsererror');
        if (parseError) {
            console.error('[MD2Word] ❌ XSL解析错误:', parseError.textContent);
            return null;
        }

        console.log('[MD2Word] ✓ XSL样式表加载成功');
        return xslStylesheet;
    } catch (e) {
        console.error('[MD2Word] ❌ 加载XSL样式表失败:', e);
        return null;
    }
}

// 使用XSLTProcessor将MathML转换为OMML
async function mathMLToOMML(mathmlString) {
    console.log('[MD2Word] mathMLToOMML 开始, MathML长度:', mathmlString.length);
    const xsl = await loadXSLStylesheet();
    if (!xsl) {
        console.error('[MD2Word] ❌ XSL样式表未加载');
        return null;
    }

    try {
        const parser = new DOMParser();
        const mathmlDoc = parser.parseFromString(mathmlString, 'text/xml');

        // 检查解析错误
        const parseError = mathmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('MathML解析错误:', parseError.textContent);
            return null;
        }

        // 使用XSLTProcessor转换
        const processor = new XSLTProcessor();
        processor.importStylesheet(xsl);
        const resultDoc = processor.transformToDocument(mathmlDoc);

        // 序列化为字符串
        const serializer = new XMLSerializer();
        let omml = serializer.serializeToString(resultDoc);

        // 清理XML声明
        omml = omml.replace(/<\?xml[^?]*\?>/g, '').trim();

        // 移除默认命名空间声明 (xmlns="...")
        omml = omml.replace(/xmlns="[^"]*"/g, '');

        // 移除可能存在的其他命名空间声明，避免冲突
        omml = omml.replace(/xmlns:m="[^"]*"/g, '');
        omml = omml.replace(/xmlns:w="[^"]*"/g, '');

        // 核心修复：将所有无前缀的标签添加 m: 前缀
        // 1. 替换开始标签 <tagName ... (不含冒号)
        omml = omml.replace(/<([a-zA-Z][a-zA-Z0-9]*)([\s>])/g, '<m:$1$2');

        // 2. 替换结束标签 </tagName> (不含冒号)
        omml = omml.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g, '</m:$1>');

        // 3. 替换自闭合标签 <tagName/> (不含冒号)
        omml = omml.replace(/<([a-zA-Z][a-zA-Z0-9]*)\/>/g, '<m:$1/>');

        console.log('[MD2Word] OMML输出前200字符 (已强制添加m:前缀):', omml.substring(0, 200));
        return omml;
    } catch (e) {
        console.error('MathML转OMML失败:', e);
        return null;
    }
}

// 完整的LaTeX到OMML转换
async function latexToOMML(latex) {
    console.log('[MD2Word] ========== latexToOMML 开始 ==========');
    console.log('[MD2Word] 输入LaTeX:', latex);

    // 步骤1: LaTeX → MathML
    const mathml = latexToMathML(latex);
    if (!mathml) {
        console.error('[MD2Word] ❌ 步骤1失败: LaTeX转MathML返回null');
        return null;
    }
    console.log('[MD2Word] ✓ 步骤1完成: MathML长度', mathml.length);

    // 步骤2: MathML → OMML
    const omml = await mathMLToOMML(mathml);
    if (!omml) {
        console.error('[MD2Word] ❌ 步骤2失败: MathML转OMML返回null');
        return null;
    }
    console.log('[MD2Word] ✓ 步骤2完成: OMML长度', omml.length);
    console.log('[MD2Word] ========== latexToOMML 完成 ==========');
    return omml;
}

// ============== Mermaid图表处理 ==============
let mermaidInitialized = false;

async function initMermaid() {
    if (mermaidInitialized || !window.mermaid) return;

    try {
        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
        mermaidInitialized = true;
    } catch (e) {
        console.warn('Mermaid初始化失败:', e);
    }
}

async function renderMermaidToSvg(code) {
    if (!window.mermaid) {
        console.warn('Mermaid库未加载');
        return null;
    }

    await initMermaid();

    try {
        const id = 'mermaid-' + Date.now();
        const { svg } = await window.mermaid.render(id, code);
        return svg;
    } catch (e) {
        console.error('Mermaid渲染失败:', e);
        return null;
    }
}

async function svgToBase64Png(svgString, width = 600, height = 400) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const base64 = canvas.toDataURL('image/png').split(',')[1];
            URL.revokeObjectURL(url);
            resolve(base64);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('SVG转PNG失败'));
        };

        img.src = url;
    });
}

// ============== docx.js库加载 ==============
let docxLibCache = null;

async function loadDocxLib() {
    if (docxLibCache) return docxLibCache;

    if (window.docx) {
        docxLibCache = window.docx;
        return docxLibCache;
    }

    // 等待库加载
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (window.docx) {
            docxLibCache = window.docx;
            return docxLibCache;
        }
    }
    throw new Error('docx库加载失败');
}

// ============== HTML转Markdown ==============
function htmlToMarkdown(html) {
    // 使用DOM解析而非正则，以正确处理嵌套结构和数学公式
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstChild;

    // 首先处理数学公式，将其转换回LaTeX格式
    processLatexElements(container);

    // 然后将DOM转换为Markdown
    return domToMarkdown(container);
}

// 处理HTML中的数学公式元素，提取原始LaTeX
function processLatexElements(element) {
    console.log('[MD2Word] processLatexElements 开始处理...');

    // 处理KaTeX渲染的公式
    const katexElements = element.querySelectorAll('.katex, .katex-display');
    console.log('[MD2Word] 找到KaTeX元素数量:', katexElements.length);

    katexElements.forEach((katex, idx) => {
        const annotation = katex.querySelector('annotation[encoding="application/x-tex"]');
        console.log(`[MD2Word] KaTeX #${idx} annotation:`, annotation ? annotation.textContent.substring(0, 100) : '未找到');
        if (annotation) {
            const latex = annotation.textContent.trim();
            console.log(`[MD2Word] 提取的LaTeX #${idx}:`, latex.substring(0, 80));
            const isBlock = katex.classList.contains('katex-display');
            const replacement = document.createTextNode(isBlock ? `\n$$${latex}$$\n` : `$${latex}$`);
            katex.replaceWith(replacement);
        } else {
            // 如果没有annotation，尝试检查其他结构
            console.log(`[MD2Word] KaTeX #${idx} HTML结构:`, katex.innerHTML.substring(0, 200));
        }
    });

    // 处理MathJax渲染的公式
    const mjElements = element.querySelectorAll('.MathJax, mjx-container, .mjx-chtml');
    console.log('[MD2Word] 找到MathJax元素数量:', mjElements.length);

    mjElements.forEach((mj, idx) => {
        // 尝试从script标签获取
        const script = mj.querySelector('script[type="math/tex"], script[type="math/tex; mode=display"]');
        if (script) {
            const latex = script.textContent.trim();
            console.log(`[MD2Word] MathJax #${idx} script LaTeX:`, latex.substring(0, 80));
            const isDisplay = script.type.includes('display');
            mj.replaceWith(document.createTextNode(isDisplay ? `\n$$${latex}$$\n` : `$${latex}$`));
            return;
        }

        // 尝试从data属性获取
        const dataLatex = mj.getAttribute('data-latex') || mj.getAttribute('data-original');
        if (dataLatex) {
            console.log(`[MD2Word] MathJax #${idx} data-latex:`, dataLatex.substring(0, 80));
            mj.replaceWith(document.createTextNode(`$$${dataLatex}$$`));
        } else {
            console.log(`[MD2Word] MathJax #${idx} 无法提取LaTeX，HTML:`, mj.outerHTML.substring(0, 200));
        }
    });

    // 处理span.katex-html内部的内容（如果整个katex容器没被替换）
    const katexHtmlElements = element.querySelectorAll('.katex-html');
    console.log('[MD2Word] 找到katex-html元素数量:', katexHtmlElements.length);

    katexHtmlElements.forEach((khtml, idx) => {
        // 找到相邻的annotation
        const parent = khtml.parentElement;
        if (parent) {
            const annotation = parent.querySelector('annotation[encoding="application/x-tex"]');
            if (annotation) {
                const latex = annotation.textContent.trim();
                console.log(`[MD2Word] katex-html #${idx} 提取LaTeX:`, latex.substring(0, 80));
                parent.replaceWith(document.createTextNode(`$${latex}$`));
            }
        }
    });

    console.log('[MD2Word] processLatexElements 处理完成');
}

// 将DOM元素转换为Markdown文本
function domToMarkdown(element) {
    let result = '';

    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();

            switch (tag) {
                case 'h1':
                    result += `\n# ${domToMarkdown(node)}\n\n`;
                    break;
                case 'h2':
                    result += `\n## ${domToMarkdown(node)}\n\n`;
                    break;
                case 'h3':
                    result += `\n### ${domToMarkdown(node)}\n\n`;
                    break;
                case 'h4':
                    result += `\n#### ${domToMarkdown(node)}\n\n`;
                    break;
                case 'h5':
                    result += `\n##### ${domToMarkdown(node)}\n\n`;
                    break;
                case 'h6':
                    result += `\n###### ${domToMarkdown(node)}\n\n`;
                    break;
                case 'p':
                    result += `${domToMarkdown(node)}\n\n`;
                    break;
                case 'br':
                    result += '\n';
                    break;
                case 'strong':
                case 'b':
                    result += `**${domToMarkdown(node)}**`;
                    break;
                case 'em':
                case 'i':
                    result += `*${domToMarkdown(node)}*`;
                    break;
                case 'del':
                case 's':
                    result += `~~${domToMarkdown(node)}~~`;
                    break;
                case 'code':
                    if (node.parentElement?.tagName.toLowerCase() === 'pre') {
                        result += node.textContent;
                    } else {
                        result += `\`${node.textContent}\``;
                    }
                    break;
                case 'pre':
                    const codeEl = node.querySelector('code');
                    const lang = codeEl?.className?.match(/language-(\w+)/)?.[1] || '';
                    const code = codeEl?.textContent || node.textContent;
                    result += `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
                    break;
                case 'sup':
                    const supContent = node.textContent.trim();
                    if (/^\d+$/.test(supContent)) {
                        result += `[^${supContent}]`;
                    } else {
                        result += `<sup>${domToMarkdown(node)}</sup>`;
                    }
                    break;
                case 'a':
                    const href = node.getAttribute('href') || '';
                    const aContent = node.textContent.trim();
                    // 常见的脚注参考模式: [1], 1, 或 href 包含 fn/footnote
                    if (href.startsWith('#fn') || href.includes('footnote') ||
                        (node.classList.contains('footnote-ref') && /^\d+$/.test(aContent))) {
                        const fnId = aContent.replace(/[\[\]]/g, '');
                        result += `[^${fnId}]`;
                    } else {
                        result += `[${domToMarkdown(node)}](${href})`;
                    }
                    break;
                case 'ul':
                case 'ol':
                    for (const li of node.children) {
                        if (li.tagName.toLowerCase() === 'li') {
                            const liId = li.getAttribute('id') || '';
                            if (liId.startsWith('fn') || li.classList.contains('footnote-item')) {
                                const fnNum = liId.replace(/\D/g, '') || li.textContent.match(/^\d+/)?.[0] || '1';
                                const cleanContent = li.textContent.replace(/^\d+[\.\s]*/, '').trim();
                                result += `[^${fnNum}]: ${cleanContent}\n`;
                            } else {
                                const prefix = tag === 'ul' ? '- ' : '1. ';
                                result += `${prefix}${domToMarkdown(li)}\n`;
                            }
                        }
                    }
                    result += '\n';
                    break;
                case 'li':
                    result += domToMarkdown(node);
                    break;
                case 'blockquote':
                    const lines = domToMarkdown(node).split('\n');
                    result += lines.map(l => `> ${l}`).join('\n') + '\n\n';
                    break;
                case 'hr':
                    result += '\n---\n\n';
                    break;
                case 'table':
                    result += convertTableToMarkdown(node) + '\n\n';
                    break;
                case 'div':
                case 'span':
                case 'section':
                case 'article':
                    // 对于容器元素，递归处理子内容
                    result += domToMarkdown(node);
                    break;
                case 'img':
                    const alt = node.getAttribute('alt') || 'image';
                    const src = node.getAttribute('src') || '';
                    result += `![${alt}](${src})`;
                    break;
                default:
                    // 对于其他元素，尝试获取文本内容
                    result += domToMarkdown(node);
            }
        }
    }

    return result;
}

// 将HTML表格转换为Markdown格式
function convertTableToMarkdown(table) {
    const rows = [];
    const headerCells = [];

    const thead = table.querySelector('thead');
    if (thead) {
        const tr = thead.querySelector('tr');
        if (tr) {
            for (const th of tr.children) {
                headerCells.push(th.textContent.trim());
            }
        }
    }

    const tbody = table.querySelector('tbody') || table;
    for (const tr of tbody.querySelectorAll('tr')) {
        const cells = [];
        for (const td of tr.children) {
            cells.push(td.textContent.trim());
        }
        if (cells.length > 0) {
            if (rows.length === 0 && headerCells.length === 0) {
                // 第一行作为表头
                headerCells.push(...cells);
            } else {
                rows.push(cells);
            }
        }
    }

    if (headerCells.length === 0) return '';

    let md = '| ' + headerCells.join(' | ') + ' |\n';
    md += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n';
    for (const row of rows) {
        md += '| ' + row.join(' | ') + ' |\n';
    }

    return md;
}

// ============== Markdown解析 ==============
function parseMarkdown(markdown) {
    console.log('[MD2Word] ========== parseMarkdown 开始 ==========');
    const elements = [];
    const footnotes = {}; // 存储脚注定义: { id: content }
    const lines = markdown.split('\n');
    let i = 0;
    let latexBlockCount = 0;

    while (i < lines.length) {
        const line = lines[i];

        // 空行
        if (!line.trim()) {
            i++;
            continue;
        }

        // 标题
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            elements.push({
                type: 'heading',
                level: headingMatch[1].length,
                content: headingMatch[2]
            });
            i++;
            continue;
        }

        // 块级LaTeX公式 $$...$$ 或 \[...\]
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('$$') || trimmedLine.startsWith('\\[')) {
            const isBracket = trimmedLine.startsWith('\\['); // 使用trim后的判断
            const endMarker = isBracket ? '\\]' : '$$';
            let content = '';

            // 检查单行情况
            if (trimmedLine.endsWith(endMarker) && trimmedLine.length > (isBracket ? 4 : 4)) {
                // 如果是单行，内容在中间
                const startIndex = line.indexOf(isBracket ? '\\[' : '$$') + (isBracket ? 2 : 2);
                const endIndex = line.lastIndexOf(endMarker);
                if (endIndex > startIndex) {
                    content = line.slice(startIndex, endIndex);
                }
            } else {
                // 多行情况
                i++;
                while (i < lines.length) {
                    const currentLine = lines[i];
                    if (currentLine.trim().includes(endMarker)) {
                        // 找到结束标记
                        const endIdx = currentLine.indexOf(endMarker);
                        if (endIdx >= 0) content += currentLine.slice(0, endIdx);
                        break;
                    }
                    content += currentLine + '\n';
                    i++;
                }
            }
            elements.push({ type: 'latex-block', content: content.trim() });
            latexBlockCount++;
            console.log('[MD2Word] 发现latex-block #' + latexBlockCount + ':', content.substring(0, 50));
            i++;
            continue;
        }

        // 代码块或Mermaid
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim().toLowerCase();
            let content = '';
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                content += lines[i] + '\n';
                i++;
            }
            if (lang === 'mermaid' || lang === 'mmd') {
                elements.push({ type: 'mermaid', content: content.trim() });
            } else {
                elements.push({ type: 'codeblock', language: lang, content: content.trimEnd() });
            }
            i++;
            continue;
        }

        // 引用
        if (line.startsWith('>')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].startsWith('>')) {
                quoteLines.push(lines[i].slice(1).trim());
                i++;
            }
            elements.push({ type: 'blockquote', content: quoteLines.join(' ') });
            continue;
        }

        // 任务列表
        const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (taskMatch) {
            const taskItems = [];
            while (i < lines.length) {
                const tm = lines[i].match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
                if (!tm) break;
                taskItems.push({ checked: tm[1].toLowerCase() === 'x', text: tm[2] });
                i++;
            }
            elements.push({ type: 'taskList', items: taskItems });
            continue;
        }

        // 无序列表
        if (/^[-*+]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*+]\s+/, ''));
                i++;
            }
            elements.push({ type: 'unorderedList', items });
            continue;
        }

        // 有序列表
        if (/^\d+\.\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s+/, ''));
                i++;
            }
            elements.push({ type: 'orderedList', items });
            continue;
        }

        // 表格
        if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
            const rows = [];
            while (i < lines.length && lines[i].includes('|')) {
                const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
                if (cells.length > 0 && !lines[i].match(/^[\s|:-]+$/)) {
                    rows.push(cells);
                }
                i++;
            }
            elements.push({ type: 'table', rows });
            continue;
        }

        // 分隔线
        if (/^[-*_]{3,}$/.test(line.trim())) {
            elements.push({ type: 'hr' });
            i++;
            continue;
        }

        // 脚注定义 [^1]: content
        const footnoteDefMatch = line.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
        if (footnoteDefMatch) {
            footnotes[footnoteDefMatch[1]] = footnoteDefMatch[2];
            i++;
            continue;
        }

        // 普通段落
        const paragraphLines = [];
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            const isLatexBlock = trimmed.startsWith('$$') || trimmed.startsWith('\\[');
            // 检查脚注定义
            const isFootnoteDef = /^\[\^([^\]]+)\]:\s*/.test(line);

            // 检查是否遇到其他块级元素
            if (!trimmed ||  // 空行
                line.startsWith('#') ||
                line.startsWith('```') ||
                isLatexBlock ||
                isFootnoteDef ||
                line.startsWith('>') ||
                /^[-*+]\s/.test(line) ||
                /^\d+\.\s/.test(line) ||
                /^[-*_]{3,}$/.test(trimmed) ||
                (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---'))) {
                break;
            }

            paragraphLines.push(line);
            i++;
        }
        if (paragraphLines.length > 0) {
            const content = paragraphLines.join(' ');
            // 扩展特征检测：LaTeX, 脚注, 粗体, 斜体, 链接, 删除线, 行内代码
            const hasRich = /\$|\\\(|\\\[|\[\^|\*\*|\*|~~|`|\[.+?\]\(.+?\)/.test(content);

            if (hasRich) {
                console.log('[MD2Word] 发现富文本段落:', content.substring(0, 50));
            }

            elements.push({
                type: 'paragraph',
                content: content,
                hasRichContent: hasRich
            });
        }
    }

    return { elements, footnotes };
}

// ============== 解析段落中的行内元素 ==============
async function parseInlineContent(text, docx) {
    const { TextRun, Math: DocxMath, MathRun, FootnoteReferenceRun } = docx;
    const runs = [];

    // 检测: LaTeX ($$, $, \[, \() 或 脚注引用 ([^1])
    const inlineElementRegex = /(\$\$[\s\S]+?\$\$)|(\$[^$]+\$)|(\\\s*\[[\s\S]+?\\\s*\])|(\\\s*\([\s\S]+?\\\s*\))|(\[\^([^\]]+)\])/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineElementRegex.exec(text)) !== null) {
        // 添加LaTeX之前的普通文本
        if (match.index > lastIndex) {
            const beforeText = text.slice(lastIndex, match.index);
            runs.push(...parseTextStyles(beforeText, docx));
        }

        if (match[5]) {
            // 匹配到脚注引用 [^id]
            const id = match[6];
            const mapping = window._footnoteMapping && window._footnoteMapping[id];
            if (mapping) {
                runs.push(new FootnoteReferenceRun(mapping.numId));
            } else {
                runs.push(new TextRun({ text: `[^${id}]` }));
            }
        } else {
            // 提取 LaTeX 内容（去掉分隔符）
            let fullMatch = match[0];
            let latex = '';

            if (fullMatch.startsWith('$$')) latex = fullMatch.slice(2, -2);
            else if (fullMatch.startsWith('$')) latex = fullMatch.slice(1, -1);
            else if (fullMatch.startsWith('\\[')) latex = fullMatch.slice(2, -2);
            else if (fullMatch.startsWith('\\(')) latex = fullMatch.slice(2, -2);

            const omml = await latexToOMML(latex);

            if (omml) {
                // 使用占位符标记，后续用JSZip替换
                const placeholder = `{{MATH_${mathCounter++}}}`;
                runs.push(new TextRun({ text: placeholder }));
                // 存储OMML用于后续替换
                if (!window._mathPlaceholders) window._mathPlaceholders = {};
                window._mathPlaceholders[placeholder] = omml;
            } else {
                // 转换失败，使用纯文本
                runs.push(new TextRun({ text: `$${latex}$` }));
            }

        }

        lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
        runs.push(...parseTextStyles(text.slice(lastIndex), docx));
    }

    return runs.length > 0 ? runs : [new TextRun({ text })];
}

function parseTextStyles(text, docx, overrideSettings) {
    const { TextRun, ExternalHyperlink } = docx;
    const runs = [];
    const settings = overrideSettings || getConvertSettings();

    // 预处理：去除多余空格
    if (settings.removeExtraSpaces) {
        text = cleanExtraSpaces(text);
    }

    // 定义样式正则映射
    const styles = [
        { type: 'link', regex: /\[(.+?)\]\((.+?)\)/ },
        ...(settings.preserveBold ? [{ type: 'bold', regex: /\*\*(.+?)\*\*/ }] : [{ type: 'stripBold', regex: /\*\*(.+?)\*\*/ }]),
        ...(settings.preserveItalic ? [{ type: 'italic', regex: /(?<!\*)\*([^*]+?)\*(?!\*)/ }] : [{ type: 'stripItalic', regex: /(?<!\*)\*([^*]+?)\*(?!\*)/ }]),
        { type: 'strike', regex: /~~(.+?)~~/ },
        { type: 'code', regex: /`(.+?)`/ }
    ];

    function process(plainText, currentStyles = {}) {
        if (!plainText) return;

        let earliestMatch = null;
        let styleType = null;

        for (const s of styles) {
            const match = plainText.match(s.regex);
            if (match && (!earliestMatch || match.index < earliestMatch.index)) {
                earliestMatch = match;
                styleType = s.type;
            }
        }

        if (earliestMatch) {
            // 处理匹配之前的文本
            if (earliestMatch.index > 0) {
                process(plainText.slice(0, earliestMatch.index), currentStyles);
            }

            // 处理匹配中的文本
            if (styleType === 'link') {
                const textContent = earliestMatch[1];
                const url = earliestMatch[2];
                const linkRuns = [];
                // 递归处理链接内的样式（如 [**bold**](url)）
                const { TextRun: _, ExternalHyperlink: __, ...otherStyles } = currentStyles;

                // 暂时保存当前runs，递归处理链接内部，然后包装
                const savedRunsLength = runs.length;
                process(textContent, { ...currentStyles, color: '0563C1', underline: {} });
                const children = runs.splice(savedRunsLength);

                runs.push(new ExternalHyperlink({
                    link: url,
                    children: children
                }));
            } else if (styleType === 'stripBold' || styleType === 'stripItalic') {
                // 用户选择不保留该样式，仅提取文本内容，不添加样式
                const content = earliestMatch[1];
                process(content, currentStyles);
            } else {
                const content = earliestMatch[1];
                const nextStyles = { ...currentStyles };
                if (styleType === 'bold') nextStyles.bold = true;
                else if (styleType === 'italic') nextStyles.italics = true;
                else if (styleType === 'strike') nextStyles.strike = true;
                else if (styleType === 'code') {
                    nextStyles.font = 'Consolas';
                    nextStyles.shading = { fill: 'f0f0f0' };
                }

                process(content, nextStyles);
            }

            // 处理匹配之后的文本
            const afterIndex = earliestMatch.index + earliestMatch[0].length;
            if (afterIndex < plainText.length) {
                process(plainText.slice(afterIndex), currentStyles);
            }
        } else {
            // 纯文本
            const options = { text: plainText, ...currentStyles };
            runs.push(new TextRun(options));
        }
    }

    process(text);
    return runs.length > 0 ? runs : [new TextRun({ text })];
}

// ============== 使用JSZip后处理替换公式占位符 ==============
async function postProcessDocx(docxBlob) {
    console.log('[MD2Word] postProcessDocx 开始');
    console.log('[MD2Word] 占位符数量:', window._mathPlaceholders ? Object.keys(window._mathPlaceholders).length : 0);

    if (!window._mathPlaceholders || Object.keys(window._mathPlaceholders).length === 0) {
        console.log('[MD2Word] 没有公式占位符需要替换');
        return docxBlob;
    }

    if (!window.JSZip) {
        console.error('[MD2Word] ❌ JSZip未加载');
        return docxBlob;
    }

    try {
        const zip = await JSZip.loadAsync(docxBlob);
        let documentXml = await zip.file('word/document.xml').async('string');
        console.log('[MD2Word] document.xml 长度:', documentXml.length);

        // 替换所有公式占位符
        for (const [placeholder, omml] of Object.entries(window._mathPlaceholders)) {
            console.log('[MD2Word] 处理占位符:', placeholder);
            console.log('[MD2Word] OMML长度:', omml.length);

            // 大括号在正则表达式中需要转义
            const escapedPlaceholder = placeholder.replace(/\{/g, '\\{').replace(/\}/g, '\\}');

            // 占位符可能被包裹在<w:t>标签中
            const regex = new RegExp(`<w:t[^>]*>${escapedPlaceholder}</w:t>`, 'g');

            // 检查是否能找到占位符
            const matches = documentXml.match(regex);
            console.log('[MD2Word] 找到匹配:', matches ? matches.length : 0);

            if (matches && matches.length > 0) {
                // 打印上下文调试
                const idx = documentXml.indexOf(placeholder);
                if (idx !== -1) {
                    const ctxStart = Math.max(0, idx - 100);
                    const ctxEnd = Math.min(documentXml.length, idx + placeholder.length + 100);
                    console.log(`[MD2Word] FIX DEBUG Context around ${placeholder}:`, documentXml.substring(ctxStart, ctxEnd));
                }

                // 核心修复：先闭合当前的 w:t 和 w:r，插入OMML，再重新打开 w:r 和 w:t
                // 这样 <m:oMath> 就会成为 <w:p> 的直接子元素，而不是非法的 <w:t> 子元素
                // 注意：这里不再使用 m:oMathPara 包裹，直接使用 m:oMath (inline模式)，兼容性更好

                const xmlFix = `</w:t></w:r>${omml}<w:r><w:t>`;

                documentXml = documentXml.replace(regex, xmlFix);
                console.log('[MD2Word] ✓ 占位符已替换 (XML结构修复版)');
            } else {
                // 尝试直接搜索占位符文本
                if (documentXml.includes(placeholder)) {
                    console.log('[MD2Word] 占位符存在但regex未匹配，尝试简单替换');

                    const xmlFix = `</w:t></w:r>${omml}<w:r><w:t>`;
                    documentXml = documentXml.split(placeholder).join(xmlFix);
                } else {
                    console.log('[MD2Word] ⚠ 占位符在document.xml中未找到');
                }
            }
        }

        // 确保document.xml包含Math命名空间
        if (!documentXml.includes('xmlns:m=')) {
            documentXml = documentXml.replace(
                '<w:document',
                '<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"'
            );
            console.log('[MD2Word] 已添加Math命名空间');
        }

        zip.file('word/document.xml', documentXml);

        // 清理占位符缓存
        window._mathPlaceholders = {};

        console.log('[MD2Word] postProcessDocx 完成');
        return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } catch (e) {
        console.error('[MD2Word] ❌ JSZip后处理失败:', e);
        return docxBlob;
    }
}

// ============== 转换并下载Word文档 ==============
async function convertAndDownload(content, filename) {
    console.log('[MD2Word] ========== convertAndDownload 开始 ==========');
    console.log('[MD2Word] 输入内容类型:', content.includes('<') && content.includes('>') ? 'HTML' : 'Markdown');
    console.log('[MD2Word] 内容前200字符:', content.substring(0, 200));

    // 重置公式计数器和占位符
    mathCounter = 0;
    window._mathPlaceholders = {};

    const docxLib = await loadDocxLib();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, BorderStyle, ImageRun, Math: DocxMath, MathRun, FootnoteReferenceRun, ExternalHyperlink } = docxLib;

    // 如果内容是HTML，先转为Markdown
    let markdown = content;
    if (content.includes('<') && content.includes('>')) {
        markdown = htmlToMarkdown(content);
        console.log('[MD2Word] 转换后Markdown前300字符:', markdown.substring(0, 300));
    }

    // 解析Markdown
    const { elements, footnotes } = parseMarkdown(markdown);

    // 脚注映射: string id -> { numId, content }
    const footnoteMapping = {};
    let nextFootnoteNum = 1;
    for (const [id, text] of Object.entries(footnotes)) {
        footnoteMapping[id] = { numId: nextFootnoteNum++, text };
    }
    // 将映射挂载到全局，方便 parseInlineContent 访问
    window._footnoteMapping = footnoteMapping;

    // 构建文档段落
    const children = [];

    const settings = getConvertSettings();

    for (const el of elements) {
        switch (el.type) {
            case 'heading':
                // 处理标题中可能包含的 Markdown 内联样式（如 **粗体**、*斜体* 等）
                const headingContent = settings.removeExtraSpaces ? cleanExtraSpaces(el.content) : el.content;
                const headingHasStyle = /\*\*|\*|~~|`|\[.+?\]\(.+?\)/.test(headingContent);
                if (headingHasStyle && settings.preserveHeadingStyle) {
                    // 解析内联样式
                    children.push(new Paragraph({
                        children: parseTextStyles(headingContent, docxLib, settings),
                        heading: [
                            HeadingLevel.HEADING_1,
                            HeadingLevel.HEADING_2,
                            HeadingLevel.HEADING_3,
                            HeadingLevel.HEADING_4,
                            HeadingLevel.HEADING_5,
                            HeadingLevel.HEADING_6
                        ][el.level - 1],
                        spacing: { before: 240, after: 120 }
                    }));
                } else {
                    // 纯文本标题（去除 Markdown 标记）
                    const cleanTitle = headingContent
                        .replace(/\*\*(.+?)\*\*/g, '$1')
                        .replace(/\*(.+?)\*/g, '$1')
                        .replace(/~~(.+?)~~/g, '$1')
                        .replace(/`(.+?)`/g, '$1')
                        .replace(/\[(.+?)\]\(.+?\)/g, '$1');
                    children.push(new Paragraph({
                        text: cleanTitle,
                        heading: [
                            HeadingLevel.HEADING_1,
                            HeadingLevel.HEADING_2,
                            HeadingLevel.HEADING_3,
                            HeadingLevel.HEADING_4,
                            HeadingLevel.HEADING_5,
                            HeadingLevel.HEADING_6
                        ][el.level - 1],
                        spacing: { before: 240, after: 120 }
                    }));
                }
                break;

            case 'paragraph':
                {
                    const paraContent = settings.removeExtraSpaces ? cleanExtraSpaces(el.content) : el.content;
                    if (el.hasRichContent) {
                        const inlineRuns = await parseInlineContent(paraContent, docxLib);
                        children.push(new Paragraph({
                            children: inlineRuns,
                            spacing: { after: 200 }
                        }));
                    } else {
                        children.push(new Paragraph({
                            children: parseTextStyles(paraContent, docxLib, settings),
                            spacing: { after: 200 }
                        }));
                    }
                }
                break;

            case 'latex-block':
                // 块级LaTeX公式 - 使用占位符后续替换
                const omml = await latexToOMML(el.content);
                if (omml) {
                    const placeholder = `{{MATH_${mathCounter++}}}`;
                    if (!window._mathPlaceholders) window._mathPlaceholders = {};
                    window._mathPlaceholders[placeholder] = omml;
                    children.push(new Paragraph({
                        children: [new TextRun({ text: placeholder })],
                        alignment: 'center',
                        spacing: { before: 200, after: 200 }
                    }));
                } else {
                    // 转换失败，显示原始LaTeX
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `$$${el.content}$$` })],
                        alignment: 'center',
                        spacing: { before: 200, after: 200 }
                    }));
                }
                break;

            case 'mermaid':
                try {
                    const svg = await renderMermaidToSvg(el.content);
                    if (svg) {
                        const base64 = await svgToBase64Png(svg, 600, 400);
                        children.push(new Paragraph({
                            children: [
                                new ImageRun({
                                    data: Uint8Array.from(atob(base64), c => c.charCodeAt(0)),
                                    transformation: { width: 500, height: 333 },
                                    type: 'png'
                                })
                            ],
                            spacing: { before: 200, after: 200 }
                        }));
                    } else {
                        children.push(new Paragraph({
                            text: '[Mermaid图表 - 渲染失败]',
                            spacing: { before: 200, after: 200 }
                        }));
                    }
                } catch (e) {
                    console.error('Mermaid处理失败:', e);
                    children.push(new Paragraph({
                        text: '[Mermaid图表渲染失败]',
                        spacing: { before: 200, after: 200 }
                    }));
                }
                break;

            case 'codeblock':
                children.push(new Paragraph({
                    text: el.language ? `[代码 - ${el.language}]` : '[代码]',
                    spacing: { before: 200, after: 100 }
                }));
                el.content.split('\n').forEach(line => {
                    children.push(new Paragraph({
                        children: [new TextRun({
                            text: line || ' ',
                            font: 'Consolas',
                            size: 20
                        })],
                        shading: { fill: 'f5f5f5' },
                        spacing: { before: 0, after: 0 }
                    }));
                });
                children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
                break;

            case 'blockquote':
                {
                    const bqContent = settings.removeExtraSpaces ? cleanExtraSpaces(el.content) : el.content;
                    const bqRunOptions = { text: bqContent };
                    if (settings.blockquoteItalic) bqRunOptions.italics = true;
                    if (settings.blockquoteColor) bqRunOptions.color = settings.blockquoteColor;
                    children.push(new Paragraph({
                        children: [new TextRun(bqRunOptions)],
                        indent: { left: 720 },
                        border: {
                            left: { color: '999999', size: 6, style: BorderStyle.SINGLE }
                        },
                        spacing: { before: 200, after: 200 }
                    }));
                }
                break;

            case 'taskList':
                el.items.forEach(item => {
                    const checkbox = item.checked ? '☑' : '☐';
                    children.push(new Paragraph({
                        text: `${checkbox} ${item.text}`,
                        indent: { left: 360 },
                        spacing: { after: 80 }
                    }));
                });
                children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                break;

            case 'unorderedList':
                el.items.forEach(item => {
                    const ulContent = settings.removeExtraSpaces ? cleanExtraSpaces(item) : item;
                    const ulHasStyle = /\*\*|\*|~~|`|\[.+?\]\(.+?\)/.test(ulContent);
                    if (ulHasStyle) {
                        const bulletRun = new TextRun({ text: '• ' });
                        children.push(new Paragraph({
                            children: [bulletRun, ...parseTextStyles(ulContent, docxLib, settings)],
                            indent: { left: 360 },
                            spacing: { after: 80 }
                        }));
                    } else {
                        children.push(new Paragraph({
                            text: `• ${ulContent}`,
                            indent: { left: 360 },
                            spacing: { after: 80 }
                        }));
                    }
                });
                children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                break;

            case 'orderedList':
                el.items.forEach((item, idx) => {
                    const olContent = settings.removeExtraSpaces ? cleanExtraSpaces(item) : item;
                    const olHasStyle = /\*\*|\*|~~|`|\[.+?\]\(.+?\)/.test(olContent);
                    if (olHasStyle) {
                        const numRun = new TextRun({ text: `${idx + 1}. ` });
                        children.push(new Paragraph({
                            children: [numRun, ...parseTextStyles(olContent, docxLib, settings)],
                            indent: { left: 360 },
                            spacing: { after: 80 }
                        }));
                    } else {
                        children.push(new Paragraph({
                            text: `${idx + 1}. ${olContent}`,
                            indent: { left: 360 },
                            spacing: { after: 80 }
                        }));
                    }
                });
                children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                break;

            case 'table':
                if (el.rows.length > 0) {
                    const table = new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: el.rows.map((row, rowIdx) =>
                            new TableRow({
                                children: row.map(cell =>
                                    new TableCell({
                                        children: [new Paragraph({ text: cell })],
                                        shading: rowIdx === 0 ? { fill: 'e0e0e0' } : undefined
                                    })
                                )
                            })
                        )
                    });
                    children.push(table);
                    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
                }
                break;

            case 'hr':
                children.push(new Paragraph({
                    border: { bottom: { color: 'cccccc', size: 1, style: BorderStyle.SINGLE } },
                    spacing: { before: 200, after: 200 }
                }));
                break;
        }
    }

    // 创建文档
    const doc = new Document({
        footnotes: Object.fromEntries(
            Object.values(footnoteMapping).map(m => [
                m.numId,
                { children: [new Paragraph({ text: m.text })] }
            ])
        ),
        sections: [{
            properties: {},
            children: children.length > 0 ? children : [
                new Paragraph({ text: markdown })
            ]
        }]
    });

    // 生成初始Blob
    let blob = await Packer.toBlob(doc);

    // 使用JSZip后处理替换公式占位符
    blob = await postProcessDocx(blob);

    // 下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
}

// 导出函数供全局使用
window.htmlToMarkdown = htmlToMarkdown;
window.convertAndDownload = convertAndDownload;

