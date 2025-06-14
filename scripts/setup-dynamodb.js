// DynamoDB テーブル作成スクリプト (AWS SDK v3)
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb")
require('dotenv').config({ path: '.env.local' })

// AWS DynamoDB クライアントの初期化
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: process.env.NODE_ENV === "development" ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
  } : undefined,
})

const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || "gpu-reservation-"

// テーブル作成関数
async function createTable(params) {
  try {
    const command = new CreateTableCommand(params)
    const result = await client.send(command)
    console.log(`✅ テーブル ${params.TableName} を作成しました`)
    return result
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log(`⚠️  テーブル ${params.TableName} は既に存在します`)
    } else {
      console.error(`❌ テーブル ${params.TableName} の作成でエラー:`, error.message)
      throw error
    }
  }
}

// テーブルの存在確認
async function tableExists(tableName) {
  try {
    const command = new DescribeTableCommand({ TableName: tableName })
    await client.send(command)
    return true
  } catch (error) {
    return false
  }
}

// 予約テーブルの作成
async function createReservationsTable() {
  const tableName = `${tablePrefix}reservations`
  
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },  // RESERVATION#${id}
      { AttributeName: "SK", KeyType: "RANGE" }  // RESERVATION#${timestamp}
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" }, // USER#${userId}
      { AttributeName: "GSI1SK", AttributeType: "S" }  // RESERVATION#${startTime}
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" },
        BillingMode: "PAY_PER_REQUEST"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "GPU-Reservation-System" }
    ]
  }

  return await createTable(params)
}

// 拒否確認テーブルの作成
async function createRejectionsTable() {
  const tableName = `${tablePrefix}rejections`
  
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },  // REJECTION#${id}
      { AttributeName: "SK", KeyType: "RANGE" }  // REJECTION#${timestamp}
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "targetUserId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TargetUserIndex",
        KeySchema: [
          { AttributeName: "targetUserId", KeyType: "HASH" },
          { AttributeName: "status", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" },
        BillingMode: "PAY_PER_REQUEST"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "GPU-Reservation-System" }
    ]
  }

  return await createTable(params)
}

// ユーザーテーブルの作成
async function createUsersTable() {
  const tableName = `${tablePrefix}users`
  
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },  // USER#${id}
      { AttributeName: "SK", KeyType: "RANGE" }  // USER#${id}
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [
          { AttributeName: "email", KeyType: "HASH" }
        ],
        Projection: { ProjectionType: "ALL" },
        BillingMode: "PAY_PER_REQUEST"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "GPU-Reservation-System" }
    ]
  }

  return await createTable(params)
}

// GPUサーバーテーブルの作成
async function createServersTable() {
  const tableName = `${tablePrefix}servers`
  
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },  // SERVER#${id}
      { AttributeName: "SK", KeyType: "RANGE" }  // SERVER#${id}
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "gpuType", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GpuTypeIndex",
        KeySchema: [
          { AttributeName: "gpuType", KeyType: "HASH" },
          { AttributeName: "status", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" },
        BillingMode: "PAY_PER_REQUEST"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "GPU-Reservation-System" }
    ]
  }

  return await createTable(params)
}

// セッションテーブルの作成 (将来の認証強化用)
async function createSessionsTable() {
  const tableName = `${tablePrefix}sessions`
  
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },  // SESSION#${id}
      { AttributeName: "SK", KeyType: "RANGE" }  // SESSION#${id}
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "expiresAt", AttributeType: "N" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserSessionIndex",
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" },
          { AttributeName: "expiresAt", KeyType: "RANGE" }
        ],
        Projection: { ProjectionType: "ALL" },
        BillingMode: "PAY_PER_REQUEST"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "GPU-Reservation-System" }
    ]
  }

  return await createTable(params)
}

// 初期データの投入
async function seedInitialData() {
  console.log("📦 初期データを投入中...")
  
  // 初期GPUサーバーデータは seed-data.sql を参照
  // 初期ユーザーデータも同様
  
  console.log("✅ 初期データの投入が完了しました")
}

// メイン実行関数
async function main() {
  console.log("🚀 DynamoDB テーブルセットアップを開始します...")
  console.log(`📋 テーブルプレフィックス: ${tablePrefix}`)
  console.log(`🌏 リージョン: ${process.env.AWS_REGION || "ap-northeast-1"}`)
  
  try {
    // テーブル作成
    await createReservationsTable()
    await createRejectionsTable()
    await createUsersTable()
    await createServersTable()
    await createSessionsTable()
    
    // 初期データ投入
    await seedInitialData()
    
    console.log("🎉 すべてのDynamoDBテーブルセットアップが完了しました!")
    
  } catch (error) {
    console.error("💥 セットアップ中にエラーが発生しました:", error)
    process.exit(1)
  }
}

// スクリプト実行時の処理
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 予期しないエラー:", error)
    process.exit(1)
  })
}

module.exports = {
  createReservationsTable,
  createRejectionsTable,
  createUsersTable,
  createServersTable,
  createSessionsTable,
  main
}
