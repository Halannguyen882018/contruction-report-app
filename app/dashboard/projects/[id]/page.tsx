'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Project, Category, ProjectMember } from '@/lib/types'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const [projectRes, categoriesRes, membersRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('categories').select('*').eq('project_id', id).order('sort_order'),
      supabase.from('project_members').select('*, profiles(full_name, phone, role)').eq('project_id', id),
    ])

    if (projectRes.data) setProject(projectRes.data)
    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (membersRes.data) setMembers(membersRes.data as ProjectMember[])
    setLoading(false)
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)

    const { error } = await supabase.from('categories').insert({
      project_id: id,
      name: newCategory,
      description: newCategoryDesc || null,
      sort_order: categories.length,
    })

    if (!error) {
      setNewCategory('')
      setNewCategoryDesc('')
      setShowCategoryForm(false)
      loadData()
    }
    setAdding(false)
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setMessage('')

    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', inviteEmail)

    if (!users || users.length === 0) {
      setMessage('Không tìm thấy user. Hãy nhập User ID (UUID) của thành viên.')
      setAdding(false)
      return
    }

    const { error } = await supabase.from('project_members').insert({
      project_id: id,
      user_id: users[0].id,
      role: 'contractor',
    })

    if (error) {
      setMessage(error.message)
    } else {
      setInviteEmail('')
      setShowInviteForm(false)
      loadData()
    }
    setAdding(false)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải...</div>
  if (!project) return <div className="text-center py-12 text-gray-400">Không tìm thấy dự án</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.address && <p className="text-sm text-gray-500 mt-1">📍 {project.address}</p>}
        </div>
        <Link
          href={`/dashboard/reports/new?project=${id}`}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          + Báo cáo hôm nay
        </Link>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hạng mục công việc</h2>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            + Thêm hạng mục
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={addCategory} className="p-4 bg-blue-50 border-b border-blue-100 space-y-3">
            <input
              type="text"
              required
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Tên hạng mục (VD: Móng nhà, Tường, Mái...)"
            />
            <input
              type="text"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Mô tả (tùy chọn)"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 text-gray-600 text-sm hover:underline"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Chưa có hạng mục nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map((cat, i) => (
              <div key={cat.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{i + 1}. {cat.name}</p>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                </div>
                <Link
                  href={`/dashboard/reports?project=${id}&category=${cat.id}`}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Xem báo cáo →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thành viên</h2>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            + Mời thành viên
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={inviteMember} className="p-4 bg-blue-50 border-b border-blue-100 space-y-3">
            <input
              type="text"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="User ID của thành viên"
            />
            {message && <p className="text-sm text-red-600">{message}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Mời
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 text-gray-600 text-sm hover:underline"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-50">
          {members.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{(m as any).profiles?.full_name || 'Chưa cập nhật'}</p>
                <p className="text-xs text-gray-500">{(m as any).profiles?.phone || ''}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                m.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {m.role === 'owner' ? '🏠 Chủ nhà' : '🔨 Nhà thầu'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
