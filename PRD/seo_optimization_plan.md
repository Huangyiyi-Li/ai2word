# AiToWords SEO Optimization Plan

## 1. Project Background

AiToWords (formerly MD2Word) is a browser-based tool and extension for converting AI chat exports (ChatGPT, DeepSeek, etc.) and Markdown to Word documents. The project consists of a landing page (`webapp/index.html`) and an installation guide (`webapp/install.html`).

## 2. Current SEO Status Analysis

- **Strengths**:
  - Basic Meta tags (Title, Description, Keywords) are present.
  - Open Graph tags are present.
  - Semantic HTML (header, main, section) is used.
  - Mobile-responsive design (viewport tag present).
- **Weaknesses**:
  - Missing structured data (JSON-LD Schema) for rich snippets.
  - No `robots.txt` or `sitemap.xml` to guide crawlers.
  - Content is relatively thin; lacks long-tail keyword targeting (e.g., "FAQ" or detailed "How-to").
  - "Install" page could be optimized for "Extension" related keywords.
  - No canonical tags to prevent potential duplicate content issues (though less likely for a small site).

## 3. Optimization Goals

- Improve search engine visibility for keywords: "ChatGPT to Word", "Markdown to Word", "DeepSeek export", "AI doc converter".
- Achieve rich snippets in search results using Schema markup.
- Ensure correct indexing of all pages.

## 4. Implementation Details

### 4.1 Technical SEO

1. **Robots.txt**: Create a `robots.txt` file to allow indexing of valid pages and block resource files if necessary.
2. **Sitemap.xml**: Create a `sitemap.xml` listing `index.html` and `install.html` with priorities.
3. **Canonical Tags**: Add `<link rel="canonical" href="...">` to both pages (assuming the site will be hosted on a specific domain, e.g., GitHub Pages or custom domain). *Note: User needs to provide the production URL.*

### 4.2 On-Page SEO (Code Changes)

1. **JSON-LD Schema**:
    - Add `SoftwareApplication` schema to `index.html` to describe the tool, its operating system, and price (Free).
    - Add `FAQPage` schema if we add an FAQ section.
2. **Content Expansion**:
    - **FAQ Section**: Add a "Frequently Asked Questions" section to `index.html` covering:
        - "Is it free?"
        - "Does it support tables/images?"
        - "How to install the extension?"
        - "Is my data safe?" (Privacy assurance).
    - **How-to Section**: Briefly describe the 3-step process: Paste -> Preview -> Export.

### 4.3 Social & Visuals

1. **Open Graph Image**: Ensure `og:image` points to a valid URL for a preview card when shared on social media.

## 5. Execution Plan

1. **Create `robots.txt` & `sitemap.xml`** in `webapp/`.
2. **Modify `index.html`**:
    - Insert JSON-LD Schema in `<head>`.
    - Add FAQ section content and styles before the Footer.
3. **Modify `install.html`**:
    - Add JSON-LD Schema (e.g., `TechArticle` or `HowTo`).

## 6. Verification

- Use [Google Search Console](https://search.google.com/search-console) (manual) or online validators to check Schema markup.
- Verify `robots.txt` and `sitemap.xml` accessibility.
- Check Lighthouse SEO score in Chrome DevTools.
