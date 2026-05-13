// ==UserScript==
// @name         LeetCode 题目复制 (Markdown)
// @namespace    https://github.com/leetcode-copy
// @version      1.0.0
// @description  一键复制 LeetCode 题目为 Markdown 格式，支持 LaTeX 公式、代码块、图片等
// @author       You
// @match        https://leetcode.com/problems/*
// @match        https://leetcode.cn/problems/*
// @grant        GM_setClipboard
// @license      MIT
// @icon         https://leetcode.cn/favicon.ico
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ========== Inject styles ==========
  const style = document.createElement("style");
  style.textContent = `
    #leetcode-copy-btn {
      display: inline-flex;
      align-items: center;
      background: #ffa116;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      white-space: nowrap;
      vertical-align: middle;
      margin-left: 8px;
      line-height: 1.5;
    }
    #leetcode-copy-btn:hover {
      background: #ff9100;
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    #leetcode-copy-btn.copied {
      background: #2cbb5d;
    }
    #leetcode-copy-btn.error {
      background: #ef4743;
    }
  `;
  document.head.appendChild(style);

  // ========== Button creation ==========

  function createCopyButton() {
    const btn = document.createElement("button");
    btn.id = "leetcode-copy-btn";
    btn.textContent = "复制题目";
    btn.addEventListener("click", handleCopy);

    const titleEl = findTitleElement();
    if (titleEl) {
      const parent = titleEl.parentElement;
      if (parent) {
        parent.style.display = "flex";
        parent.style.alignItems = "center";
        parent.style.flexWrap = "wrap";
        parent.style.gap = "8px";
        titleEl.after(btn);
      } else {
        titleEl.insertAdjacentElement("afterend", btn);
      }
    } else {
      const descArea = document.querySelector(
        '[data-track-load="description_content"], .elfjS, .question-content'
      );
      if (descArea) {
        descArea.insertBefore(btn, descArea.firstChild);
      } else {
        document.body.appendChild(btn);
      }
    }
  }

  // ========== Title detection ==========

  function findTitleElement() {
    const selectors = [
      '[data-cy="question-title"]',
      'div[class*="title"] a',
      'span[class*="title"]',
      'div.text-title-large',
      'div[class*="css-"] > span[class*="css-"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 2) {
        return el;
      }
    }

    const allHeaders = document.querySelectorAll(
      "div[class*='title'], h4, h3, [class*='text-title']"
    );
    for (const h of allHeaders) {
      if (/^\d+\.\s/.test(h.textContent.trim())) {
        return h;
      }
    }

    return null;
  }

  function getTitle() {
    const titleEl = findTitleElement();
    if (titleEl) return titleEl.textContent.trim();

    const pageTitle = document.title;
    const match = pageTitle.match(/^(.+?)\s*[-–—|]/);
    return match ? match[1].trim() : "Unknown Title";
  }

  // ========== Metadata extraction ==========

  function getDifficulty() {
    const diffEl = document.querySelector(
      '[diff], [class*="difficulty"], [class*="Difficulty"]'
    );
    if (diffEl) return diffEl.textContent.trim();

    const candidates = document.querySelectorAll(
      "span, div[class*='diff'], div[class*='text-']"
    );
    for (const el of candidates) {
      const text = el.textContent.trim();
      if (/^(Easy|Medium|Hard|简单|中等|困难)$/.test(text)) {
        return text;
      }
    }
    return "";
  }

  function getTags() {
    const tagEls = document.querySelectorAll(
      'a[href*="/tag/"], a[class*="tag"], [class*="topic-tag"]'
    );
    const tags = [];
    tagEls.forEach((el) => {
      const text = el.textContent.trim();
      if (text && !tags.includes(text)) {
        tags.push(text);
      }
    });
    return tags;
  }

  // ========== HTML to Markdown conversion ==========

  function htmlToMarkdown(element) {
    if (!element) return "";
    const clone = element.cloneNode(true);
    return processNode(clone).trim().replace(/\n{3,}/g, "\n\n");
  }

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();

    // Check for LaTeX/math elements first (highest priority)
    const latex = tryExtractLatex(node);
    if (latex !== null) return latex;

    switch (tag) {
      case "pre": {
        const codeEl = node.querySelector("code");
        const text = codeEl
          ? codeEl.textContent.trim()
          : node.textContent.trim();
        return "\n```\n" + text + "\n```\n";
      }
      case "code": {
        if (
          node.parentElement &&
          node.parentElement.tagName.toLowerCase() === "pre"
        ) {
          return node.textContent;
        }
        // Check if code contains sup/sub (like -10<sup>9</sup>)
        // In that case, output as inline LaTeX instead of backtick code
        const hasMath = node.querySelector("sup, sub");
        if (hasMath) {
          const inner = processChildren(node);
          return "$" + inner + "$";
        }
        return "`" + node.textContent + "`";
      }
      case "strong":
      case "b":
        return "**" + processChildren(node) + "**";
      case "em":
      case "i":
        return "*" + processChildren(node) + "*";
      case "sup":
        return "^{" + processChildren(node).trim() + "}";
      case "sub":
        return "_{" + processChildren(node).trim() + "}";
      case "br":
        return "\n";
      case "hr":
        return "\n---\n";
      case "p":
        return "\n" + processChildren(node) + "\n";
      case "h1":
        return "\n# " + processChildren(node) + "\n";
      case "h2":
        return "\n## " + processChildren(node) + "\n";
      case "h3":
        return "\n### " + processChildren(node) + "\n";
      case "h4":
        return "\n#### " + processChildren(node) + "\n";
      case "ul":
        return "\n" + processListItems(node, "ul");
      case "ol":
        return "\n" + processListItems(node, "ol");
      case "li":
        return processChildren(node);
      case "a": {
        const href = node.getAttribute("href") || "";
        const text = processChildren(node);
        if (href && text) {
          const fullHref = href.startsWith("http")
            ? href
            : "https://leetcode.cn" + href;
          return "[" + text + "](" + fullHref + ")";
        }
        return text;
      }
      case "img": {
        const src = node.getAttribute("src") || "";
        const alt = node.getAttribute("alt") || "";
        if (isLatexImage(node)) {
          return convertImgToLatex(node);
        }
        if (src) return "![](" + src + ")";
        return alt;
      }
      case "script": {
        const type = node.getAttribute("type") || "";
        if (type.includes("math/tex")) {
          const content = node.textContent.trim();
          if (type.includes("display")) {
            return "\n$$" + content + "$$\n";
          }
          return "$" + content + "$";
        }
        return "";
      }
      case "style":
        return "";
      default:
        return processChildren(node);
    }
  }

  function processChildren(node) {
    let result = "";
    for (const child of node.childNodes) {
      result += processNode(child);
    }
    return result;
  }

  function processListItems(listNode, type) {
    let result = "";
    let index = 1;
    for (const child of listNode.children) {
      if (child.tagName.toLowerCase() === "li") {
        const prefix = type === "ol" ? index + ". " : "- ";
        result += prefix + processChildren(child).trim() + "\n";
        index++;
      }
    }
    return result;
  }

  // ========== LaTeX extraction ==========

  function tryExtractLatex(node) {
    const className = node.className || "";
    const tag = node.tagName.toLowerCase();

    if (tag === "math") {
      const annotation = node.querySelector(
        'annotation[encoding="application/x-tex"]'
      );
      if (annotation) {
        return "$" + annotation.textContent.trim() + "$";
      }
      return null;
    }

    if (className.includes("katex")) {
      const annotation = node.querySelector(
        'annotation[encoding="application/x-tex"]'
      );
      if (annotation) {
        const tex = annotation.textContent.trim();
        if (className.includes("katex-display")) {
          return "\n$$" + tex + "$$\n";
        }
        return "$" + tex + "$";
      }
      const label =
        node.getAttribute("aria-label") || node.getAttribute("title");
      if (label) return "$" + label + "$";
    }

    if (
      className.includes("MathJax") ||
      className.includes("mjx") ||
      tag === "mjx-container"
    ) {
      const label =
        node.getAttribute("aria-label") || node.getAttribute("title");
      if (label) {
        const isDisplay =
          node.getAttribute("display") === "block" ||
          className.includes("display");
        if (isDisplay) {
          return "\n$$" + label + "$$\n";
        }
        return "$" + label + "$";
      }
      const mathml = node.getAttribute("data-mathml");
      if (mathml) {
        const match = mathml.match(
          /<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/
        );
        if (match) return "$" + match[1] + "$";
      }
    }

    return null;
  }

  function isLatexImage(img) {
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const className = img.className || "";

    return (
      src.includes("latex") ||
      src.includes("codecogs") ||
      src.includes("math") ||
      className.includes("latex") ||
      className.includes("math") ||
      (alt.includes("\\") || /[_^{}]/.test(alt))
    );
  }

  function convertImgToLatex(img) {
    const alt = img.getAttribute("alt") || "";
    const src = img.getAttribute("src") || "";

    if (alt && (alt.includes("\\") || /[_^{}]/.test(alt))) {
      return "$" + alt + "$";
    }

    if (src.includes("codecogs") || src.includes("latex.php")) {
      try {
        const url = new URL(src);
        const latex = decodeURIComponent(
          url.pathname.split("/").pop() || url.search.slice(1)
        );
        if (latex) return "$" + latex + "$";
      } catch (e) { /* ignore */ }
    }

    if (alt) return "$" + alt + "$";
    return "";
  }

  // ========== Post-processing: wrap bare ^{}/_{} in LaTeX ==========

  function postProcessLatex(text) {
    const lines = text.split("\n");
    const result = [];

    for (const line of lines) {
      if (line.startsWith("```") || line.startsWith("$$")) {
        result.push(line);
        continue;
      }
      result.push(wrapBareLatex(line));
    }

    return result.join("\n");
  }

  function wrapBareLatex(line) {
    if (line.startsWith("    ") || line.startsWith("\t")) return line;

    const parts = [];
    let current = "";
    let inDollar = false;
    let inBacktick = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === "$" && !inBacktick) {
        if (inDollar) {
          current += ch;
          parts.push({ text: current, type: "math" });
          current = "";
          inDollar = false;
        } else {
          if (current) parts.push({ text: current, type: "text" });
          current = ch;
          inDollar = true;
        }
      } else if (ch === "`" && !inDollar) {
        if (inBacktick) {
          current += ch;
          parts.push({ text: current, type: "code" });
          current = "";
          inBacktick = false;
        } else {
          if (current) parts.push({ text: current, type: "text" });
          current = ch;
          inBacktick = true;
        }
      } else {
        current += ch;
      }
    }
    if (current) {
      parts.push({
        text: current,
        type: inDollar ? "math" : inBacktick ? "code" : "text",
      });
    }

    const output = parts.map((part) => {
      if (part.type !== "text") return part.text;
      return part.text.replace(
        /(-?\w+)((?:[\^_]\{[^}]*\})+)/g,
        function (match) {
          return "$" + match + "$";
        }
      );
    });

    return output.join("");
  }

  // ========== Main extraction ==========

  function getDescription() {
    const selectors = [
      '[data-track-load="description_content"]',
      ".elfjS",
      '[class*="description__"]',
      '[class*="content__"]',
      ".question-content",
      '[class*="question-content"]',
      "div[class*='xFUwe']",
      "#qd-content",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim().length > 50) {
        const md = htmlToMarkdown(el);
        return postProcessLatex(md);
      }
    }

    const contentArea = document.querySelector(
      '[class*="description"], [class*="content"]'
    );
    if (contentArea) {
      const md = htmlToMarkdown(contentArea);
      return postProcessLatex(md);
    }

    return "无法提取题目描述，请手动复制。";
  }

  // ========== Build Markdown ==========

  function buildMarkdown() {
    const title = getTitle();
    const difficulty = getDifficulty();
    const tags = getTags();
    const description = getDescription();
    const url = window.location.href.split("?")[0];

    let md = "";

    md += `# ${title}\n\n`;

    if (difficulty) {
      md += `**难度**: ${difficulty}\n\n`;
    }
    if (tags.length > 0) {
      md += `**标签**: ${tags.join(", ")}\n\n`;
    }
    md += `**链接**: [${url}](${url})\n\n`;

    md += `---\n\n`;

    md += description + "\n";

    return md;
  }

  // ========== Clipboard ==========

  async function copyToClipboard(text) {
    // Prefer GM_setClipboard (Tampermonkey API, more reliable)
    if (typeof GM_setClipboard !== "undefined") {
      GM_setClipboard(text, "text");
      return true;
    }
    // Fallback to navigator.clipboard
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
  }

  // ========== Click handler ==========

  async function handleCopy() {
    const btn = document.getElementById("leetcode-copy-btn");
    btn.textContent = "提取中...";
    btn.className = "";
    btn.id = "leetcode-copy-btn";

    try {
      const markdown = buildMarkdown();
      const success = await copyToClipboard(markdown);

      if (success) {
        btn.textContent = "已复制!";
        btn.classList.add("copied");
      } else {
        btn.textContent = "复制失败";
        btn.classList.add("error");
      }
    } catch (err) {
      console.error("LeetCode Copy Error:", err);
      btn.textContent = "出错了";
      btn.classList.add("error");
    }

    setTimeout(() => {
      btn.textContent = "复制题目";
      btn.className = "";
      btn.id = "leetcode-copy-btn";
    }, 2000);
  }

  // ========== Init ==========

  function init() {
    const observer = new MutationObserver((_mutations, obs) => {
      const content = document.querySelector(
        '[data-track-load="description_content"], .elfjS, .question-content, [class*="description__"]'
      );
      if (content) {
        obs.disconnect();
        setTimeout(createCopyButton, 500);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (!document.getElementById("leetcode-copy-btn")) {
        observer.disconnect();
        createCopyButton();
      }
    }, 5000);
  }

  init();
})();
