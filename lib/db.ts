import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

// モックモードの判定
const isMockMode = process.env.MOCK_MODE === "true"

// DynamoDBクライアントの初期化
const client = isMockMode ? null : new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: process.env.NODE_ENV === "development" ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
  } : undefined, // 本番環境ではIAMロールを使用
})

// DynamoDB Document Clientの作成
const ddbDocClient = isMockMode ? null : DynamoDBDocumentClient.from(client!, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
})

// テーブル名の取得
const getTableName = (tableName: string) => {
  const prefix = process.env.DYNAMODB_TABLE_PREFIX || "gpu-reservation-"
  return `${prefix}${tableName}`
}

// 予約データの型定義
export interface Reservation {
  PK: string // "RESERVATION#${id}"
  SK: string // "RESERVATION#${timestamp}"
  id: string
  userId: string
  userName: string
  gpuType: string
  startTime: string
  endTime: string
  purpose: string
  priority: "high" | "medium" | "low"
  status: "pending" | "approved" | "rejected" | "active" | "cancelled"
  aiReason?: string
  priorityScore: number
  priorityFactors?: any
  createdAt: string
  updatedAt: string
  GSI1PK?: string // for secondary index
  GSI1SK?: string // for secondary index
}

// 拒否確認リクエストの型定義
export interface RejectionRequest {
  PK: string // "REJECTION#${id}"
  SK: string // "REJECTION#${timestamp}"
  id: string
  originalReservationId: string
  conflictingReservationId: string
  requestingUserId: string
  targetUserId: string
  reason: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
  expiresAt: string
}

// ユーザーの型定義
export interface User {
  PK: string // "USER#${id}"
  SK: string // "USER#${id}"
  id: string
  name: string
  email: string
  department: string
  role: "user" | "admin"
  priorityLevel: "high" | "medium" | "low"
  createdAt: string
  updatedAt: string
}

// GPUサーバーの型定義
export interface GPUServer {
  PK: string // "SERVER#${id}"
  SK: string // "SERVER#${id}"
  id: string
  name: string
  gpuType: string
  gpuCount: number
  status: "available" | "maintenance" | "offline"
  specifications: {
    memory: string
    compute: string
    architecture: string
  }
  createdAt: string
  updatedAt: string
}

// モックデータストレージ
let mockReservations: Reservation[] = []
let mockRejections: RejectionRequest[] = []
let mockUsers: User[] = [
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
  }
]
let mockServers: GPUServer[] = [
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
  }
]

class DatabaseService {
  // 予約関連のメソッド
  async createReservation(reservation: Omit<Reservation, 'PK' | 'SK' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    const now = new Date().toISOString()
    const item: Reservation = {
      ...reservation,
      PK: `RESERVATION#${reservation.id}`,
      SK: `RESERVATION#${now}`,
      createdAt: now,
      updatedAt: now,
      GSI1PK: `USER#${reservation.userId}`,
      GSI1SK: `RESERVATION#${reservation.startTime}`,
    }

    if (isMockMode) {
      mockReservations.push(item)
      console.log(`✅ [MOCK] 予約を作成しました: ${reservation.id}`)
      return item
    }

    await ddbDocClient!.send(new PutCommand({
      TableName: getTableName("reservations"),
      Item: item,
    }))

    return item
  }

  async getReservation(id: string): Promise<Reservation | null> {
    if (isMockMode) {
      return mockReservations.find(r => r.id === id) || null
    }

    const result = await ddbDocClient!.send(new GetCommand({
      TableName: getTableName("reservations"),
      Key: {
        PK: `RESERVATION#${id}`,
        SK: `RESERVATION#${id}`,
      },
    }))

    return result.Item as Reservation || null
  }

