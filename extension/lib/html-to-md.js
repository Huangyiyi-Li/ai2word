// HTML to Markdown 简易实现
// 作为备用转换器

window.htmlToMd = window.htmlToMarkdown || function (html) {
    return html.replace(/<[^>]+>/g, '');
};
