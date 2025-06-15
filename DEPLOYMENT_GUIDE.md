# 🚀 AWS本番環境デプロイガイド

このガイドでは、GPU予約システムをAWS本番環境にデプロイするための完全な手順を説明します。

## 📋 事前準備

### 1. 必要なツール・アカウント

- ✅ **AWSアカウント**: 本番環境用
- ✅ **AWS CLI**: バージョン2.x以上
- ✅ **Node.js**: 18以上
- ✅ **Git**: バージョン管理
- ✅ **Gemini API Key**: Google AI Studio

### 2. AWS認証情報の設定

```bash
# AWS CLIの設定
aws configure

# 入力項目:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: ap-northeast-1
# Default output format: json

# 設定確認
aws sts get-caller-identity
```

### 3. 必要なAWS権限

使用するIAMユーザー/ロールに以下の権限が必要です：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*",
        "amplify:*",
        "cloudformation:*",
        "cloudwatch:*",
        "sns:*",
        "logs:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🗄️ Step 1: データベースセットアップ

### 1.1 環境変数の設定

```bash
# 本番環境用の環境変数を設定
export AWS_REGION=ap-northeast-1
export DYNAMODB_TABLE_PREFIX=gpu-reservation-prod-
export NODE_ENV=production
```

### 1.2 DynamoDBテーブル作成

```bash
# 本番環境用テーブル作成
npm run setup:production

# 実行結果例:
# 🚀 本番環境DynamoDBセットアップ開始
# リージョン: ap-northeast-1
# テーブルプレフィックス: gpu-reservation-prod-
# ✅ AWS接続成功 (既存テーブル数: 0)
# 📊 本番環境DynamoDBテーブル作成開始
# 🔨 テーブル作成中: gpu-reservation-prod-reservations
# ✅ テーブル作成完了: gpu-reservation-prod-reservations
# ...
```

### 1.3 初期データ投入

```bash
# 本番環境用初期データ投入
npm run seed:production

# 実行結果例:
# 🌱 本番環境初期データ投入開始
# 📝 ユーザーデータ投入中...
#    ✅ システム管理者
#    ✅ 田中太郎
# 📝 GPUサーバーデータ投入中...
#    ✅ GPU Server Alpha
#    ✅ GPU Server Beta
# 🎉 本番環境初期データ投入完了!
```

### 1.4 データベース確認

```bash
# 作成されたテーブルの確認
npm run verify:production

# または直接AWSコマンド
aws dynamodb list-tables --region ap-northeast-1 | grep gpu-reservation-prod
```

## 🌐 Step 2: Amplifyによるフロントエンドデプロイ

### 2.1 AWS Amplifyアプリ作成

```bash
# Amplify CLIのインストール（未インストールの場合）
npm install -g @aws-amplify/cli

# Amplifyの設定
amplify configure
```

### 2.2 Amplifyプロジェクトの初期化

```bash
# プロジェクトルートで実行
amplify init

# 設定例:
# Project name: gpu-reservation-system
# Environment: production
# Default editor: Visual Studio Code
# App type: javascript
# JavaScript framework: react
# Source Directory Path: .
# Distribution Directory Path: .next
# Build Command: npm run build
# Start Command: npm run start
```

### 2.3 環境変数の設定

AWS Amplify Consoleで以下の環境変数を設定：

```bash
# 必須環境変数
GEMINI_API_KEY=your_production_gemini_api_key
AWS_REGION=ap-northeast-1
DYNAMODB_TABLE_PREFIX=gpu-reservation-prod-
NODE_ENV=production
MOCK_MODE=false

# オプション
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-production-domain.amplifyapp.com
```

### 2.4 継続的デプロイの設定

```bash
# GitHubリポジトリと連携
amplify add hosting

# 選択: Amazon CloudFront and S3
# 設定: Continuous deployment
```

## 📊 Step 3: 監視・アラート設定

### 3.1 CloudFormationスタックのデプロイ

```bash
# 監視スタックのデプロイ
aws cloudformation create-stack \
  --stack-name gpu-reservation-monitoring \
  --template-body file://aws/cloudformation/monitoring.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=TablePrefix,ParameterValue=gpu-reservation-prod- \
    ParameterKey=NotificationEmail,ParameterValue=admin@your-domain.com \
  --capabilities CAPABILITY_IAM
```

### 3.2 CloudWatchダッシュボードの確認

```bash
# デプロイ状況確認
aws cloudformation describe-stacks --stack-name gpu-reservation-monitoring

# ダッシュボードURL取得
aws cloudformation describe-stacks \
  --stack-name gpu-reservation-monitoring \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
  --output text
```

### 3.3 SNS通知の確認

1. **メール確認**: 設定したメールアドレスに確認メールが送信されます
2. **購読承認**: メール内のリンクをクリックして購読を承認
3. **テスト送信**: アラートのテスト送信を実行

## 🔒 Step 4: セキュリティ強化

### 4.1 SSL/TLS証明書の設定