  async getAllReservations(): Promise<Reservation[]> {
    if (isMockMode) {
      console.log(`✅ [MOCK] 全予約を取得しました: ${mockReservations.length}件`)
      return mockReservations
    }

    const result = await ddbDocClient!.send(new ScanCommand({
      TableName: getTableName("reservations"),
      FilterExpression: "begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":pk": "RESERVATION#",
      },
    }))

    return result.Items as Reservation[] || []
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    if (isMockMode) {
      return mockReservations.filter(r => r.userId === userId)
    }

    const result = await ddbDocClient!.send(new QueryCommand({
      TableName: getTableName("reservations"),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
      },
    }))

    return result.Items as Reservation[] || []
  }

  async updateReservationStatus(id: string, status: Reservation['status'], reason?: string): Promise<void> {
    if (isMockMode) {
      const index = mockReservations.findIndex(r => r.id === id)
      if (index !== -1) {
        mockReservations[index].status = status
        mockReservations[index].updatedAt = new Date().toISOString()
        if (reason) {
          mockReservations[index].aiReason = reason
        }
        console.log(`✅ [MOCK] 予約ステータスを更新しました: ${id} -> ${status}`)
      }
      return
    }

    const updateExpression = reason 
      ? "SET #status = :status, #updatedAt = :updatedAt, #aiReason = :reason"
      : "SET #status = :status, #updatedAt = :updatedAt"
    
    const expressionAttributeValues: any = {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    }

    if (reason) {
      expressionAttributeValues[":reason"] = reason
    }

    await ddbDocClient!.send(new UpdateCommand({
      TableName: getTableName("reservations"),
      Key: {
        PK: `RESERVATION#${id}`,
        SK: `RESERVATION#${id}`,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        ...(reason && { "#aiReason": "aiReason" }),
      },
      ExpressionAttributeValues: expressionAttributeValues,
    }))
  }

  async deleteReservation(id: string): Promise<void> {
    if (isMockMode) {
      const index = mockReservations.findIndex(r => r.id === id)
      if (index !== -1) {
        mockReservations.splice(index, 1)
        console.log(`✅ [MOCK] 予約を削除しました: ${id}`)
      }
      return
    }

    await ddbDocClient!.send(new DeleteCommand({
      TableName: getTableName("reservations"),
      Key: {
        PK: `RESERVATION#${id}`,
        SK: `RESERVATION#${id}`,
      },
    }))
  }

  // 拒否確認リクエスト関連のメソッド
  async createRejectionRequest(request: Omit<RejectionRequest, 'PK' | 'SK' | 'createdAt'>): Promise<RejectionRequest> {
    const now = new Date().toISOString()
    const item: RejectionRequest = {
      ...request,
      PK: `REJECTION#${request.id}`,
      SK: `REJECTION#${now}`,
      createdAt: now,
    }

    if (isMockMode) {
      mockRejections.push(item)
      console.log(`✅ [MOCK] 拒否確認リクエストを作成しました: ${request.id}`)
      return item
    }

    await ddbDocClient!.send(new PutCommand({
      TableName: getTableName("rejections"),
      Item: item,
    }))

    return item
  }

  async getPendingRejections(userId: string): Promise<RejectionRequest[]> {
    if (isMockMode) {
      console.log(`✅ [MOCK] 拒否確認リクエストを取得しました: ユーザー ${userId}`)
      return mockRejections.filter(r => r.targetUserId === userId && r.status === "pending")
    }

    const result = await ddbDocClient!.send(new ScanCommand({
      TableName: getTableName("rejections"),
      FilterExpression: "#targetUserId = :userId AND #status = :status",
      ExpressionAttributeNames: {
        "#targetUserId": "targetUserId",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":status": "pending",
      },
    }))

    return result.Items as RejectionRequest[] || []
  }

  async updateRejectionStatus(id: string, status: RejectionRequest['status']): Promise<void> {
    if (isMockMode) {
      const index = mockRejections.findIndex(r => r.id === id)
      if (index !== -1) {
        mockRejections[index].status = status
        console.log(`✅ [MOCK] 拒否確認ステータスを更新しました: ${id} -> ${status}`)
      }
      return
    }

    await ddbDocClient!.send(new UpdateCommand({
      TableName: getTableName("rejections"),
      Key: {
        PK: `REJECTION#${id}`,
        SK: `REJECTION#${id}`,
      },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    }))
  }

  // ユーザー関連のメソッド
  async createUser(user: Omit<User, 'PK' | 'SK' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString()
    const item: User = {
      ...user,
      PK: `USER#${user.id}`,
      SK: `USER#${user.id}`,
      createdAt: now,
      updatedAt: now,
    }

    if (isMockMode) {
      mockUsers.push(item)
      return item
    }

    await ddbDocClient!.send(new PutCommand({
      TableName: getTableName("users"),
      Item: item,
    }))

    return item
  }

  async getUser(id: string): Promise<User | null> {
    if (isMockMode) {
      return mockUsers.find(u => u.id === id) || null
    }

    const result = await ddbDocClient!.send(new GetCommand({
      TableName: getTableName("users"),
      Key: {
        PK: `USER#${id}`,
        SK: `USER#${id}`,
      },
    }))

    return result.Item as User || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (isMockMode) {
      return mockUsers.find(u => u.email === email) || null
    }

    const result = await ddbDocClient!.send(new ScanCommand({
      TableName: getTableName("users"),
      FilterExpression: "#email = :email",
      ExpressionAttributeNames: {
        "#email": "email",
      },
      ExpressionAttributeValues: {
        ":email": email,
      },
    }))

    return result.Items?.[0] as User || null
  }

  // GPUサーバー関連のメソッド
  async getAllServers(): Promise<GPUServer[]> {
    if (isMockMode) {
      return mockServers
    }

    const result = await ddbDocClient!.send(new ScanCommand({
      TableName: getTableName("servers"),
      FilterExpression: "begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":pk": "SERVER#",
      },
    }))

    return result.Items as GPUServer[] || []
  }

  async createServer(server: Omit<GPUServer, 'PK' | 'SK' | 'createdAt' | 'updatedAt'>): Promise<GPUServer> {
    const now = new Date().toISOString()
    const item: GPUServer = {
      ...server,
      PK: `SERVER#${server.id}`,
      SK: `SERVER#${server.id}`,
      createdAt: now,
      updatedAt: now,
    }

    if (isMockMode) {
      mockServers.push(item)
      return item
    }

    await ddbDocClient!.send(new PutCommand({
      TableName: getTableName("servers"),
      Item: item,
    }))

    return item
  }

  // 競合チェック用のメソッド
  async getConflictingReservations(gpuType: string, startTime: string, endTime: string): Promise<Reservation[]> {
    if (isMockMode) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      
      return mockReservations.filter(reservation => {
        if (reservation.gpuType !== gpuType) return false
        if (reservation.status === "rejected" || reservation.status === "cancelled") return false

        const reservationStart = new Date(reservation.startTime)
        const reservationEnd = new Date(reservation.endTime)

        // 時間の重複をチェック
        return start < reservationEnd && end > reservationStart
      })
    }

    const result = await ddbDocClient!.send(new ScanCommand({
      TableName: getTableName("reservations"),
      FilterExpression: "#gpuType = :gpuType AND #status IN (:approved, :active, :pending) AND NOT (#endTime <= :startTime OR #startTime >= :endTime)",
      ExpressionAttributeNames: {
        "#gpuType": "gpuType",
        "#status": "status",
        "#startTime": "startTime",
        "#endTime": "endTime",
      },
      ExpressionAttributeValues: {
        ":gpuType": gpuType,
        ":approved": "approved",
        ":active": "active",
        ":pending": "pending",
        ":startTime": startTime,
        ":endTime": endTime,
      },
    }))

    return result.Items as Reservation[] || []
  }
}

export const db = new DatabaseService()
export { ddbDocClient, getTableName }
