# 浏览器插件：LaTeX 转 Word (One-Click Export) 技术方案

## 1. 核心目标

将 `aigc2word` 项目中依赖 Python 后端的 "LaTeX -> MathML -> OMML -> Word" 转换能力，完全移植到浏览器端（纯 JavaScript 实现），以支持在浏览器插件（如 Chrome Extension）中独立运行，无需搭建服务器。

## 2. 技术架构对比

| 环节 | 原 Python 方案 | 浏览器插件 (JS) 方案 | 推荐库/技术 |
| :--- | :--- | :--- | :--- |
| **步骤 1: LaTeX 转 MathML** | `latex2mathml` (Python) | `Temml` 或 `MathJax` (JS) | **Temml** (轻量、快速、输出纯 MathML) |
| **步骤 2: MathML 转 OMML** | `lxml` + `MML2OMML.xsl` | `XSLTProcessor` (浏览器原生) | **原生 API** (直接复用现有的 XSL 文件) |
| **步骤 3: 生成 Word** | `python-docx` | `docx` (JS 库) | **docx** (功能强大，支持 Blob 下载) |

## 3. 详细实现步骤

### 3.1 环境准备

在插件项目中安装必要的依赖：

```bash
npm install temml docx
```

并将 `MML2OMML.xsl` 文件放入插件的 `public` 或 `assets` 目录，并在 `manifest.json` 中配置 `web_accessible_resources` 以便脚本读取。

```json
// manifest.json
{
  "web_accessible_resources": [{
    "resources": ["assets/MML2OMML.xsl"],
    "matches": ["<all_urls>"]
  }]
}
```

### 3.2 核心代码逻辑 (JavaScript)

#### 第一步：LaTeX -> MathML

使用 `Temml` 将 LaTeX 字符串转为 MathML XML 字符串。

```javascript
import temml from 'temml';

function latexToMathML(latex) {
    // renderToString 返回的是 HTML 包含 <math> 标签
    const html = temml.renderToString(latex, { xml: true }); 
    // 提取 <math>...</math> 部分 (Temml 可能会包裹在 span 中，需解析提取)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const mathElement = doc.querySelector("math");
    return mathElement ? mathElement.outerHTML : null;
}
```

#### 第二步：MathML -> OMML (核心黑科技)

利用浏览器原生的 `XSLTProcessor` 加载 `MML2OMML.xsl` 进行转换。

```javascript
async function mathMLToOMML(mathmlString) {
    // 1. 加载 XSL 文件
    const xslUrl = chrome.runtime.getURL('assets/MML2OMML.xsl');
    const xslResponse = await fetch(xslUrl);
    const xslText = await xslResponse.text();

    // 2. 解析 XML 和 XSL
    const parser = new DOMParser();
    const xsltDoc = parser.parseFromString(xslText, "text/xml");
    const mathmlDoc = parser.parseFromString(mathmlString, "text/xml");

    // 3. 执行转换
    const processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    
    // transformToDocument 返回一个新的 XML Document
    const resultDoc = processor.transformToDocument(mathmlDoc);
    
    // 序列化为字符串 (移除 XML 头)
    const serializer = new XMLSerializer();
    let omml = serializer.serializeToString(resultDoc);
    
    // 清理可能存在的 XML 声明，只保留 m:oMath...
    omml = omml.replace(/<\?xml.*?\?>/g, '').trim();
    return omml;
}
```

#### 第三步：注入 Word 文档

使用 `docx` 库生成文档。由于 `docx` 库默认没有直接插入 "Raw OMML XML" 的公开 API，我们需要利用其底层的 `XmlComponent` 或者插入机制。

*注意：`docx` 库较新版本可能需要特定的 hack 才能插入 raw xml。*
一种可行方案是构建一个扩展组件：

```javascript
import { Paragraph, TextRun, XmlComponent } from "docx";

// 这是一个简化的示意，实际可能需要继承 XmlComponent 并重写 _root
class MathComponent extends XmlComponent {
    constructor(ommlString) {
        super("m:oMathPara"); // 或 m:oMath
        // 这里需要深入 docx 库的底层机制将 ommlString 解析为对象树
        // 简单一点：如果 docx 库不支持直接插 string，可能需要手动构建 XML 结构
        // 或者使用 html-to-docx 等支持 html+mathml 的库作为替代
    }
}
```

**替代方案 (推荐)**：
如果 `docx` 库直接插入 OMML 比较困难，可以考虑：

1. **纯文本占位符法**：先生成含特定占位符的 docx，然后用 `jszip` 解压，替换 document.xml 中的占位符为 OMML XML，再压缩回去（不用 `docx` 库复杂的对象模型，直接操作 XML 字符串，这是最灵活的）。
2. **`docx-math` 插件**：在 npm 上寻找现成的 `docx` 扩展。

### 3.3 推荐的 "Zip 替换法" (最稳健)

因为 Word 本质就是 Zip 包，直接操作 XML 是最还原 Python 逻辑的。

1. 使用 `docx` 库生成带 `{{MATH_0}}` 占位符的文档 Blob。
2. 使用 `JSZip` 加载该 Blob。
3. 读取 `word/document.xml`。
4. 将 `{{MATH_0}}` 替换为 `<m:oMath>...</m:oMath>` (注意要处理好命名空间和段落结构)。
5. 重新打包生成新的 Blob。

## 4. 总结

你可以完全复刻后端的逻辑，只需将 Python 的库替换为浏览器的原生 API (`XSLTProcessor`) 和 JS 库 (`JSZip`, `Temml`)。最大的难点在于"将 OMML 插入 docx"，建议采用 **JSZip 后处理** 的方式，这样你拥有对 XML 的绝对控制权。
