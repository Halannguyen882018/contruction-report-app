'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Project, DailyReport } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [recentReports, setRecentReports] = useState<DailyReport[]>([])
  const [stats, setStats] = useState({ projects: 0, reports: 0, todayReports: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const today = format(new Date(), 'yyyy-MM-dd')

      const [projectsRes, reportsRes, todayRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_reports').select('*, categories(name), profiles(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('daily_reports').select('id', { count: 'exact' }).eq('report_date', today),
      ])

      if (projectsRes.data) setProjects(projectsRes.data)
      if (reportsRes.data) setRecentReports(reportsRes.data as DailyReport[])

      setStats({
        projects: projectsRes.data?.length || 0,
        reports: reportsRes.data?.length || 0,
        todayReports: todayRes.count || 0,
      })
    }
    load()
  }, [])

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
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Dự án</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{stats.projects}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Báo cáo hôm nay</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.todayReports}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng báo cáo</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{stats.reports}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
        >
          + Tạo dự án mới
        </Link>
        <Link
          href="/dashboard/reports/new"
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          + Tạo báo cáo hôm nay
        </Link>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Báo cáo gần đây</h2>
        </div>
        {recentReports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>Chưa có báo cáo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="block p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{report.categories?.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {report.profiles?.full_name} · {format(new Date(report.report_date), 'dd/MM/yyyy')} · {report.worker_count} thợ
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                    {statusLabels[report.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{report.work_description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
