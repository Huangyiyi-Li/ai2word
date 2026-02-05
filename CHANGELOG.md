# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **SEO Optimization**:
  - Added `webapp/robots.txt` and `webapp/sitemap.xml`.
  - Added `canonical` tags to `index.html` and `install.html`.
  - Added JSON-LD Schema (`SoftwareApplication`, `FAQPage`) to `index.html`.
  - Added JSON-LD Schema (`TechArticle`) to `install.html`.
  - Added "Common Questions" (FAQ) section to `index.html`.
- **Internationalization**:
  - Added English and Chinese translations for the new FAQ section in `lib/i18n.js`.

### Fixed

- **Visuals**:
  - Fixed visibility issue for the FAQ section by moving it into a white card container (`.faq-container`) to ensure text contrast against the background.
