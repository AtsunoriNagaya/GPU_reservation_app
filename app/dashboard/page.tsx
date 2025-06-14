"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Server, Clock, AlertTriangle, CheckCircle } from "lucide-react"

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

interface DashboardProps {
  reservations: Reservation[]
}

export default function Dashboard({ reservations }: DashboardProps) {
  // 統計データの計算
  const totalReservations = reservations.length
  const activeReservations = reservations.filter((r) => r.status === "active").length
  const pendingReservations = reservations.filter((r) => r.status === "pending").length
  const approvedReservations = reservations.filter((r) => r.status === "approved").length

  // GPU使用率データ
  const gpuUsageData = [
    { name: "A100", usage: 75, total: 8, used: 6 },
    { name: "V100", usage: 50, total: 12, used: 6 },
    { name: "RTX 4090", usage: 25, total: 16, used: 4 },
    { name: "H100", usage: 90, total: 4, used: 3.6 },
  ]

  // 予約状況データ
  const statusData = [
    { name: "承認済み", value: approvedReservations, color: "#10b981" },
    { name: "待機中", value: pendingReservations, color: "#f59e0b" },
    { name: "実行中", value: activeReservations, color: "#3b82f6" },
    { name: "拒否", value: reservations.filter((r) => r.status === "rejected").length, color: "#ef4444" },
  ]

  // 時間別使用量データ
  const hourlyUsageData = [
    { hour: "00:00", usage: 20 },
    { hour: "04:00", usage: 15 },
    { hour: "08:00", usage: 45 },
    { hour: "12:00", usage: 70 },
    { hour: "16:00", usage: 85 },
    { hour: "20:00", usage: 60 },
  ]

  return (
    <div className="space-y-6">
      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総予約数</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations}</div>
            <p className="text-xs text-muted-foreground">+12% 前月比</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">実行中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReservations}</div>
            <p className="text-xs text-muted-foreground">現在実行中の予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待機中</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReservations}</div>
            <p className="text-xs text-muted-foreground">承認待ちの予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認率</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReservations > 0 ? Math.round((approvedReservations / totalReservations) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">AI自動承認率</p>
          </CardContent>
        </Card>
      </div>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPU使用率 */}
        <Card>
          <CardHeader>
            <CardTitle>GPU使用率</CardTitle>
            <CardDescription>各GPUタイプの現在の使用状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gpuUsageData.map((gpu) => (
                <div key={gpu.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{gpu.name}</span>
                    <span className="text-muted-foreground">
                      {gpu.used}/{gpu.total} 使用中
                    </span>
                  </div>
                  <Progress value={gpu.usage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 予約状況 */}
        <Card>
          <CardHeader>
            <CardTitle>予約状況</CardTitle>
            <CardDescription>現在の予約ステータス分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 時間別使用量 */}
      <Card>
        <CardHeader>
          <CardTitle>時間別GPU使用量</CardTitle>
          <CardDescription>24時間の使用パターン</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 最近の予約 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の予約</CardTitle>
          <CardDescription>直近の予約申請状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reservations
              .slice(-5)
              .reverse()
              .map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">{reservation.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.gpuType} - {reservation.purpose.slice(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        reservation.status === "approved"
                          ? "default"
                          : reservation.status === "pending"
                            ? "secondary"
                            : reservation.status === "active"
                              ? "default"
                              : "destructive"
                      }
                    >
                      {reservation.status === "approved"
                        ? "承認済み"
                        : reservation.status === "pending"
                          ? "待機中"
                          : reservation.status === "active"
                            ? "実行中"
                            : "拒否"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(reservation.startTime).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
