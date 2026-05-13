# LeetCode-Copy 题目复制 (Markdown)

一键复制 LeetCode 题目为 Markdown 格式，支持 LaTeX 公式转换。

## 功能特性

- 支持 `leetcode.com` 和 `leetcode.cn`
- 自动提取题目标题、难度、标签、链接
- HTML 转 Markdown：代码块、加粗、斜体、列表、图片、链接等
- `<sup>` / `<sub>` 自动转为 LaTeX 内联公式（如 `$-10^{9}$`）
- KaTeX / MathJax 公式自动提取为 `$...$` 或 `$$...$$`
- 链接输出为可点击的 Markdown 格式 `[url](url)`
- 复制按钮嵌入题目标题右侧，不遮挡页面

## 安装方式

### 方式一：油猴脚本（暂未发布）

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 打开 `leetcode-copy.user.js` 文件，复制全部内容
3. Tampermonkey → 添加新脚本 → 粘贴 → 保存

或者从 Greasy Fork 安装（如已发布）。

### 方式二：浏览器扩展（开发者模式）

1. 打开 `chrome://extensions/`（或 `edge://extensions/`）
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择本项目文件夹

## 使用方法

1. 打开任意 LeetCode 题目页面
2. 题目标题右侧出现橙色 **📋 复制题目** 按钮
3. 点击按钮，题目以 Markdown 格式复制到剪贴板
4. 粘贴到笔记、文档或代码文件中

## 输出示例

```markdown
# 437. 路径总和 III

**难度**: 中等

**标签**: 树, 深度优先搜索, 二叉树

**链接**: [https://leetcode.cn/problems/path-sum-iii/](https://leetcode.cn/problems/path-sum-iii/)

---

给定一个二叉树的根节点 `root` ，和一个整数 `targetSum` ，求该二叉树里节点值之和等于 `targetSum` 的 **路径** 的数目。

**提示:**

- 二叉树的节点个数的范围是 `[0,1000]`
- $-10^{9}$ <= Node.val <= $10^{9}$
- $-1000$ <= targetSum <= $1000$
```

## 项目结构

```
Leetcode-copy/
├── manifest.json              # Chrome 扩展配置 (Manifest V3)
├── content.js                 # 扩展版核心逻辑
├── style.css                  # 扩展版按钮样式
├── leetcode-copy.user.js      # 油猴脚本
├── icons/                     # 扩展图标
└── README.md
```

## 技术说明

- Manifest V3 浏览器扩展 / Tampermonkey UserScript 双格式
- 纯 JavaScript，无构建工具、无外部依赖
- MutationObserver 监听 SPA 页面动态加载
- 递归 DOM 遍历实现 HTML → Markdown 转换
- 自动识别 KaTeX / MathJax / `<sup>` / `<sub>` 并转为 LaTeX

## License

MIT
