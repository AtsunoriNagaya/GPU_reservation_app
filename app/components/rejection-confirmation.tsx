"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Calendar, Clock, Server, User, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingRejection {
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

interface RejectionConfirmationProps {
  pendingRejections: PendingRejection[]
  onAcceptRejection: (id: string, reason?: string) => void
  onDeclineRejection: (id: string, reason?: string) => void
}

export default function RejectionConfirmation({
  pendingRejections,
  onAcceptRejection,
  onDeclineRejection,
}: RejectionConfirmationProps) {
  const [responses, setResponses] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        return priority
    }
  }

  const handleAccept = (rejectionId: string) => {
    onAcceptRejection(rejectionId, responses[rejectionId])
    toast({
      title: "予約拒否を承諾",
      description: "予約の拒否を承諾しました。",
    })
  }

  const handleDecline = (rejectionId: string) => {
    onDeclineRejection(rejectionId, responses[rejectionId])
    toast({
      title: "予約拒否を拒否",
      description: "予約の拒否を拒否しました。管理者による調整が必要です。",
    })
  }

  if (pendingRejections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">拒否確認待ちの予約はありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {pendingRejections.map((rejection) => (
        <Card key={rejection.id} className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              予約拒否の確認依頼
            </CardTitle>
            <CardDescription className="text-orange-700">
              あなたの予約と競合する高優先度の予約が申請されました。予約の拒否を承諾しますか？
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 予約競合情報 */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                競合の詳細
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>拒否対象予約ID: {rejection.conflictingReservationId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span>新規予約ID: {rejection.originalReservationId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>申請日時: {formatDateTime(rejection.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>期限: {formatDateTime(rejection.expiresAt)}</span>
                </div>
              </div>
            </div>

            {/* AI判定理由 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">優先度判定理由</h4>
              <p className="text-sm text-blue-700">{rejection.reason}</p>
            </div>

            {/* 状況説明 */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">📋 状況説明</h4>
              <p className="text-sm text-yellow-700">
                より高い優先度の予約申請があったため、あなたの予約の取り消しが要求されています。
                AIシステムが分析した結果、新しい予約の方が緊急性・重要性が高いと判定されました。
              </p>
            </div>

            {/* 返答入力 */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                返答・コメント（任意）
              </label>
              <Textarea
                placeholder="拒否を承諾する理由や、代替案などがあればご記入ください..."
                value={responses[rejection.id] || ""}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    [rejection.id]: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* アクションボタン */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => handleAccept(rejection.id)} variant="destructive" className="flex-1">
                拒否を承諾する
              </Button>
              <Button onClick={() => handleDecline(rejection.id)} variant="outline" className="flex-1">
                拒否を拒否する
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
              <p>
                <strong>注意:</strong> 「拒否を拒否する」を選択した場合、管理者による手動調整が必要になります。
                可能であれば代替の時間帯での予約を検討することをお勧めします。
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
