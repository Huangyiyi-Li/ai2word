// mathml2omml wrapper for browser
// 将ESM模块的mml2omml函数暴露为全局函数

// 从原ESM模块提取并简化的转换逻辑
(function (global) {
    'use strict';

    // 简化的MathML到OMML转换
    // 将MathML标签映射到OMML标签
    function convertMathMLToOMML(mathmlString) {
        if (!mathmlString) return '';

        try {
            // 使用DOMParser解析MathML
            const parser = new DOMParser();
            const doc = parser.parseFromString(mathmlString, 'application/xml');
            const mathNode = doc.querySelector('math') || doc.documentElement;

            // 转换为OMML
            const omml = processNode(mathNode);
            return omml;
        } catch (e) {
            console.error('MathML转OMML失败:', e);
            return '';
        }
    }

    function processNode(node) {
        if (!node) return '';

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (!text) return '';
            return `<m:r><m:t>${escapeXml(text)}</m:t></m:r>`;
        }

        const tagName = node.tagName?.toLowerCase() || '';
        let children = Array.from(node.childNodes).map(processNode).join('');

        switch (tagName) {
            case 'math':
                return `<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${children}</m:oMath>`;

            case 'mrow':
            case 'semantics':
                return children;

            case 'mi':
            case 'mn':
            case 'mo':
            case 'mtext':
                const text = node.textContent.trim();
                if (!text) return '';
                return `<m:r><m:t>${escapeXml(text)}</m:t></m:r>`;

            case 'mfrac':
                const numNode = node.children[0];
                const denNode = node.children[1];
                return `<m:f><m:num>${processNode(numNode)}</m:num><m:den>${processNode(denNode)}</m:den></m:f>`;

            case 'msup':
                const baseNode = node.children[0];
                const supNode = node.children[1];
                return `<m:sSup><m:e>${processNode(baseNode)}</m:e><m:sup>${processNode(supNode)}</m:sup></m:sSup>`;

            case 'msub':
                const subBaseNode = node.children[0];
                const subNode = node.children[1];
                return `<m:sSub><m:e>${processNode(subBaseNode)}</m:e><m:sub>${processNode(subNode)}</m:sub></m:sSub>`;

            case 'msubsup':
                const ssBaseNode = node.children[0];
                const ssSubNode = node.children[1];
                const ssSupNode = node.children[2];
                return `<m:sSubSup><m:e>${processNode(ssBaseNode)}</m:e><m:sub>${processNode(ssSubNode)}</m:sub><m:sup>${processNode(ssSupNode)}</m:sup></m:sSubSup>`;

            case 'msqrt':
                return `<m:rad><m:radPr><m:degHide m:val="on"/></m:radPr><m:deg/><m:e>${children}</m:e></m:rad>`;

            case 'mroot':
                const rootBaseNode = node.children[0];
                const rootDegNode = node.children[1];
                return `<m:rad><m:deg>${processNode(rootDegNode)}</m:deg><m:e>${processNode(rootBaseNode)}</m:e></m:rad>`;

            case 'mover':
                const overBaseNode = node.children[0];
                const overNode = node.children[1];
                return `<m:limUpp><m:e>${processNode(overBaseNode)}</m:e><m:lim>${processNode(overNode)}</m:lim></m:limUpp>`;

            case 'munder':
                const underBaseNode = node.children[0];
                const underNode = node.children[1];
                return `<m:limLow><m:e>${processNode(underBaseNode)}</m:e><m:lim>${processNode(underNode)}</m:lim></m:limLow>`;

            case 'munderover':
                const uoBaseNode = node.children[0];
                const uoUnderNode = node.children[1];
                const uoOverNode = node.children[2];
                return `<m:limUpp><m:e><m:limLow><m:e>${processNode(uoBaseNode)}</m:e><m:lim>${processNode(uoUnderNode)}</m:lim></m:limLow></m:e><m:lim>${processNode(uoOverNode)}</m:lim></m:limUpp>`;

            case 'mtable':
                const rows = Array.from(node.children).filter(c => c.tagName?.toLowerCase() === 'mtr');
                const rowsOmml = rows.map(tr => {
                    const cells = Array.from(tr.children).filter(c => c.tagName?.toLowerCase() === 'mtd');
                    const cellsOmml = cells.map(td => `<m:e>${processNode(td)}</m:e>`).join('');
                    return `<m:mr>${cellsOmml}</m:mr>`;
                }).join('');
                return `<m:m><m:mPr><m:baseJc m:val="center"/></m:mPr>${rowsOmml}</m:m>`;

            case 'mtr':
            case 'mtd':
                return children;

            case 'mfenced':
                const open = node.getAttribute('open') || '(';
                const close = node.getAttribute('close') || ')';
                return `<m:d><m:dPr><m:begChr m:val="${escapeXml(open)}"/><m:endChr m:val="${escapeXml(close)}"/></m:dPr><m:e>${children}</m:e></m:d>`;

            case 'menclose':
                return `<m:borderBox><m:e>${children}</m:e></m:borderBox>`;

            case 'mspace':
                return `<m:r><m:t xml:space="preserve"> </m:t></m:r>`;

            case 'annotation':
            case 'annotation-xml':
                return '';

            default:
                return children;
        }
    }

    function escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // 暴露全局函数
    global.mml2omml = convertMathMLToOMML;
    global.mathml2omml = { mml2omml: convertMathMLToOMML };

})(typeof window !== 'undefined' ? window : this);