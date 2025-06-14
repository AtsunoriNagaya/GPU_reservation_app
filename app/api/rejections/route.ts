import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: 拒否確認リクエストの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "ユーザーIDが必要です" 
      }, { status: 400 })
    }

    let rejections = await db.getPendingRejections(userId)

    // ステータスでフィルタリング
    if (status) {
      rejections = rejections.filter(r => r.status === status)
    }

    // 時間順にソート (新しい順)
    rejections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      rejections,
      count: rejections.length,
    })
  } catch (error) {
    console.error("拒否確認取得エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "拒否確認の取得中にエラーが発生しました" 
    }, { status: 500 })
  }
}

// POST: 拒否確認リクエストへの応答
export async function POST(request: NextRequest) {
  try {
    const { 
      rejectionId, 
      response, // "accepted" or "declined"
      userId,
      reason = ""
    } = await request.json()

    if (!rejectionId || !response || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: "必須フィールドが不足しています" 
      }, { status: 400 })
    }

    if (!["accepted", "declined"].includes(response)) {
      return NextResponse.json({ 
        success: false, 
        error: "無効な応答です" 
      }, { status: 400 })
    }

    // 拒否確認リクエストのステータスを更新
    await db.updateRejectionStatus(rejectionId, response)

    // 応答に基づいて予約のステータスを更新
    if (response === "accepted") {
      // 拒否を承諾した場合
      // 1. 元の予約を承認
      // 2. 競合する予約をキャンセル
      
      // TODO: 拒否確認の詳細を取得して関連予約を更新
      // const rejectionDetails = await db.getRejectionRequest(rejectionId)
      // await db.updateReservationStatus(rejectionDetails.originalReservationId, "approved", "拒否承諾により承認")
      // await db.updateReservationStatus(rejectionDetails.conflictingReservationId, "cancelled", "他の予約に優先度を譲渡")
      
    } else {
      // 拒否を拒否した場合
      // 管理者による手動判定が必要
      
      // TODO: 管理者通知システムの実装
    }

    return NextResponse.json({
      success: true,
      message: response === "accepted" ? "拒否を承諾しました" : "拒否を拒否しました",
      response,
    })
  } catch (error) {
    console.error("拒否確認応答エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "拒否確認の応答中にエラーが発生しました" 
    }, { status: 500 })
  }
}
