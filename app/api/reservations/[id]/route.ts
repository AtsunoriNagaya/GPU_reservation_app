import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: 特定予約の取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const reservation = await db.getReservation(id)
    
    if (!reservation) {
      return NextResponse.json({ 
        success: false, 
        error: "予約が見つかりません" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reservation,
    })
  } catch (error) {
    console.error("予約取得エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "予約の取得中にエラーが発生しました" 
    }, { status: 500 })
  }
}

// PUT: 予約の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, reason, adminUserId } = await request.json()

    // 現在の予約を取得
    const existingReservation = await db.getReservation(id)
    if (!existingReservation) {
      return NextResponse.json({ 
        success: false, 
        error: "予約が見つかりません" 
      }, { status: 404 })
    }

    // ステータス更新の検証
    const validStatuses = ["pending", "approved", "rejected", "active", "cancelled"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: "無効なステータスです" 
      }, { status: 400 })
    }

    // ステータス更新
    if (status) {
      const updateReason = reason || `ステータスを${status}に更新${adminUserId ? ` (管理者: ${adminUserId})` : ''}`
      await db.updateReservationStatus(id, status, updateReason)
    }

    // 更新後の予約を取得
    const updatedReservation = await db.getReservation(id)

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      message: `予約のステータスが${status}に更新されました`,
    })
  } catch (error) {
    console.error("予約更新エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "予約の更新中にエラーが発生しました" 
    }, { status: 500 })
  }
}

// DELETE: 予約の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, reason = "ユーザーによる削除" } = await request.json()

    // 現在の予約を取得
    const existingReservation = await db.getReservation(id)
    if (!existingReservation) {
      return NextResponse.json({ 
        success: false, 
        error: "予約が見つかりません" 
      }, { status: 404 })
    }

    // 権限チェック（予約者本人または管理者のみ削除可能）
    if (userId && existingReservation.userId !== userId) {
      // TODO: 管理者権限チェックを追加
      return NextResponse.json({ 
        success: false, 
        error: "この予約を削除する権限がありません" 
      }, { status: 403 })
    }

    // 予約を削除
    await db.deleteReservation(id)

    return NextResponse.json({
      success: true,
      message: "予約が削除されました",
      deletedReservation: existingReservation,
    })
  } catch (error) {
    console.error("予約削除エラー:", error)
    return NextResponse.json({ 
      success: false, 
      error: "予約の削除中にエラーが発生しました" 
    }, { status: 500 })
  }
}
