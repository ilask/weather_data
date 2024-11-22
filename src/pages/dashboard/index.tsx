import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { FiActivity, FiAlertCircle, FiBox, FiCpu, FiDatabase, FiRefreshCw } from 'react-icons/fi'
import { supabase } from '@/supabase'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

export default function Dashboard() {
  const router = useRouter()
  const [systemData, setSystemData] = useState({
    metrics: { cpu: 0, memory: 0, disk: 0 },
    status: '読み込み中',
    alerts: [],
    tasks: []
  })
  const [error, setError] = useState('')
  const [logs, setLogs] = useState([])

  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/system-monitor')
      if (!response.ok) throw new Error()
      
      const data = await response.json()
      setSystemData(data)
      setError('')
    } catch {
      setError('システムデータの取得に失敗しました')
      setSystemData({
        metrics: { cpu: 45, memory: 60, disk: 75 },
        status: '正常',
        alerts: [
          { id: 1, message: '警告メッセージ1', severity: 'warning' },
          { id: 2, message: 'エラーメッセージ1', severity: 'error' }
        ],
        tasks: [
          { id: 1, name: 'データ取得', status: '実行中' },
          { id: 2, name: 'バックアップ', status: '完了' }
        ]
      })
    }
  }

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('log_level,message,error_details')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) setLogs(data)
  }

  useEffect(() => {
    fetchSystemData()
    fetchLogs()
    const interval = setInterval(fetchSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const chartOptions = {
    chart: { type: 'area' },
    stroke: { curve: 'smooth' },
    colors: ['#3498DB'],
    xaxis: { categories: ['0', '6', '12', '18', '24'] }
  }

  const chartSeries = [{
    name: 'CPU使用率',
    data: [30, 40, 45, 50, 49]
  }]

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-[#2C3E50] text-white">
          <div className="p-4">
            <h1 className="text-xl font-bold mb-8">気象データ基盤</h1>
            <nav>
              <Link href="/dashboard" className="flex items-center p-2 bg-[#34495E] rounded mb-2">
                <FiActivity className="mr-2" />
                ダッシュボード
              </Link>
              <Link href="/data-config" className="flex items-center p-2 hover:bg-[#34495E] rounded mb-2">
                <FiDatabase className="mr-2" />
                データ設定
              </Link>
              <Link href="/monitoring" className="flex items-center p-2 hover:bg-[#34495E] rounded mb-2">
                <FiCpu className="mr-2" />
                モニタリング
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">運用管理ダッシュボード</h2>
            <div className="flex gap-4">
              <button
                onClick={fetchSystemData}
                className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] text-white rounded hover:bg-[#2980B9]"
              >
                <FiRefreshCw />
                更新
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#E74C3C] text-white rounded hover:bg-[#C0392B]"
              >
                ログアウト
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">CPU使用率</h3>
                <span className={`px-2 py-1 rounded ${systemData.metrics.cpu > 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {systemData.metrics.cpu}%
                </span>
              </div>
              <div className="h-32">
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="area"
                  height="100%"
                />
              </div>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-4">メモリ使用率</h3>
              <div className="flex items-center justify-between">
                <span>{systemData.metrics.memory}%</span>
                <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#3498DB] h-2.5 rounded-full"
                    style={{ width: `${systemData.metrics.memory}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-4">ディスク使用率</h3>
              <div className="flex items-center justify-between">
                <span>{systemData.metrics.disk}%</span>
                <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#3498DB] h-2.5 rounded-full"
                    style={{ width: `${systemData.metrics.disk}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FiAlertCircle />
                アラート一覧
              </h3>
              <div className="space-y-4">
                {systemData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded ${
                      alert.severity === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FiBox />
                タスク実行状況
              </h3>
              <div className="space-y-4">
                {systemData.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <span>{task.name}</span>
                    <span className={`px-2 py-1 rounded ${
                      task.status === '実行中' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}