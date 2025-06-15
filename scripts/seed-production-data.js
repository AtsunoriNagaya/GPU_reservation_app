const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// 本番環境設定
const region = process.env.AWS_REGION || "ap-northeast-1";
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || "gpu-reservation-prod-";

console.log(`🌱 本番環境初期データ投入開始`);
console.log(`リージョン: ${region}`);
console.log(`テーブルプレフィックス: ${tablePrefix}`);

const client = new DynamoDBClient({ region });
const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// 本番環境用の初期データ
const productionUsers = [
  {
    PK: "USER#admin-001",
    SK: "USER#admin-001",
    id: "admin-001",
    name: "システム管理者",
    email: "admin@gpu-reservation.example.com",
    department: "システム管理部",
    role: "admin",
    priorityLevel: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "USER#user-001",
    SK: "USER#user-001", 
    id: "user-001",
    name: "田中太郎",
    email: "tanaka@gpu-reservation.example.com",
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
    email: "sato@gpu-reservation.example.com",
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
    email: "yamada@gpu-reservation.example.com",
    department: "自然言語処理研究室",
    role: "user",
    priorityLevel: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const productionServers = [
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
      interconnect: "NVLink 3.0",
      host: "gpu-alpha.internal"
    },
    location: "データセンター A",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-002", 
    SK: "SERVER#server-002",
    id: "server-002",
    name: "GPU Server Beta",
    gpuType: "A100",
    gpuCount: 4,
    status: "available",
    specifications: {
      memory: "80GB HBM2e",
      compute: "19.5 TFLOPs (FP32)", 
      architecture: "Ampere",
      interconnect: "NVLink 3.0",
      host: "gpu-beta.internal"
    },
    location: "データセンター A",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-003",
    SK: "SERVER#server-003", 
    id: "server-003",
    name: "GPU Server Gamma",
    gpuType: "V100",
    gpuCount: 4,
    status: "available",
    specifications: {
      memory: "32GB HBM2",
      compute: "15.7 TFLOPs (FP32)",
      architecture: "Volta", 
      interconnect: "NVLink 2.0",
      host: "gpu-gamma.internal"
    },
    location: "データセンター B",
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
      compute: "30+ TFLOPs (FP32)",
      architecture: "Hopper",
      interconnect: "NVLink 4.0", 
      host: "gpu-delta.internal"
    },
    location: "データセンター A",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    PK: "SERVER#server-005",
    SK: "SERVER#server-005",
    id: "server-005",
    name: "GPU Server Epsilon",
    gpuType: "RTX4090", 
    gpuCount: 2,
    status: "available",
    specifications: {
      memory: "24GB GDDR6X",
      compute: "35 TFLOPs (FP32)",
      architecture: "Ada Lovelace",
      interconnect: "PCIe 4.0",
      host: "gpu-epsilon.internal"
    },
    location: "開発環境",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// サンプル予約データ（デモ用）
const sampleReservations = [
  {
    PK: "RESERVATION#res-sample-001",
    SK: "RESERVATION#" + new Date().toISOString(),
    id: "res-sample-001",
    userId: "user-001",
    userName: "田中太郎",
    gpuType: "A100",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明日
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 明日+4時間
    purpose: "深層学習モデルの訓練実験（デモデータ）",
    priority: "medium",
    status: "approved",
    aiReason: "AI優先度判定: 65% (中優先度) - 研究実験での利用",
    priorityScore: 65,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    GSI1PK: "USER#user-001",
    GSI1SK: "RESERVATION#" + new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
];

async function seedTable(tableName, data, description) {
  console.log(`\n📝 ${description}投入中...`);
  
  for (const item of data) {
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: item,
      }));
      console.log(`   ✅ ${item.name || item.id}`);
    } catch (error) {
      console.error(`   ❌ ${item.name || item.id}: ${error.message}`);
      throw error;
    }
  }
  
  console.log(`   📊 ${data.length}件のデータを投入完了`);
}

async function seedProductionData() {
  try {
    console.log(`\n🔧 DynamoDB接続確認中...`);
    
    // 各テーブルにデータを投入
    await seedTable(
      `${tablePrefix}users`, 
      productionUsers, 
      "ユーザーデータ"
    );
    
    await seedTable(
      `${tablePrefix}servers`, 
      productionServers, 
      "GPUサーバーデータ"
    );
    
    await seedTable(
      `${tablePrefix}reservations`, 
      sampleReservations, 
      "サンプル予約データ"
    );

    console.log(`\n🎉 本番環境初期データ投入完了!`);
    
    console.log(`\n📋 投入データサマリー:`);
    console.log(`   👥 ユーザー: ${productionUsers.length}件`);
    console.log(`   🖥️  GPUサーバー: ${productionServers.length}件`);
    console.log(`   📅 サンプル予約: ${sampleReservations.length}件`);
    
    console.log(`\n💡 アクセス情報:`);
    console.log(`   管理者: admin@gpu-reservation.example.com`);
    console.log(`   テストユーザー: tanaka@gpu-reservation.example.com`);
    
    console.log(`\n🚀 利用可能なGPUリソース:`);
    productionServers.forEach(server => {
      console.log(`   - ${server.name}: ${server.gpuType} × ${server.gpuCount}`);
    });

    console.log(`\n📈 次のステップ:`);
    console.log(`   1. Amplifyでアプリケーションデプロイ`);
    console.log(`   2. CloudWatch Dashboard設定`);
    console.log(`   3. 監視・アラート設定`);
    console.log(`   4. 本格運用開始`);

  } catch (error) {
    console.error(`💥 初期データ投入失敗:`, error.message);
    console.error(`\n🔍 トラブルシューティング:`);
    console.error(`   - テーブルが作成済みか確認してください`);
    console.error(`   - AWS認証情報を確認してください`);
    console.error(`   - DynamoDB書き込み権限を確認してください`);
    
    process.exit(1);
  }
}

// メイン実行
if (require.main === module) {
  seedProductionData();
}

module.exports = { seedProductionData };
