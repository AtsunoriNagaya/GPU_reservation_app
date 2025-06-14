"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Calendar, Clock, Server, User, CheckCircle, XCircle } from "lucide-react"

interface ReservationData {
  gpuType: string
  startTime: string
  endTime: string
  purpose: string
  priority: "high" | "medium" | "low"
  aiReason?: string
}

interface ConflictingReservation {
  id: string
  userName: string
  gpuType: string
  startTime: string
  endTime: string
  purpose: string
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  reservationData: ReservationData | null
  conflicts?: ConflictingReservation[]
  isProcessing?: boolean
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  reservationData,
  conflicts = [],
  isProcessing = false,
}: ConfirmationDialogProps) {
  const hasConflicts = conflicts.length > 0

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start)
    const endTime = new Date(end)
    const diffHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))
    return `${diffHours}時間`
  }

  if (!reservationData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasConflicts ? (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                予約の競合が検出されました
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                予約内容の確認
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasConflicts
              ? "以下の予約と時間が重複しています。それでも予約を申請しますか？"
              : "以下の内容で予約を申請します。よろしいですか？"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 予約内容の表示 */}
          <Card className={hasConflicts ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">申請する予約</h3>
                  <Badge variant={getPriorityColor(reservationData.priority) as any}>
                    優先度: {getPriorityText(reservationData.priority)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">GPU:</span>
                    <span>{reservationData.gpuType}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">使用時間:</span>
                    <span>{calculateDuration(reservationData.startTime, reservationData.endTime)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">開始:</span>
                    <span>{formatDateTime(reservationData.startTime)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">終了:</span>
                    <span>{formatDateTime(reservationData.endTime)}</span>
                  </div>
                </div>

                <div>
                  <span className="font-medium">目的:</span>
                  <p className="text-sm text-muted-foreground mt-1">{reservationData.purpose}</p>
                </div>

                {reservationData.aiReason && (
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="font-medium text-blue-900">AI判定理由:</span>
                    <p className="text-sm text-blue-800 mt-1">{reservationData.aiReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 競合する予約の表示 */}
          {hasConflicts && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold">競合する予約</h3>
              </div>

              {conflicts.map((conflict, index) => (
                <Card key={conflict.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{conflict.userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{conflict.gpuType}</span>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>開始: {formatDateTime(conflict.startTime)}</span>
                          <span>終了: {formatDateTime(conflict.endTime)}</span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">目的: </span>
                        {conflict.purpose}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">注意事項:</p>
                    <ul className="text-yellow-700 mt-1 space-y-1">
                      <li>• 競合する予約がある場合、管理者による手動承認が必要です</li>
                      <li>• 優先度が高い予約が優先される可能性があります</li>
                      <li>• 代替の時間帯での予約を検討することをお勧めします</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            キャンセル
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing} variant={hasConflicts ? "destructive" : "default"}>
            {isProcessing ? "処理中..." : hasConflicts ? "競合を承知で申請" : "予約を申請"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
