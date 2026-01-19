# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev           # 開発モード（ホットリロード付き）
npm run build         # TypeScriptコンパイル
npm start             # コンパイル済みJSを実行

# テスト
npm run test          # テスト実行（単発）
npm run test:watch    # テスト実行（ウォッチモード）
npm run test:coverage # カバレッジ付きテスト

# コード品質
npm run lint          # biomeでリントチェック
npm run lint:fix      # リント自動修正
npm run format        # コードフォーマット
npm run typecheck     # 型チェックのみ
```

## Architecture

Claude Codeの複数セッションをリアルタイム監視するCLIツール。Ink（React for CLI）を使用したTUIとファイルベースの状態管理で動作する。

### データフロー

1. **Hook受信**: Claude Codeがフックイベント（PreToolUse, PostToolUse, Notification, Stop, UserPromptSubmit）を発火
2. **状態更新**: `ccm hook <event>` コマンドがstdinからJSONを受け取り、`~/.claude-monitor/sessions.json` を更新
3. **UI更新**: chokidarでファイル変更を検知し、Dashboardコンポーネントが再描画

### ディレクトリ構成

- `src/bin/ccm.tsx` - CLIエントリーポイント
- `src/hook/handler.ts` - フックイベント処理
- `src/store/file-store.ts` - セッション状態の永続化
- `src/components/` - InkベースのReactコンポーネント
- `src/hooks/useSessions.ts` - ファイル変更監視付きのReactフック
- `src/types/index.ts` - 型定義

### 技術スタック

- **UI**: Ink v5 + React 18
- **CLI**: Commander
- **ファイル監視**: chokidar
- **テスト**: Vitest
- **リント/フォーマット**: Biome

### セッション管理

セッションは`session_id:tty`の形式でキー管理。30分でタイムアウト。

**状態遷移**: `running` → `waiting_input` → `stopped`

## 開発ワークフロー

1. Plans.md でタスクを管理
2. `/work` でタスクを実行
3. `/harness-review` でレビュー

## 禁止事項

- テストを削除・無効化しない
- 型チェック（`any`）をバイパスしない
- 空の catch ブロックでエラーを握りつぶさない
- `.claude/state/` 配下のファイルをコミットしない

## ルール参照

詳細なガイドラインは `.claude/rules/` を参照：
- `commit-rules.md` - コミット規約
- `pm-workflow.md` - PM・サブエージェント運用
- `code-review.md` - レビュー基準・Codex活用
- `test-quality.md` - テスト品質
- `implementation-quality.md` - 実装品質
