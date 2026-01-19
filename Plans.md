# Plans.md - claude-code-monitor タスク管理

## 現在のステータス

**フェーズ**: Windows ネイティブ対応完了
**最終更新**: 2026-01-19
**ブランチ**: windows

---

## 完了済み

- [x] v1.0.4 リリース（元fork）
- [x] Windows対応調査（2026-01-19）
- [x] **Windows ネイティブ対応実装**（2026-01-19）
  - [x] package.json を win32 専用に
  - [x] platform.ts ヘルパー作成（isWindows, generateWindowsTtyId, isValidWindowsTtyId）
  - [x] focus.ts を Windows 対応に書き換え（AppleScript 削除）
  - [x] ccm.tsx の TTY/パス処理を Windows 対応
  - [x] SessionCard.tsx のパス処理を Windows 対応
  - [x] setup/index.ts を where コマンドに変更
  - [x] ci.yml を Windows 専用に
  - [x] テストを Windows 対応に
  - [x] README.md を Windows 専用に
  - [x] index.ts のエクスポートを修正（isMacOS → isWindows）

---

## 削除済み（macOS専用コード）

| ファイル | 削除内容 |
|----------|----------|
| `src/utils/focus.ts` | AppleScript 実行コード全体 |
| `src/utils/focus.ts` | iTerm2, Terminal.app, Ghostty フォーカス |
| `src/utils/focus.ts` | sanitizeForAppleScript 関数 |
| `src/bin/ccm.tsx` | `ps` コマンドによるTTY取得 |
| `README.md` | macOS バッジ・記載 |

---

## 技術メモ

### Windows TTY識別子

Windowsには `/dev/tty*` が存在しないため、プロセスIDベースの識別子を使用:
```
win_<parent_process_id>
```

例: `win_12345`

### 変更したファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `package.json` | os: ["win32"] |
| `src/utils/platform.ts` | 新規作成 |
| `src/utils/focus.ts` | 完全書き換え |
| `src/bin/ccm.tsx` | Windows 用 TTY 生成 |
| `src/components/SessionCard.tsx` | パス省略処理 |
| `src/setup/index.ts` | where コマンド使用 |
| `src/index.ts` | isWindows エクスポート |
| `.github/workflows/ci.yml` | windows-latest |
| `tests/focus.test.ts` | Windows テスト |
| `README.md` | Windows 専用ドキュメント |
