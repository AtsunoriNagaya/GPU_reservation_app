import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: 全予約の取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    let reservations
    
    if (userId) {
      // 特定ユーザーの予約を取得
      reservations = await db.getUserReservations(userId)
    } else {
      // 全予約を取得
      reservations = await db.getAllReservations()
    }

    // ステータスでフィルタリング
    if (status) {
      reservations = reservations.filter(r => r.status === status)
    }

    // 時間順にソート (新しい順)
    reservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length,
    })
  } catch (error) {
    console.error("予約取得エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "予約の取得中にエラーが発生しました" 
    }, { status: 500 })
  }
}

// POST: 新規予約の作成 (process-reservationと重複するが、直接的な予約用)
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userName, 
      gpuType, 
      startTime, 
      endTime, 
      purpose,
      priority = "medium" 
    } = await request.json()

    // 必須フィールドの検証
    if (!userId || !userName || !gpuType || !startTime || !endTime || !purpose) {
      return NextResponse.json({ 
        success: false, 
        error: "必須フィールドが不足しています" 
      }, { status: 400 })
    }

    // 時間の妥当性チェック
    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()

    if (start >= end) {
      return NextResponse.json({ 
        success: false, 
        error: "終了時刻は開始時刻より後である必要があります" 
      }, { status: 400 })
    }

    if (start < now) {
      return NextResponse.json({ 
        success: false, 
        error: "過去の時刻は指定できません" 
      }, { status: 400 })
    }

    // 競合チェック
    const conflicts = await db.getConflictingReservations(gpuType, startTime, endTime)

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const reservation = await db.createReservation({
      id: reservationId,
      userId,
      userName,
      gpuType,
      startTime,
      endTime,
      purpose,
      priority: priority as "high" | "medium" | "low",
      status: conflicts.length > 0 ? "pending" : "approved",
      priorityScore: priority === "high" ? 80 : priority === "medium" ? 60 : 40,
      aiReason: `手動予約: ${priority}優先度`,
    })

    return NextResponse.json({
      success: true,
      reservation,
      conflicts,
      message: conflicts.length > 0 ? "競合があるため承認待ちです" : "予約が完了しました",
    })
  } catch (error) {
    console.error("予約作成エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "予約の作成中にエラーが発生しました" 
    }, { status: 500 })
  }
}
