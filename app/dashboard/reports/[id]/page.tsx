'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { DailyReport } from '@/lib/types'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('daily_reports')
        .select('*, categories(name, project_id), profiles(full_name), report_attachments(*)')
        .eq('id', id)
        .single()

      if (data) setReport(data as DailyReport)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải...</div>
  if (!report) return <div className="text-center py-12 text-gray-400">Không tìm thấy báo cáo</div>

  const statusColors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    not_started: '⬜ Chưa bắt đầu',
    in_progress: '🔵 Đang thực hiện',
    completed: '✅ Hoàn thành',
    blocked: '🔴 Tạm dừng',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-primary-600">
        ← Quay lại
      </button>

      {/* Report Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{report.categories?.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Báo cáo ngày {format(new Date(report.report_date), 'dd/MM/yyyy')}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[report.status]}`}>
            {statusLabels[report.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Người báo cáo</p>
            <p className="font-medium mt-0.5">🧑 {report.profiles?.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Số thợ</p>
            <p className="font-medium mt-0.5">👷 {report.worker_count} người</p>
          </div>
        </div>

        {/* Work Description */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Công việc đã làm</h3>
          <p className="text-gray-800 whitespace-pre-wrap">{report.work_description}</p>
        </div>

        {/* Progress Note */}
        {report.progress_note && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">📌 Ghi chú tiến độ</h3>
            <p className="text-amber-900 whitespace-pre-wrap">{report.progress_note}</p>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400">
          Tạo lúc {format(new Date(report.created_at), 'HH:mm dd/MM/yyyy')}
        </p>
      </div>

      {/* Attachments */}
      {report.report_attachments && report.report_attachments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">
            📷 Hình ảnh ({report.report_attachments.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {report.report_attachments.map((att) => (
              <div
                key={att.id}
                className="cursor-pointer group"
                onClick={() => setLightboxUrl(att.file_url)}
              >
                {att.file_type?.startsWith('image/') ? (
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="w-full h-40 object-cover rounded-lg border border-gray-200 group-hover:shadow-md transition"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                    <p className="text-3xl">📄</p>
                    <p className="text-xs text-gray-500 mt-2 px-2 text-center truncate w-full">
                      {att.file_name}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/projects/${(report.categories as any)?.project_id}`}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          🏗️ Xem dự án
        </Link>
        <Link
          href={`/dashboard/reports?project=${(report.categories as any)?.project_id}`}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          📝 Xem tất cả báo cáo
        </Link>
      </div>
    </div>
  )
}
