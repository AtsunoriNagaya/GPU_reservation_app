// 初期データ投入スクリプト (AWS SDK v3)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb")
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

const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
})

const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || "gpu-reservation-"

// テーブル名取得
const getTableName = (tableName) => `${tablePrefix}${tableName}`

// 初期ユーザーデータ
const initialUsers = [
  {
    PK: "USER#user-001",
    SK: "USER#user-001",
    id: "user-001",
    name: "田中太郎",
    email: "tanaka@example.com",
    department: "機械学習研究室",
    role: "user",
    priorityLevel: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "USER#user-002",
    SK: "USER#user-002",
    id: "user-002",
    name: "佐藤花子",
    email: "sato@example.com",
    department: "コンピュータビジョン研究室",
    role: "user",
    priorityLevel: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "USER#user-003",
    SK: "USER#user-003",
    id: "user-003",
    name: "山田次郎",
    email: "yamada@example.com",
    department: "自然言語処理研究室",
    role: "user",
    priorityLevel: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "USER#admin-001",
    SK: "USER#admin-001",
    id: "admin-001",
    name: "管理者",
    email: "admin@example.com",
    department: "システム管理",
    role: "admin",
    priorityLevel: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// 初期GPUサーバーデータ
const initialServers = [
  {
    PK: "SERVER#server-001",
    SK: "SERVER#server-001",
    id: "server-001",
    name: "GPU Server Alpha",
    gpuType: "A100",
    gpuCount: 8,
    status: "available",
    specifications: {
      memory: "80GB HBM2e",
      compute: "19.5 TFLOPs (FP32)",
      architecture: "Ampere",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-002",
    SK: "SERVER#server-002",
    id: "server-002",
    name: "GPU Server Beta",
    gpuType: "V100",
    gpuCount: 4,
    status: "available",
    specifications: {
      memory: "32GB HBM2",
      compute: "15.7 TFLOPs (FP32)",
      architecture: "Volta",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-003",
    SK: "SERVER#server-003",
    id: "server-003",
    name: "GPU Server Gamma",
    gpuType: "RTX4090",
    gpuCount: 2,
    status: "available",
    specifications: {
      memory: "24GB GDDR6X",
      compute: "35.58 TFLOPs (FP32)",
      architecture: "Ada Lovelace",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-004",
    SK: "SERVER#server-004",
    id: "server-004",
    name: "GPU Server Delta",
    gpuType: "H100",
    gpuCount: 8,
    status: "available",
    specifications: {
      memory: "80GB HBM3",
      compute: "60 TFLOPs (FP32)",
      architecture: "Hopper",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-005",
    SK: "SERVER#server-005",
    id: "server-005",
    name: "GPU Server Epsilon",
    gpuType: "A100",
    gpuCount: 4,
    status: "maintenance",
    specifications: {
      memory: "40GB HBM2e",
      compute: "19.5 TFLOPs (FP32)",
      architecture: "Ampere",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// サンプル予約データ (デモ用)
const generateSampleReservations = () => {
  const now = new Date()
  const reservations = []

  // 過去の予約 (完了済み)
  reservations.push({
    PK: "RESERVATION#res-001",
    SK: "RESERVATION#2025-06-13T10:00:00.000Z",
    id: "res-001",
    userId: "user-001",
    userName: "田中太郎",
    gpuType: "A100",
    startTime: "2025-06-13T10:00:00.000Z",
    endTime: "2025-06-13T14:00:00.000Z",
    purpose: "機械学習モデルの学習実験",
    priority: "medium",
    status: "approved",
    aiReason: "AI優先度判定: 65% (中優先度)",
    priorityScore: 65,
    createdAt: "2025-06-13T09:00:00.000Z",
    updatedAt: "2025-06-13T09:30:00.000Z",
    GSI1PK: "USER#user-001",
    GSI1SK: "RESERVATION#2025-06-13T10:00:00.000Z",
  })

  // 現在進行中の予約
  const activeStart = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2時間前開始
  const activeEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2時間後終了
  
  reservations.push({
    PK: "RESERVATION#res-002",
    SK: `RESERVATION#${activeStart.toISOString()}`,
    id: "res-002",
    userId: "user-002",
    userName: "佐藤花子",
    gpuType: "V100",
    startTime: activeStart.toISOString(),
    endTime: activeEnd.toISOString(),
    purpose: "深層学習による画像認識研究",
    priority: "high",
    status: "active",
    aiReason: "AI優先度判定: 85% (高優先度)",
    priorityScore: 85,
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    GSI1PK: "USER#user-002",
    GSI1SK: `RESERVATION#${activeStart.toISOString()}`,
  })

  // 未来の予約 (承認待ち)
  const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 明日
  const futureEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000) // 明日+4時間
  
  reservations.push({
    PK: "RESERVATION#res-003",
    SK: `RESERVATION#${futureStart.toISOString()}`,
    id: "res-003",
    userId: "user-003",
    userName: "山田次郎",
    gpuType: "RTX4090",
    startTime: futureStart.toISOString(),
    endTime: futureEnd.toISOString(),
    purpose: "自然言語処理モデルの実験",
    priority: "medium",
    status: "pending",
    aiReason: "AI優先度判定: 55% (中優先度)",
    priorityScore: 55,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    GSI1PK: "USER#user-003",
    GSI1SK: `RESERVATION#${futureStart.toISOString()}`,
  })

  return reservations
}

// バッチ書き込み関数
async function batchWriteItems(tableName, items) {
  const batchSize = 25 // DynamoDBの制限
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const putRequests = batch.map(item => ({
      PutRequest: { Item: item }
    }))

    const params = {
      RequestItems: {
        [tableName]: putRequests
      }
    }

    try {
      await ddbDocClient.send(new BatchWriteCommand(params))
      console.log(`✅ ${tableName} に ${batch.length} 件のアイテムを書き込みました (${i + 1}-${i + batch.length})`)
    } catch (error) {
      console.error(`❌ ${tableName} のバッチ書き込みでエラー:`, error)
      throw error
    }

    // APIレート制限を避けるため少し待機
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

// 単一アイテム書き込み関数
async function putItem(tableName, item) {
  try {
    await ddbDocClient.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }))
    console.log(`✅ ${tableName} にアイテムを書き込みました: ${item.id || item.PK}`)
  } catch (error) {
    console.error(`❌ ${tableName} の書き込みでエラー:`, error)
    throw error
  }
}

// ユーザーデータの投入
async function seedUsers() {
  console.log("👥 ユーザーデータを投入中...")
  const tableName = getTableName("users")
  
  for (const user of initialUsers) {
    await putItem(tableName, user)
  }
  
  console.log(`✅ ${initialUsers.length} 人のユーザーデータを投入しました`)
}

// GPUサーバーデータの投入
async function seedServers() {
  console.log("🖥️  GPUサーバーデータを投入中...")
  const tableName = getTableName("servers")
  
  for (const server of initialServers) {
    await putItem(tableName, server)
  }
  
  console.log(`✅ ${initialServers.length} 台のGPUサーバーデータを投入しました`)
}

// サンプル予約データの投入
async function seedReservations() {
  console.log("📅 サンプル予約データを投入中...")
  const tableName = getTableName("reservations")
  const reservations = generateSampleReservations()
  
  for (const reservation of reservations) {
    await putItem(tableName, reservation)
  }
  
  console.log(`✅ ${reservations.length} 件のサンプル予約データを投入しました`)
}

// メイン実行関数
async function main() {
  console.log("🌱 初期データの投入を開始します...")
  console.log(`📋 テーブルプレフィックス: ${tablePrefix}`)
  
  try {
    await seedUsers()
    await seedServers()
    await seedReservations()
    
    console.log("🎉 すべての初期データの投入が完了しました!")
    console.log("")
    console.log("📊 投入されたデータの概要:")
    console.log(`   - ユーザー: ${initialUsers.length} 人`)
    console.log(`   - GPUサーバー: ${initialServers.length} 台`)
    console.log(`   - サンプル予約: 3 件`)
    console.log("")
    console.log("🚀 アプリケーションを起動する準備ができました!")
    
  } catch (error) {
    console.error("💥 データ投入中にエラーが発生しました:", error)
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
  seedUsers,
  seedServers,
  seedReservations,
  main,
  initialUsers,
  initialServers,
}
