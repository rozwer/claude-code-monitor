# Plans.md - claude-code-monitor タスク管理

## 現在のステータス

**フェーズ**: WSL対応完了
**最終更新**: 2026-01-19
**ブランチ**: wsl

---

## 完了済み

- [x] v1.0.4 リリース
- [x] alternate screen buffer 対応（TUI スタッキング防止）
- [x] ハーネス導入
- [x] WSL対応調査（2026-01-19）
- [x] **WSL対応実装**（2026-01-19）
  - [x] package.json の OS 制限解除（darwin → darwin, linux）
  - [x] ホームディレクトリパスの汎用化（SessionCard.tsx, ccm.tsx）
  - [x] which コマンドのクロスプラットフォーム対応（setup/index.ts）
  - [x] CI/CD の Ubuntu 対応（ci.yml）
  - [x] README.md ドキュメント更新

---

## バックログ

### 機能追加候補

- [ ] Windows ネイティブ対応（WSL不要）
- [ ] カスタムテーマ対応
- [ ] セッション履歴の永続化

### 技術的改善

- [ ] テストカバレッジ向上
- [ ] パフォーマンス最適化（大量セッション時）

---

## 変更不要（既に対応済み）

以下は調査の結果、変更不要と判明:

| 項目 | 理由 |
|------|------|
| TTY検証 (`src/utils/focus.ts:22-24`) | `/dev/pts/` (Linux) 対応済み |
| `ps` コマンド (`src/bin/ccm.tsx:24-47`) | try-catch で安全にフォールバック |
| package-lock.json | npm が自動で適切なプラットフォームバイナリをインストール |

## 機能制限（許容）

| 機能 | 状況 |
|------|------|
| ターミナルフォーカス | AppleScript使用のためmacOS専用。WSLでは動作しないが、監視機能自体は動作する |