```bash
# AWS Certificate Managerで証明書を取得
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names *.your-domain.com \
  --validation-method DNS \
  --region us-east-1
```

### 4.2 カスタムドメインの設定

AWS Amplify Consoleで:
1. **Domain management** > **Add domain**
2. ドメイン名を入力
3. DNS設定を更新
4. SSL証明書の自動プロビジョニング

### 4.3 WAF（Web Application Firewall）の設定

```bash
# WAF Web ACLの作成
aws wafv2 create-web-acl \
  --name gpu-reservation-waf \
  --scope CLOUDFRONT \
  --default-action Allow={} \
  --rules file://aws/waf-rules.json
```

## 🚀 Step 5: デプロイ実行

### 5.1 アプリケーションビルド確認

```bash
# ローカルでビルドテスト
npm run build

# 成功確認
ls -la .next/
```

### 5.2 Amplifyデプロイ

```bash
# デプロイ実行
amplify publish

# または Git push による自動デプロイ
git add .
git commit -m "feat: production deployment"
git push origin main
```

### 5.3 デプロイ状況確認

```bash
# Amplifyアプリの状況確認
amplify status

# デプロイログの確認
amplify console
```

## ✅ Step 6: 動作確認

### 6.1 基本機能テスト

```bash
# 本番環境でのAPIテスト
curl -X POST https://your-domain.com/api/process-reservation \
  -H "Content-Type: application/json" \
  -d '{
    "text": "明日の午後2時からA100を4時間予約したい",
    "userId": "user-001",
    "userName": "テストユーザー"
  }'
```

### 6.2 Gemini API統合確認

```bash
# Gemini API使用状況確認
curl https://your-domain.com/api/gemini-stats
```

### 6.3 データベース動作確認

```bash
# 予約一覧取得テスト
curl https://your-domain.com/api/reservations
```

## 📈 Step 7: 運用開始

### 7.1 監視ダッシュボードの確認

1. **CloudWatch Dashboard**: システム全体の監視
2. **Amplify Console**: デプロイ・パフォーマンス監視
3. **DynamoDB Console**: データベース使用状況

### 7.2 定期的なメンテナンス

```bash
# 週次バックアップ（DynamoDB）
aws dynamodb create-backup \
  --table-name gpu-reservation-prod-reservations \
  --backup-name weekly-backup-$(date +%Y%m%d)

# ログローテーション設定
aws logs put-retention-policy \
  --log-group-name /aws/amplify/gpu-reservation \
  --retention-in-days 30
```

### 7.3 スケーリング設定

```bash
# DynamoDB Auto Scaling（必要に応じて）
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id table/gpu-reservation-prod-reservations \
  --scalable-dimension dynamodb:table:ReadCapacityUnits \
  --min-capacity 5 \
  --max-capacity 100
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. DynamoDBテーブル作成エラー

```bash
# エラー: The security token included in the request is invalid
# 解決: AWS認証情報を再設定
aws configure

# エラー: Access Denied
# 解決: IAM権限を確認
aws iam get-user
```

#### 2. Amplifyビルドエラー

```bash
# Next.js 15 + Turbopack関連エラー
# 解決: amplify.ymlでlegacyビルドを使用
# build command: npm run build:legacy
```

#### 3. Gemini APIエラー

```bash
# レート制限エラー
# 解決: フォールバックモード有効化
export MOCK_MODE=true

# API Key無効エラー
# 解決: 本番用APIキーの再確認
```

#### 4. SSL証明書エラー

```bash
# 証明書検証エラー
# 解決: DNS設定の確認
dig your-domain.com

# 証明書状態確認
aws acm describe-certificate --certificate-arn your-cert-arn
```

## 📞 運用サポート

### 緊急時の対応

1. **システム障害**:
   - CloudWatch Alarmで自動検知
   - SNS通知でメール送信
   - Amplifyでのロールバック実行

2. **データベース障害**:
   - DynamoDBポイントインタイム復旧
   - バックアップからの復元

3. **API制限到達**:
   - Gemini APIフォールバック機能
   - 使用量制限の一時的緩和

### 定期メンテナンス

- **週次**: ログ確認・パフォーマンス分析
- **月次**: セキュリティ更新・依存関係更新
- **四半期**: 容量計画・コスト最適化

---

## 🎉 デプロイ完了

おめでとうございます！GPU予約システムの本番環境デプロイが完了しました。

### 📋 デプロイ後チェックリスト

- [ ] 全テーブルの作成確認
- [ ] 初期データの投入確認
- [ ] アプリケーションの動作確認
- [ ] SSL証明書の有効性確認
- [ ] 監視・アラート設定確認
- [ ] バックアップ設定確認
- [ ] ドキュメント更新

### 🔗 重要なURL

- **本番環境**: https://your-domain.com
- **CloudWatch Dashboard**: [ダッシュボードURL]
- **Amplify Console**: https://console.aws.amazon.com/amplify/
- **DynamoDB Console**: https://console.aws.amazon.com/dynamodb/

システムは本格運用可能な状態です。ユーザーへの利用案内を開始できます！
