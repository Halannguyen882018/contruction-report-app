'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Project } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setProjects(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dự án</h1>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
        >
          + Tạo dự án mới
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">🏗️</p>
          <p className="text-gray-500">Chưa có dự án nào</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-block mt-4 text-primary-600 font-medium text-sm hover:underline"
          >
            Tạo dự án đầu tiên →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg">{project.name}</h3>
              {project.address && (
                <p className="text-sm text-gray-500 mt-1">📍 {project.address}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Tạo ngày {format(new Date(project.created_at), 'dd/MM/yyyy')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
