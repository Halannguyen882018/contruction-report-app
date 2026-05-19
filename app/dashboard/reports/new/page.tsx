'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Project, Category, ReportStatus } from '@/lib/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

export default function NewReportPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [projectId, setProjectId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [workerCount, setWorkerCount] = useState(0)
  const [workDescription, setWorkDescription] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [status, setStatus] = useState<ReportStatus>('in_progress')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadProjects()
    const proj = searchParams.get('project')
    if (proj) setProjectId(proj)
  }, [])

  useEffect(() => {
    if (projectId) loadCategories(projectId)
  }, [projectId])

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('name')
    if (data) setProjects(data)
  }

  async function loadCategories(pid: string) {
    const { data } = await supabase.from('categories').select('*').eq('project_id', pid).order('sort_order')
    if (data) setCategories(data)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])

    selected.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Chưa đăng nhập'); setLoading(false); return }

    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .insert({
        project_id: projectId,
        category_id: categoryId,
        reported_by: user.id,
        report_date: reportDate,
        worker_count: workerCount,
        work_description: workDescription,
        progress_note: progressNote || null,
        status,
      })
      .select()
      .single()

    if (reportError || !report) {
      setError(reportError?.message || 'Lỗi tạo báo cáo')
      setLoading(false)
      return
    }

    if (files.length > 0) {
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${report.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(path, file)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('report-photos')
            .getPublicUrl(path)

          await supabase.from('report_attachments').insert({
            report_id: report.id,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
          })
        }
      }
    }

    router.push(`/dashboard/reports/${report.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Tạo báo cáo thi công</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Project Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dự án *</label>
          <select
            required
            value={projectId}
            onChange={(e) => { setProjectId(e.target.value); setCategoryId('') }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">Chọn dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hạng mục *</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            disabled={!projectId}
          >
            <option value="">Chọn hạng mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {projectId && categories.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              Chưa có hạng mục. <a href={`/dashboard/projects/${projectId}`} className="underline">Thêm hạng mục →</a>
            </p>
          )}
        </div>

        {/* Date & Workers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày báo cáo *</label>
            <input
              type="date"
              required
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng thợ *</label>
            <input
              type="number"
              required
              min={0}
              value={workerCount}
              onChange={(e) => setWorkerCount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="not_started">⬜ Chưa bắt đầu</option>
            <option value="in_progress">🔵 Đang thực hiện</option>
            <option value="completed">✅ Hoàn thành</option>
            <option value="blocked">🔴 Tạm dừng</option>
          </select>
        </div>

        {/* Work Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Công việc đã làm *</label>
          <textarea
            required
            rows={4}
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            placeholder="VD: Đổ bê tông sàn tầng 2, hoàn thành 80%. Lắp cốt thép dầm D1-D5..."
          />
        </div>

        {/* Progress Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú tiến độ</label>
          <textarea
            rows={2}
            value={progressNote}
            onChange={(e) => setProgressNote(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            placeholder="VD: Trời mưa nên dời đổ bê tông sang ngày mai..."
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh / File đính kèm</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-gray-500">Nhấn để chọn ảnh hoặc file</p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ: JPG, PNG, PDF, DOC</p>
            </label>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
              {previews.map((preview, i) => (
                <div key={i} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Đang gửi báo cáo...' : '📝 Gửi báo cáo'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  )
}
