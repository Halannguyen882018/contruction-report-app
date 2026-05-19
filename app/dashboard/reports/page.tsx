'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { DailyReport, Project } from '@/lib/types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

export default function ReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const proj = searchParams.get('project')
    if (proj) setSelectedProject(proj)
    loadProjects()
  }, [])

  useEffect(() => {
    loadReports()
  }, [selectedProject, selectedDate])

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('name')
    if (data) setProjects(data)
  }

  async function loadReports() {
    let query = supabase
      .from('daily_reports')
      .select('*, categories(name), profiles(full_name), report_attachments(id)')
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (selectedProject) query = query.eq('project_id', selectedProject)
    if (selectedDate) query = query.eq('report_date', selectedDate)

    const { data } = await query
    if (data) setReports(data as DailyReport[])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    not_started: 'Chưa bắt đầu',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    blocked: 'Tạm dừng',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Báo cáo thi công</h1>
        <Link
          href="/dashboard/reports/new"
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          + Tạo báo cáo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">Tất cả dự án</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
        {(selectedProject || selectedDate) && (
          <button
            onClick={() => { setSelectedProject(''); setSelectedDate('') }}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-red-600"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Report List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500">Không có báo cáo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{report.categories?.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                      {statusLabels[report.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {format(new Date(report.report_date), 'dd/MM/yyyy')}
                    {' · '}👷 {report.worker_count} thợ
                    {' · '}🧑 {report.profiles?.full_name}
                    {report.report_attachments && report.report_attachments.length > 0 && (
                      <> · 📷 {report.report_attachments.length} ảnh</>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{report.work_description}</p>
                  {report.progress_note && (
                    <p className="text-sm text-amber-700 mt-1 italic">📌 {report.progress_note}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
