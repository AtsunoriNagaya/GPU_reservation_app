const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  PutItemCommand,
  ListTablesCommand 
} = require("@aws-sdk/client-dynamodb");

// 本番環境設定
const region = process.env.AWS_REGION || "ap-northeast-1";
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || "gpu-reservation-prod-";

console.log(`🚀 本番環境DynamoDBセットアップ開始`);
console.log(`リージョン: ${region}`);
console.log(`テーブルプレフィックス: ${tablePrefix}`);

const client = new DynamoDBClient({ 
  region,
  // 本番環境ではIAMロールを使用（認証情報は環境変数またはロールから自動取得）
});

// テーブル定義
const tables = [
  {
    TableName: `${tablePrefix}reservations`,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" },
      { AttributeName: "GSI1SK", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "gpuType", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST", // 本番環境では従量課金
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "GPUTypeIndex",
        KeySchema: [
          { AttributeName: "gpuType", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true // 本番環境では必須
    },
    SSESpecification: {
      SSEEnabled: true // 暗号化有効
    },
    Tags: [
      { Key: "Environment", Value: "production" },
      { Key: "Project", Value: "gpu-reservation-system" },
      { Key: "Owner", Value: "AI-Development-Team" }
    ]
  },
  {
    TableName: `${tablePrefix}rejections`,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "targetUserId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "TargetUserIndex",
        KeySchema: [
          { AttributeName: "targetUserId", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: "Environment", Value: "production" },
      { Key: "Project", Value: "gpu-reservation-system" },
      { Key: "Owner", Value: "AI-Development-Team" }
    ]
  },
  {
    TableName: `${tablePrefix}users`,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [
          { AttributeName: "email", KeyType: "HASH" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: "Environment", Value: "production" },
      { Key: "Project", Value: "gpu-reservation-system" },
      { Key: "Owner", Value: "AI-Development-Team" }
    ]
  },
  {
    TableName: `${tablePrefix}servers`,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" }
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "gpuType", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "GPUTypeIndex",
        KeySchema: [
          { AttributeName: "gpuType", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" }
      }
    ],
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: "Environment", Value: "production" },
      { Key: "Project", Value: "gpu-reservation-system" },
      { Key: "Owner", Value: "AI-Development-Team" }
    ]
  }
];

async function createTableIfNotExists(tableConfig) {
  try {
    console.log(`📋 テーブル確認中: ${tableConfig.TableName}`);
    
    try {
      await client.send(new DescribeTableCommand({
        TableName: tableConfig.TableName
      }));
      console.log(`✅ テーブル既存: ${tableConfig.TableName}`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    console.log(`🔨 テーブル作成中: ${tableConfig.TableName}`);
    const result = await client.send(new CreateTableCommand(tableConfig));
    console.log(`✅ テーブル作成完了: ${tableConfig.TableName}`);
    console.log(`   ARN: ${result.TableDescription.TableArn}`);
    
    // テーブル作成完了を待機
    console.log(`⏳ テーブルアクティブ化待機中...`);
    let isActive = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isActive && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const desc = await client.send(new DescribeTableCommand({
          TableName: tableConfig.TableName
        }));
        
        if (desc.Table.TableStatus === 'ACTIVE') {
          isActive = true;
          console.log(`🎯 テーブルアクティブ: ${tableConfig.TableName}`);
        } else {
          console.log(`   状態: ${desc.Table.TableStatus} (${attempts + 1}/${maxAttempts})`);
        }
      } catch (error) {
        console.log(`   確認中... (${attempts + 1}/${maxAttempts})`);
      }
      
      attempts++;
    }

    if (!isActive) {
      throw new Error(`テーブルのアクティブ化がタイムアウトしました: ${tableConfig.TableName}`);
    }

  } catch (error) {
    console.error(`❌ テーブル作成エラー: ${tableConfig.TableName}`, error.message);
    throw error;
  }
}

async function setupProductionDatabase() {
  try {
    console.log(`\n🔧 AWS認証情報確認中...`);
    
    // 認証テスト
    const listResult = await client.send(new ListTablesCommand({}));
    console.log(`✅ AWS接続成功 (既存テーブル数: ${listResult.TableNames.length})`);

    console.log(`\n📊 本番環境DynamoDBテーブル作成開始`);
    
    for (const tableConfig of tables) {
      await createTableIfNotExists(tableConfig);
      console.log(`---`);
    }

    console.log(`\n🎉 本番環境データベースセットアップ完了!`);
    console.log(`\n📋 作成されたテーブル:`);
    for (const table of tables) {
      console.log(`   - ${table.TableName}`);
    }

    console.log(`\n💡 次のステップ:`);
    console.log(`   1. 初期データ投入: npm run seed:production`);
    console.log(`   2. アプリケーションデプロイ: AWS Amplify`);
    console.log(`   3. 監視設定: CloudWatch Dashboard`);

  } catch (error) {
    console.error(`💥 セットアップ失敗:`, error.message);
    console.error(`\n🔍 トラブルシューティング:`);
    console.error(`   - AWS認証情報を確認してください`);
    console.error(`   - DynamoDB権限を確認してください`);
    console.error(`   - リージョン設定を確認してください`);
    
    process.exit(1);
  }
}

// メイン実行
if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };
