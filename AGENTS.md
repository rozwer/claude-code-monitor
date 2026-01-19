# AGENTS.md - claude-code-monitor 開発フロー

## 概要

Claude Code のセッションを監視する CLI ツール。Ink (React for CLI) で TUI を構築し、ファイルベースで状態管理を行う。

## 開発ワークフロー

### Solo モード

1. **Plan**: `/plan-with-agent` で計画を作成 → Plans.md に記録
2. **Work**: `/work` でタスクを実行
3. **Review**: `/harness-review` でレビュー

### コマンド一覧

| コマンド | 用途 |
|---------|------|
| `/plan-with-agent` | 新機能・修正の計画を作成 |
| `/work` | Plans.md のタスクを実行 |
| `/harness-review` | 実装をレビュー |
| `/sync-status` | 進捗確認・Plans.md 更新 |

## コード規約

### TypeScript

- 型は明示的に定義（`any` 禁止）
- `interface` より `type` を優先
- 非同期は `async/await` を使用

### テスト

- Vitest を使用
- テストファイルは `__tests__/` または `.test.ts`
- カバレッジ目標: 80%以上

### コミット

- Conventional Commits 形式
- `feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`

## アーキテクチャ

```
src/
├── bin/ccm.tsx      # CLI エントリーポイント
├── components/      # Ink コンポーネント
├── hook/            # フックイベント処理
├── store/           # 状態管理
├── hooks/           # React カスタムフック
├── utils/           # ユーティリティ
└── types/           # 型定義
```

## 品質ゲート

- `npm run typecheck` でエラーなし
- `npm run lint` でエラーなし
- `npm run test` で全テスト pass
