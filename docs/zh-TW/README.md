# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/ECC?style=flat)](https://github.com/affaan-m/ECC/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

---

<div align="center">

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ**

[**English**](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../../README.zh-CN.md) | **繁體中文** | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Українська](../uk-UA/README.md)

</div>

---

**ECC 為 AI 編碼工具提供規劃、測試、審查、驗證、記憶與持續學習的工作流程。**

目前包含 68 個 Agent、292 個技能與 94 個舊版指令相容入口，以及 Hook、規則與 MCP 設定。ECC 採 MIT 授權，支援 Claude Code、Codex 及其他工具；各工具的功能並不完全相同，請參閱[支援狀態](../../README.md#platform-support)。

> 本頁為繁體中文入門摘要。本次依 ECC 2.2.2 更新安裝方式、主要入口與 token 用詞；尚未全面同步所有翻譯，完整功能與最新細節請參閱[英文 README](../../README.md)。

---

## 指南

下列指南說明 ECC 的設計與工作流程；安裝請依本頁的快速開始操作。

<table>
<tr>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2012378465664745795">
<img src="https://github.com/user-attachments/assets/1a471488-59cc-425b-8345-5245c7efbcef" alt="Everything Claude Code 簡明指南" />
</a>
</td>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2014040193557471352">
<img src="https://github.com/user-attachments/assets/c9ca43bc-b149-427f-b551-af6840c368f0" alt="Everything Claude Code 完整指南" />
</a>
</td>
</tr>
<tr>
<td align="center"><b>簡明指南</b><br/>設定、基礎、理念。<b>請先閱讀此指南。</b></td>
<td align="center"><b>完整指南</b><br/>token 最佳化、記憶持久化、評估、平行處理。</td>
</tr>
</table>

| 主題 | 學習內容 |
|------|----------|
| token 最佳化 | 模型選擇、系統提示精簡、背景程序 |
| 記憶持久化 | 自動跨工作階段儲存／載入上下文的 Hook |
| 持續學習 | 從工作階段自動擷取模式並轉化為可重用技能 |
| 驗證迴圈 | 檢查點 vs 持續評估、評分器類型、pass@k 指標 |
| 平行處理 | Git worktrees、串聯方法、何時擴展實例 |
| 子 Agent 協調 | 上下文問題、漸進式檢索模式 |

---

## 快速開始

需要 Node.js 18 以上版本。Claude Code 外掛安裝另需 Git 與 Claude Code 2.1 以上版本，且可從 `PATH` 執行。

### 第一步：選擇一種安裝方式

建議使用互動式設定精靈安裝或更新 Claude Code 外掛，也可用來調整安裝範圍與 Hook 設定檔：

```bash
npx ecc-universal@2.2.2 setup
```

此指令設定 Claude Code 外掛。若要選擇 Claude Code、Codex 或 Kimi Code，使用多工具安裝精靈：

```bash
npx ecc-universal@2.2.2 install --guided
```

精靈會顯示安裝管道與目的地、執行安裝前檢查，並在寫入前要求確認。上述版本與本儲存庫的 2.2.2 發行版一致；固定版本不等於安全稽核，執行套件程式碼前仍應檢視發行來源與套件完整性。

也可以在 Claude Code 中使用原生外掛指令，與 `setup` 擇一即可：

```text
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```

**每個工具只選一種安裝方式。** Claude Code 外掛不要再疊加完整手動安裝；Codex 原生外掛不要與舊版同步流程混用，以免技能、指令或 Hook 重複。

### 第二步：依需求安裝規則

Claude Code 外掛無法分發 `rules`。只安裝 `common` 與實際使用的語言或框架規則，並保留目錄結構。以下為 Bash 指令：

```bash
git clone https://github.com/affaan-m/ECC.git
cd ECC
mkdir -p ~/.claude/rules/ecc
cp -R rules/common ~/.claude/rules/ecc/
cp -R rules/typescript ~/.claude/rules/ecc/  # 替換成你的技術堆疊
```

Windows PowerShell 對應指令：

```powershell
git clone https://github.com/affaan-m/ECC.git
Set-Location ECC
New-Item -ItemType Directory -Force -Path "$HOME/.claude/rules/ecc" | Out-Null
Copy-Item -Recurse -Force rules/common "$HOME/.claude/rules/ecc/"
Copy-Item -Recurse -Force rules/typescript "$HOME/.claude/rules/ecc/"
```

不要複製所有語言規則，也不要在安裝外掛後執行 `./install.sh --profile full`。僅供單一專案使用時，改用專案內的 `.claude/rules/ecc/`。詳見[規則安裝說明](../../rules/README.md)。

### 第三步：開始使用

```text
/ecc:plan "新增使用者認證"
```

安裝後可在 Claude Code 使用 `/ecc:configure-ecc` 重新設定。此技能不能取代首次安裝時的 `/plugin` 指令。

### Codex 安裝

Codex 原生外掛可透過上述多工具精靈安裝，也可在終端機執行：

```bash
codex plugin marketplace add affaan-m/ECC
codex plugin add ecc@ecc
codex plugin list --json
```

更新時先執行 `codex plugin marketplace upgrade ecc`，再執行 `codex plugin add ecc@ecc`。Codex 的 Hook 信任由 Codex 管理，不使用 Claude Code 的安裝範圍或 Hook 設定檔。

舊版 `scripts/sync-ecc-to-codex.sh` 僅供相容用途，原生外掛不需要這個步驟。詳見[Codex 安裝與遷移說明](../../README.md#codex-app-and-cli)。

---

## 跨平台支援

ECC 支援 Windows、macOS 和 Linux，但不同工具的 Hook、規則與 MCP 能力各有差異。請依[平台支援表](../../README.md#platform-support)確認所用工具的限制；本頁的 shell 範例會標明 Bash 或 PowerShell。

### 套件管理器偵測

外掛會自動偵測您偏好的套件管理器（npm、pnpm、yarn 或 bun），優先順序如下：

1. **環境變數**：`CLAUDE_PACKAGE_MANAGER`
2. **專案設定**：`.claude/package-manager.json`
3. **package.json**：`packageManager` 欄位
4. **鎖定檔案**：從 package-lock.json、yarn.lock、pnpm-lock.yaml 或 bun.lockb 偵測
5. **全域設定**：`~/.claude/package-manager.json`
6. **備援方案**：第一個可用的套件管理器

設定您偏好的套件管理器：

```bash
# 透過環境變數
export CLAUDE_PACKAGE_MANAGER=pnpm

# 透過全域設定
node scripts/setup-package-manager.js --global pnpm

# 透過專案設定
node scripts/setup-package-manager.js --project bun

# 偵測目前設定
node scripts/setup-package-manager.js --detect
```

或在 Claude Code 中使用 `/setup-pm` 指令。

---

## 內容概覽

`skills/` 是主要工作流程來源；`commands/` 保留仍在維護的舊版斜線指令相容入口。完整清單請參閱[英文內容概覽](../../README.md#whats-inside)。

```text
ECC/
|-- agents/                # 專門處理規劃、審查、建置與領域工作的 Agent
|-- skills/                # 工作流程與領域知識
|-- commands/              # 維護中的指令相容入口
|-- legacy-command-shims/  # 已退役的舊指令入口，按需選用
|-- rules/
|   |-- common/            # 通用規則
|   |-- typescript/        # 語言或框架規則，依實際需求選擇
|   |-- python/
|   |-- golang/
|-- hooks/                 # Hook 設定
|-- scripts/               # 安裝、Hook 執行與管理工具
|-- tests/                 # 測試套件
|-- .claude-plugin/        # Claude Code 外掛與市集資訊
|-- .codex-plugin/         # Codex 原生外掛資訊
|-- .agents/skills/        # 跨工具技能子集
|-- .codex/                # Codex 專案設定
|-- mcp-configs/           # MCP 設定範例
|-- docs/                  # 指南與翻譯
```

---

## 生態系統工具

[ECC Tools](https://ecc.tools) 提供 GitHub App，可分析儲存庫並產生技能。請使用[官方 GitHub App](https://github.com/apps/ecc-tools)。本機技能擷取與 AgentShield 等工具請參閱[英文生態系統工具指南](../../README.md#ecosystem-tools)。

---

## 安裝

一般安裝請從上方的[快速開始](#快速開始)選擇一條路徑。需要選擇個別元件、低上下文模式或手動安裝時，請參閱[進階安裝選項](../../README.md#advanced-install-options)。

- 官方原始碼儲存庫：`affaan-m/ECC`
- Claude Code 市集與外掛識別碼：`ecc@ecc`
- npm 套件：`ecc-universal`（`ecc-install` 是套件內的執行檔名稱，不是獨立套件）
- 安裝衝突或重複項目：[重設與移除 ECC](../../README.md#reset--uninstall-ecc)
- 其他編輯器與工具：[安裝與支援限制](../../README.md#other-agents-and-editors)

透過外掛安裝時，Hook 由外掛管理，不要再複製到 `settings.json`。手動安裝與 MCP 設定請依進階指南操作；保留 `YOUR_*_HERE` 佔位符，不要把真實 API 金鑰提交到儲存庫。

---

## 核心概念

### Agent（Agents）

子 Agent 以有限範圍處理委派的任務。範例：

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer...
```

### 技能（Skills）

技能是由指令或 Agent 調用的工作流程定義：

```markdown
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
```

### Hook（Hooks）

Hook 在工具事件時觸發。範例：警告 `console.log`。

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
```

### 規則（Rules）

規則分為通用原則與語言或框架專屬目錄，安裝時保留這個結構：

```text
~/.claude/rules/ecc/
  common/          # 通用安全性、程式碼風格與測試原則
  typescript/      # 依專案需求選用
```

---

## 執行測試

外掛包含完整的測試套件：

```bash
# 執行 CI 驗證與測試套件
npm test

# 執行個別測試檔案
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

---

## 貢獻

**歡迎並鼓勵貢獻。**

本儲存庫旨在成為社群資源。如果您有：
- 實用的 Agent 或技能
- 巧妙的 Hook
- 更好的 MCP 設定
- 改進的規則

請貢獻！詳見 [CONTRIBUTING.md](CONTRIBUTING.md) 的指南。

### 貢獻想法

- 特定語言的技能（Python、Rust 模式）- Go 現已包含！
- 特定框架的設定（Django、Rails、Laravel）
- DevOps Agent（Kubernetes、Terraform、AWS）
- 測試策略（不同框架）
- 特定領域知識（ML、資料工程、行動開發）

---

## 背景

我從實驗性推出就開始使用 Claude Code。2025 年 9 月與 [@DRodriguezFX](https://x.com/DRodriguezFX) 一起使用 Claude Code 打造 [zenith.chat](https://zenith.chat)，贏得了 Anthropic x Forum Ventures 黑客松。

這些設定已在多個生產應用程式中經過實戰測試。

---

## token 最佳化與注意事項

模型選擇、上下文壓縮與用量管理詳見 [token 最佳化指南](../token-optimization.md)。此處的 token 指模型處理文字的單位，保留英文，避免與認證權杖混淆。

### 上下文視窗管理

**關鍵：** 不要同時啟用所有 MCP。啟用過多工具會讓您的 200k 上下文視窗縮減至 70k。

經驗法則：
- 設定 20-30 個 MCP
- 每個專案啟用少於 10 個
- 啟用的工具少於 80 個

在 Claude Code 使用 `/mcp` 停用未使用的 MCP 伺服器，設定會保存在 `~/.claude.json`。`ECC_DISABLED_MCPS` 僅用來篩選 ECC 安裝或同步時產生的 MCP 設定。

### 自訂

這些設定適合我的工作流程。您應該：
1. 從您認同的部分開始
2. 根據您的技術堆疊修改
3. 移除不需要的部分
4. 添加您自己的模式

---

## Star 歷史

[![Star History Chart](https://api.star-history.com/svg?repos=affaan-m/ECC&type=Date)](https://star-history.com/#affaan-m/ECC&Date)

---

## 連結

- **簡明指南（從這裡開始）：** [Everything Claude Code 簡明指南](https://x.com/affaanmustafa/status/2012378465664745795)
- **完整指南（進階）：** [Everything Claude Code 完整指南](https://x.com/affaanmustafa/status/2014040193557471352)
- **追蹤：** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat：** [zenith.chat](https://zenith.chat)
- **技能目錄：** awesome-agent-skills（社區維護的智能體技能目錄）

---

## 授權

MIT - 自由使用、依需求修改、如可能請回饋貢獻。

---

**如果有幫助請為本儲存庫加星。閱讀兩份指南。打造偉大的作品。**
