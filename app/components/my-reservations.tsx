"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Calendar, Clock, Server, AlertCircle, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  userId: string
  userName: string
  gpuType: string
  startTime: string
  endTime: string
  purpose: string
  priority: "high" | "medium" | "low"
  status: "pending" | "approved" | "rejected" | "active" | "completed" | "cancelled"
  aiReason?: string
  createdAt: string
}

interface MyReservationsProps {
  reservations: Reservation[]
  currentUserId: string
  onCancelReservation: (id: string) => void
}

export default function MyReservations({ reservations, currentUserId, onCancelReservation }: MyReservationsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const { toast } = useToast()

  // 自分の予約のみフィルタリング
  const myReservations = reservations.filter((reservation) => reservation.userId === currentUserId)

  // 検索とフィルタリング
  const filteredReservations = myReservations.filter((reservation) => {
    const matchesSearch =
      reservation.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.gpuType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "active":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-gray-500" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "承認済み"
      case "rejected":
        return "拒否"
      case "active":
        return "実行中"
      case "pending":
        return "待機中"
      case "completed":
        return "完了"
      case "cancelled":
        return "キャンセル"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "active":
        return "default"
      case "pending":
        return "secondary"
      case "completed":
        return "outline"
      case "cancelled":
        return "outline"
      default:
        return "secondary"
    }
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

  const canCancelReservation = (reservation: Reservation) => {
    return ["pending", "approved"].includes(reservation.status) && new Date(reservation.startTime) > new Date()
  }

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = () => {
    if (selectedReservation) {
      onCancelReservation(selectedReservation.id)
      setShowCancelDialog(false)
      setSelectedReservation(null)
      toast({
        title: "予約をキャンセル",
        description: "予約が正常にキャンセルされました。",
      })
    }
  }

  // 統計情報の計算
  const stats = {
    total: myReservations.length,
    pending: myReservations.filter((r) => r.status === "pending").length,
    approved: myReservations.filter((r) => r.status === "approved").length,
    active: myReservations.filter((r) => r.status === "active").length,
    completed: myReservations.filter((r) => r.status === "completed").length,
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">総予約数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">待機中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">承認済み</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">実行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">完了</div>
          </CardContent>
        </Card>
      </div>

      {/* フィルターセクション */}
      <Card>
        <CardHeader>
          <CardTitle>予約検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="目的やGPUタイプで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="pending">待機中</SelectItem>
                <SelectItem value="approved">承認済み</SelectItem>
                <SelectItem value="active">実行中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="rejected">拒否</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
              }}
            >
              リセット
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 予約一覧 */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">条件に一致する予約が見つかりません</p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* ヘッダー情報 */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{reservation.gpuType}</span>
                        </div>
                        <Badge variant={getPriorityColor(reservation.priority) as any}>
                          優先度: {getPriorityText(reservation.priority)}
                        </Badge>
                        <Badge variant={getStatusColor(reservation.status) as any}>
                          {getStatusIcon(reservation.status)}
                          <span className="ml-1">{getStatusText(reservation.status)}</span>
                        </Badge>
                      </div>

                      {/* 予約内容 */}
                      <div>
                        <p className="text-sm font-medium mb-1">予約内容:</p>
                        <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                      </div>

                      {/* 時間情報 */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>開始: {formatDateTime(reservation.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>終了: {formatDateTime(reservation.endTime)}</span>
                        </div>
                      </div>

                      {/* AI判定理由 */}
                      {reservation.aiReason && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">AI判定理由:</p>
                          <p className="text-sm text-blue-800">{reservation.aiReason}</p>
                        </div>
                      )}
                    </div>

                    {/* アクション */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-xs text-muted-foreground">
                        申請日: {formatDateTime(reservation.createdAt)}
                      </div>

                      {canCancelReservation(reservation) && (
                        <Button size="sm" variant="destructive" onClick={() => handleCancelClick(reservation)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          キャンセル
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* キャンセル確認ダイアログ */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約のキャンセル</DialogTitle>
            <DialogDescription>本当にこの予約をキャンセルしますか？この操作は取り消せません。</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="py-4">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>GPU:</strong> {selectedReservation.gpuType}
                </div>
                <div>
                  <strong>開始時間:</strong> {formatDateTime(selectedReservation.startTime)}
                </div>
                <div>
                  <strong>終了時間:</strong> {formatDateTime(selectedReservation.endTime)}
                </div>
                <div>
                  <strong>目的:</strong> {selectedReservation.purpose}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              取り消し
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              キャンセル実行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
