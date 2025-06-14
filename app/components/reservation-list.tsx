"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Calendar, Clock, User, Server, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface Reservation {
  id: string
  userId: string
  userName: string
  gpuType: string
  startTime: string
  endTime: string
  purpose: string
  priority: "high" | "medium" | "low"
  status: "pending" | "approved" | "rejected" | "active"
  aiReason?: string
}

interface ReservationListProps {
  reservations: Reservation[]
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>
}

export default function ReservationList({ reservations, setReservations }: ReservationListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  // フィルタリング
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.gpuType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    const matchesPriority = priorityFilter === "all" || reservation.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleStatusChange = (reservationId: string, newStatus: "approved" | "rejected") => {
    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, status: newStatus } : reservation,
      ),
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "active":
        return <Clock className="w-4 h-4 text-blue-500" />
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
      default:
        return status
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

  return (
    <div className="space-y-6">
      {/* フィルターセクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            フィルター・検索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="予約内容、ユーザー名、GPUタイプで検索..."
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
                <SelectItem value="rejected">拒否</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての優先度</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setPriorityFilter("all")
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
          filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* ヘッダー情報 */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{reservation.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{reservation.gpuType}</span>
                      </div>
                      <Badge variant={getPriorityColor(reservation.priority) as any}>
                        優先度: {getPriorityText(reservation.priority)}
                      </Badge>
                    </div>

                    {/* 予約内容 */}
                    <div>
                      <p className="text-sm font-medium mb-1">予約内容:</p>
                      <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                    </div>

                    {/* 時間情報 */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>開始: {new Date(reservation.startTime).toLocaleString("ja-JP")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>終了: {new Date(reservation.endTime).toLocaleString("ja-JP")}</span>
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

                  {/* ステータスとアクション */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(reservation.status)}
                      <span className="text-sm font-medium">{getStatusText(reservation.status)}</span>
                    </div>

                    {reservation.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(reservation.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          承認
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(reservation.id, "rejected")}
                        >
                          拒否
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle>統計情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{filteredReservations.length}</p>
              <p className="text-sm text-muted-foreground">総予約数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredReservations.filter((r) => r.status === "pending").length}
              </p>
              <p className="text-sm text-muted-foreground">待機中</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredReservations.filter((r) => r.status === "approved").length}
              </p>
              <p className="text-sm text-muted-foreground">承認済み</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {filteredReservations.filter((r) => r.status === "rejected").length}
              </p>
              <p className="text-sm text-muted-foreground">拒否</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
