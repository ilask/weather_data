import { useEffect, useState } from 'react'
import { supabase } from '@/supabase'
import Link from 'next/link'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiCheck } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { Switch } from '@headlessui/react'

type Task = {
  id: string
  name: string
  schedule: string
  status: 'active' | 'inactive'
  lastRun: string
  nextRun: string
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const tasksPerPage = 10

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const { data: systemLogs, error } = await supabase
        .from('system_logs')
        .select('*')
      
      if (error) throw error

      const mockTasks: Task[] = [
        {
          id: '1',
          name: 'データ取得タスク',
          schedule: '0 0 * * *',
          status: 'active',
          lastRun: '2024-01-01T00:00:00Z',
          nextRun: '2024-01-02T00:00:00Z'
        },
        {
          id: '2',
          name: 'バックアップタスク',
          schedule: '0 12 * * *',
          status: 'inactive',
          lastRun: '2024-01-01T12:00:00Z',
          nextRun: '2024-01-02T12:00:00Z'
        }
      ]
      setTasks(mockTasks)
    } catch (error) {
      toast.error('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks
    .filter(task => task.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    })

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  )

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage)

  const handleCreateTask = async (formData: any) => {
    try {
      await supabase.from('system_logs').insert([
        { log_level: 'info', message: 'タスク作成' }
      ])
      setShowCreateModal(false)
      fetchTasks()
      toast.success('タスクを作成しました')
    } catch (error) {
      toast.error('タスクの作成に失敗しました')
    }
  }

  const handleEditTask = async (formData: any) => {
    try {
      await supabase.from('system_logs').insert([
        { log_level: 'info', message: 'タスク更新' }
      ])
      setShowEditModal(false)
      fetchTasks()
      toast.success('タスクを更新しました')
    } catch (error) {
      toast.error('タスクの更新に失敗しました')
    }
  }

  const handleDeleteTask = async () => {
    try {
      await supabase.from('system_logs').insert([
        { log_level: 'info', message: 'タスク削除' }
      ])
      setShowDeleteModal(false)
      fetchTasks()
      toast.success('タスクを削除しました')
    } catch (error) {
      toast.error('タスクの削除に失敗しました')
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">タスク一覧</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiPlus className="mr-2" />
              新規タスク作成
            </button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="タスク名で検索"
                    className="pl-10 pr-4 py-2 border rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border rounded-md"
                >
                  名前順
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タスク名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      スケジュール
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最終実行
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      次回実行
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4">
                        <span data-testid="task-name" className="text-sm font-medium text-gray-900">
                          {task.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{task.schedule}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={task.status === 'active'}
                          onChange={() => {}}
                          className={`${
                            task.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full`}
                        >
                          <span className="sr-only">タスクの状態を切り替え</span>
                          <span
                            className={`${
                              task.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(task.lastRun).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(task.nextRun).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  全{filteredTasks.length}件中 {(currentPage - 1) * tasksPerPage + 1}から
                  {Math.min(currentPage * tasksPerPage, filteredTasks.length)}件を表示
                </p>
              </div>
              <div>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="前のページ"
                  className="mx-1 px-3 py-1 rounded-md border disabled:opacity-50"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="次のページ"
                  className="mx-1 px-3 py-1 rounded-md border disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">タスク作成</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleCreateTask(new FormData(e.currentTarget))
            }}>
              <div className="mb-4">
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
                  タスク名
                </label>
                <input
                  type="text"
                  id="taskName"
                  name="taskName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
                  スケジュール
                </label>
                <input
                  type="text"
                  id="schedule"
                  name="schedule"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">タスク編集</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleEditTask(new FormData(e.currentTarget))
            }}>
              <div className="mb-4">
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
                  タスク名
                </label>
                <input
                  type="text"
                  id="taskName"
                  name="taskName"
                  defaultValue={selectedTask.name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
                  スケジュール
                </label>
                <input
                  type="text"
                  id="schedule"
                  name="schedule"
                  defaultValue={selectedTask.schedule}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">タスク削除の確認</h2>
            <p className="mb-4">本当に「{selectedTask.name}」を削除しますか？</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks