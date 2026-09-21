# 貢獻 Everything Claude Code

感謝您參與貢獻！本儲存庫是 Claude Code 使用者的社群資源。

> 本頁是繁體中文貢獻指南摘要，涵蓋開始貢獻所需的步驟。完整範本與檢查清單請參閱[英文貢獻指南](../../CONTRIBUTING.md)。

## 我們正在尋找什麼

- **技能（Skills）**：語言最佳實務、框架模式、測試策略、架構指南與領域知識。
- **Agent**：特定語言的程式碼審查、框架、DevOps 或領域專家。
- **Hook**：由 Claude Code 事件觸發的格式化、安全檢查、驗證與通知。
- **指令（Commands）**：供使用者以斜線指令呼叫的工作流程。

依照[專案指引](../../AGENTS.md)，新增工作流程應優先放在 `skills/`；`commands/` 是保留給舊版斜線入口的相容層，只有移轉或跨工具相容需求仍需要時才新增或更新。

## 如何貢獻

### 1. Fork 並複製儲存庫

```bash
gh repo fork affaan-m/ECC --clone
cd ECC
```

### 2. 建立分支

```bash
git checkout -b feat/my-contribution
```

### 3. 新增您的貢獻

將檔案放在適當位置：

| 類型 | 位置 |
|------|------|
| 技能 | `skills/your-skill-name/SKILL.md` |
| Agent | `agents/your-agent-name.md` |
| Hook | `hooks/hooks.json` |
| 相容指令 | `commands/your-command.md` |
| 規則 | `rules/` |
| MCP 設定 | `mcp-configs/` |

若參考其他儲存庫、外掛或提示詞套件，請先閱讀[技能改編政策](../skill-adaptation-policy.md)。保留有用的概念，依 ECC 的工作流程調整命名與相依性；不要讓技能的主要價值只剩下要求使用者安裝未經審核的套件。

### 4. 遵循格式

**技能**放在獨立目錄的 `SKILL.md` 中，包含 YAML frontmatter：

```markdown
---
name: your-skill-name
description: Brief description shown in skill list and used for auto-activation
origin: ECC
---

# Your Skill Title

## When to Activate

說明何時應使用此技能。

## Core Concepts

說明主要模式與準則。

## Code Examples

提供可直接使用且已測試的範例。

## Anti-Patterns

說明應避免的做法。

## Best Practices

列出具體建議。

## Related Skills

連結至相關技能。
```

`name` 必須與目錄名稱相同。`description` 使用單行字串或折疊區塊（`>`），不要使用保留換行的 `|`、`|-` 或 `|+`，以免破壞表格呈現。技能應聚焦單一領域，盡量少於 500 行，最多 800 行。詳細說明請參閱[技能開發指南](../SKILL-DEVELOPMENT-GUIDE.md)與[英文技能檢查清單](../../CONTRIBUTING.md#skill-checklist)。

**Agent** 使用以下 frontmatter，並說明職責、工作流程、驗證方式、輸出格式與範例：

```markdown
---
name: your-agent-name
description: What this agent does and when Claude should invoke it.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

You are a [role] specialist.
```

只列出 Agent 實際需要的工具。完整欄位與範本請參閱[貢獻 Agent](../../CONTRIBUTING.md#contributing-agents)。

**Hook** 應有明確的觸發條件、說明、訊息與正確的結束狀態碼；請參閱[貢獻 Hook](../../CONTRIBUTING.md#contributing-hooks)及現有的 [`hooks/hooks.json`](../../hooks/hooks.json)。

**相容指令** 應包含 `description` frontmatter，說明用途、用法、步驟與輸出；請參閱[貢獻指令](../../CONTRIBUTING.md#contributing-commands)。

若技能或 Agent 需要即時文件，請記錄使用相關 MCP 工具的方式。例如 Context7 的流程是先解析函式庫 ID，再查詢文件；Agent 的 `tools` 也應列出需要的 MCP 工具。詳見 [MCP 與文件](../../CONTRIBUTING.md#mcp-and-documentation-eg-context7)。

### 5. 測試並同步相關檔案

推送前執行：

```bash
npm test
```

技能也應在 Claude Code 中實際測試。例如，在 Bash 環境下可將技能複製到本機技能目錄後測試：

```bash
cp -r skills/my-skill ~/.claude/skills/
```

若新增技能、指令、Agent、Hook 或 CLI 工具，請檢查安裝清單、套件發布內容、目錄索引、指令登錄表與文件是否需要同步。若修改 `package.json` 的 `bin`、`files` 或相依套件，依英文指南執行 `yarn install --mode=update-lockfile`，並提交 `yarn.lock` 的變更。完整清單請參閱[推送前檢查](../../CONTRIBUTING.md#3-before-you-push-avoid-red-ci)。

### 6. 跨工具支援與翻譯

ECC 為 Codex（`.agents/skills/`）及 Cursor（`.cursor/skills/`）提供技能子集。新增技能時，若應支援這些工具，請依各自的目錄結構同步，並在 PR 中說明更新範圍。Codex 副本的 frontmatter 僅允許 `name`、`description`、`metadata`、`license` 與 `allowed-tools`；不要直接複製不相容的欄位。

翻譯位於 `docs/zh-CN/`、`docs/zh-TW/`、`docs/ja-JP/` 等目錄。修改已有翻譯的 Agent、指令或技能時，請考慮同步翻譯，或開啟 issue 供維護者與翻譯者追蹤。詳見[跨工具支援與翻譯](../../CONTRIBUTING.md#cross-harness-and-translations)。

### 7. 提交 PR

使用 Conventional Commits 格式，例如 `feat: add my-skill`、`fix(skills): update React patterns` 或 `docs: improve contributing guide`。

```bash
git add skills/my-skill/
git commit -m "feat: add my-skill"
git push -u origin feat/my-contribution
```

請依實際修改調整 `git add` 的路徑。PR 標題也採用上述格式，描述應包含：

- 新增或修改了什麼，以及原因。
- 貢獻類型與影響範圍。
- 測試方式與結果。
- 是否同步跨工具支援、文件與翻譯。

完整範本請參閱 [PR 流程](../../CONTRIBUTING.md#pull-request-process)。

## 指南

- 保持貢獻聚焦且模組化，遵循現有模式。
- 提供清楚的描述，記錄相依性，提交前完成測試。
- 不要加入敏感資料，例如 API 金鑰、token 或私人路徑。
- 避免重複功能與過度複雜的設定。
- 檔名使用小寫加連字號，例如 `python-reviewer.md`；技能名稱應對應其目錄名稱，Agent 名稱應對應其檔名。

## 有問題？

請[開啟 issue](https://github.com/affaan-m/ECC/issues)，或在 X 上聯繫 [@affaanmustafa](https://x.com/affaanmustafa)。
