# Windows ブランチ手動テストガイド

## 前提条件

- Windows 10/11
- Node.js >= 18
- Claude Code がインストール済み
- PowerShell または Windows Terminal

---

## セットアップ

```powershell
# リポジトリに移動
cd C:\path\to\claude-tool

# Windows ブランチに切り替え
git checkout windows

# 依存関係インストール
npm ci

# ビルド
npm run build

# グローバルリンク（オプション）
npm link
```

---

## チェックリスト

### 1. 基本コマンド動作

| # | テスト | コマンド | 期待結果 |
|---|--------|----------|----------|
| 1.1 | バージョン表示 | `node dist\bin\ccm.js --version` | `1.0.4` |
| 1.2 | ヘルプ表示 | `node dist\bin\ccm.js --help` | コマンド一覧表示 |
| 1.3 | セッション一覧（空） | `node dist\bin\ccm.js list` | `No active sessions` |
| 1.4 | セッションクリア | `node dist\bin\ccm.js clear` | `Sessions cleared` |

### 2. Hook イベント処理

```powershell
# まずクリア
node dist\bin\ccm.js clear
```

| # | テスト | コマンド | 期待結果 |
|---|--------|----------|----------|
| 2.1 | PreToolUse | `echo '{"session_id":"test1","cwd":"C:\\Users\\test\\proj"}' \| node dist\bin\ccm.js hook PreToolUse` | エラーなし |
| 2.2 | セッション確認 | `node dist\bin\ccm.js list` | `● ~\proj` （running） |
| 2.3 | Notification (permission) | `echo '{"session_id":"test1","cwd":"C:\\Users\\test\\proj","notification_type":"permission_prompt"}' \| node dist\bin\ccm.js hook Notification` | エラーなし |
| 2.4 | ステータス確認 | `node dist\bin\ccm.js list` | `◐ ~\proj` （waiting） |
| 2.5 | Stop イベント | `echo '{"session_id":"test1","cwd":"C:\\Users\\test\\proj"}' \| node dist\bin\ccm.js hook Stop` | エラーなし |
| 2.6 | ステータス確認 | `node dist\bin\ccm.js list` | `✓ ~\proj` （stopped） |

### 3. TTY 識別子検出

```powershell
# セッションファイル確認
type %USERPROFILE%\.claude-monitor\sessions.json
```

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 3.1 | tty 形式 | `win_<数字>`（例: `win_12345`） |
| 3.2 | session_id | `test1` |
| 3.3 | status | `stopped` |

### 4. Setup コマンド

```powershell
# 既存設定をバックアップ
copy %USERPROFILE%\.claude\settings.json %USERPROFILE%\.claude\settings.json.bak

# セットアップ実行
node dist\bin\ccm.js setup
```

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 4.1 | コマンド検出 | `Using command: ccm` または `npx claude-code-monitor` |
| 4.2 | ターゲットファイル | `~\.claude\settings.json` |
| 4.3 | Hook 追加リスト | PreToolUse, PostToolUse, Notification, Stop, UserPromptSubmit |
| 4.4 | 確認プロンプト | `Do you want to apply these changes?` |

確認後に `y` を入力：

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 4.5 | 成功メッセージ | `Setup complete! Added 5 hook(s)` |
| 4.6 | 設定確認 | `type %USERPROFILE%\.claude\settings.json \| findstr ccm` でフック設定が表示 |

```powershell
# 設定を復元（必要に応じて）
move %USERPROFILE%\.claude\settings.json.bak %USERPROFILE%\.claude\settings.json
```

### 5. TUI モニター

```powershell
node dist\bin\ccm.js watch
```

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 5.1 | 起動 | TUI が表示される |
| 5.2 | Alternate screen | 既存の出力が隠れる |
| 5.3 | キーバインド | `j/k` または `↑/↓` でカーソル移動 |
| 5.4 | 終了 | `q` または `Esc` で終了 |
| 5.5 | 画面復元 | 終了後、元の画面に戻る |

### 6. 実際の Claude Code 連携

```powershell
# 別ターミナルで Claude Code を起動
claude

# ccm で監視
node dist\bin\ccm.js watch
```

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 6.1 | セッション表示 | Claude Code のセッションが表示される |
| 6.2 | ステータス更新 | 操作に応じて `●` `◐` `✓` が変化 |
| 6.3 | パス表示 | ホームディレクトリが `~` に省略される |

### 7. フォーカス機能（Windows非対応）

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 7.1 | Enter/f キー | 何も起きない（Windowsでは非対応） |

### 8. プロセス生存確認

```powershell
# セッション作成
echo '{"session_id":"proc-test","cwd":"C:\\test"}' | node dist\bin\ccm.js hook PreToolUse

# セッション確認
node dist\bin\ccm.js list

# 親プロセスが終了した場合（シミュレーション不可だが、30分後に自動削除される）
```

| # | 確認項目 | 期待値 |
|---|----------|--------|
| 8.1 | tasklist 使用 | プロセス存在確認が動作 |
| 8.2 | タイムアウト | 30分後にセッション自動削除 |

---

## トラブルシューティング

### セッションが表示されない場合

```powershell
# 1. セッションファイル確認
type %USERPROFILE%\.claude-monitor\sessions.json

# 2. TTY が正しい形式か確認（win_<数字>）
# 3. Hook 設定確認
type %USERPROFILE%\.claude\settings.json | findstr ccm

# 4. Claude Code を再起動
```

### Hook エラーの場合

```powershell
# 手動で Hook テスト
echo '{"session_id":"debug","cwd":"C:\\temp"}' | node dist\bin\ccm.js hook PreToolUse

# エラー出力を確認
```

### tasklist エラーの場合

```powershell
# tasklist が動作するか確認
tasklist /FI "PID eq 1" /NH
```

---

## クリーンアップ

```powershell
# テストセッションをクリア
node dist\bin\ccm.js clear

# セッションファイル削除（オプション）
del %USERPROFILE%\.claude-monitor\sessions.json

# グローバルリンク解除（オプション）
npm unlink
```

---

## 合格基準

- [ ] 1.1〜1.4: 基本コマンドが動作する
- [ ] 2.1〜2.6: Hook イベントでステータスが正しく変化する
- [ ] 3.1〜3.3: TTY が `win_<数字>` 形式で記録される
- [ ] 4.1〜4.6: Setup が正常に完了する（`where` コマンド使用）
- [ ] 5.1〜5.5: TUI が正しく動作する
- [ ] 6.1〜6.3: 実際の Claude Code と連携できる
- [ ] 7.1: フォーカス機能は無効（想定通り）
- [ ] 8.1〜8.2: プロセス生存確認が動作する
