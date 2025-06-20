# GPU予約システム デモガイド

## 🎯 システム概要

この GPU予約システムは、自然言語・音声入力対応のインテリジェントな予約システムです。現在**モックモード**で動作しており、実際のAWS DynamoDBやGemini APIに接続せずに、ローカルでフル機能をテストできます。

## 🚀 起動方法

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 👤 テストユーザー

以下のユーザーでログインできます：

| ユーザー名 | メールアドレス | 権限 | 所属 |
|------------|----------------|------|------|
| 田中太郎 | tanaka@example.com | user | 機械学習研究室 |
| 佐藤花子 | sato@example.com | user | コンピュータビジョン研究室 |
| 管理者 | admin@example.com | admin | システム管理 |

## 🎤 予約申請のテスト例

### 基本的な予約申請

以下のテキストを入力して予約申請をテストしてください：

#### 例1: 基本的な予約
```
明日の午後2時から4時まで、機械学習の実験でA100を使いたいです
```

#### 例2: 緊急度の高い予約
```
今日中に論文の実験を完了させる必要があります。A100を4時間使用したいです
```

#### 例3: 医療関連（高優先度）
```
明日の朝9時から、医療画像診断AIの緊急実験でH100を6時間予約したいです
```

#### 例4: 学習目的（低優先度）
```
来週、深層学習の勉強でV100を2時間ほど使わせてください
```

#### 例5: 科研費プロジェクト（高優先度）
```
科研費プロジェクトの災害予防システム開発で、明日の午前中にA100クラスターを4時間予約したいです
```

## 🔍 AI判定システムの確認ポイント

### 優先度判定要素

1. **締切の緊急性**
   - キーワード: 「今日中」「緊急」「論文」「発表」「締切」
   - 判定: immediate > urgent > moderate > flexible

2. **社会的インパクト**
   - 医療: 「医療」「医学」「診断」
   - 災害予防: 「災害」「防災」「緊急対応」
   - 気候変動: 「気候」「環境」「温暖化」

3. **外部資金**
   - キーワード: 「科研費」「産学連携」「国際プロジェクト」

4. **研究 vs 学習**
   - 研究: 「実験」「開発」「研究」
   - 学習: 「勉強」「学習」「練習」

### 優先度スコア

- **高優先度 (80+%)**: 医療・災害予防 + 緊急性 + 外部資金
- **中優先度 (50-79%)**: 基本的な研究実験
- **低優先度 (0-49%)**: 学習・練習目的

## 📊 ダッシュボード機能

1. **予約申請**: 自然言語/音声で予約作成
2. **ダッシュボード**: 予約状況の可視化
3. **予約一覧**: 全予約の管理
4. **拒否確認**: 競合時の調整機能
5. **マイ予約**: 個人の予約管理

## 🔧 システム状態確認

### ログ出力での確認

開発サーバーのターミナルで以下のログが確認できます：

```
✅ [MOCK] 予約を作成しました: res-xxx
🔄 [FALLBACK] Gemini APIの代わりに簡易パーサーを使用します
✅ [MOCK] 全予約を取得しました: X件
```

### ブラウザ開発者ツール

1. F12でDevToolsを開く
2. Consoleタブで詳細ログを確認
3. Networkタブで API通信を確認

## 🎯 テストシナリオ

### シナリオ1: 基本的な予約フロー
1. ログイン（田中太郎）
2. 「明日の10時から12時まで、深層学習の実験でV100を使いたいです」で予約申請
3. 確認ダイアログで内容確認
4. 予約一覧で作成された予約を確認

### シナリオ2: 高優先度予約
1. ログイン（佐藤花子）
2. 「今日中に医療画像AIの緊急実験でA100を4時間使いたいです」で予約申請
3. 高優先度判定の確認
4. 自動承認の確認

### シナリオ3: 音声入力テスト
1. マイクボタンをクリック
2. ブラウザの録音許可
3. 音声で予約内容を話す
4. 音声認識結果の確認

## 📝 機能制限（モックモード）

現在のモックモードでは以下の制限があります：

- **データ永続化なし**: ページリロードでデータリセット
- **Gemini API**: フォールバック処理で簡易パーサーを使用
- **DynamoDB**: メモリ内データストレージを使用
- **認証**: 簡易認証（実際のパスワード検証なし）

## 🔄 本番環境への移行

本番環境で使用する場合は：

1. **AWS設定**
   ```bash
   # .env.localでMOCK_MODE=falseに変更
   MOCK_MODE=false
   AWS_ACCESS_KEY_ID=実際のキー
   AWS_SECRET_ACCESS_KEY=実際のシークレット
   ```

2. **DynamoDBテーブル作成**
   ```bash
   npm run setup:db
   npm run seed:data
   ```

3. **Gemini API設定**
   ```bash
   GEMINI_API_KEY=実際のAPIキー
   ```

## 🐛 トラブルシューティング

### よくある問題

1. **音声認識が動かない**
   - HTTPSが必要な場合があります
   - ブラウザの録音許可を確認

2. **予約が表示されない**
   - ページリロードを試す
   - 開発者ツールでエラー確認

3. **TypeScriptエラー**
   - 機能的には動作します
   - 型定義の不整合による警告

### デバッグ方法

```bash
# 詳細ログ確認
tail -f .next/trace

# API直接テスト
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-001","userName":"テスト","gpuType":"A100","startTime":"2025-06-15T10:00:00Z","endTime":"2025-06-15T14:00:00Z","purpose":"テスト予約"}'
```

## 🎉 成功指標

正常に動作している場合の確認ポイント：

- ✅ ログイン画面が表示される
- ✅ 予約申請で確認ダイアログが開く
- ✅ 予約一覧に新しい予約が表示される
- ✅ ダッシュボードでグラフが表示される
- ✅ 開発者ツールでMOCKログが出力される

---

**注意**: このデモは開発・テスト用です。本番環境では適切なセキュリティ設定とデータベース設定が必要です。
