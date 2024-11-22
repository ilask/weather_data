import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/supabase'
import axios from 'axios'
import { FiClock, FiDownload, FiUpload, FiSettings, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { BiHistory } from 'react-icons/bi'

type BackupHistory = {
  id: string
  timestamp: string
  status: string
  size: string
  type: string
}

type ScheduleConfig = {
  enabled: boolean
  frequency: string
  time: string
  retention: number
}

const BackupManagement = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    time: '00:00',
    retention: 7
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [historyRes, configRes] = await Promise.all([
        axios.get('/api/backup/history'),
        axios.get('/api/backup/config')
      ])
      setBackupHistory(historyRes.data)
      setScheduleConfig(configRes.data)
    } catch (err) {
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const executeBackup = async () => {
    try {
      await axios.post('/api/backup/execute', {
        type: 'manual'
      })
      fetchData()
    } catch (err) {
      setError('バックアップの実行に失敗しました')
    }
  }

  const executeRestore = async (backup: BackupHistory) => {
    try {
      await axios.post('/api/backup/restore', {
        backupId: backup.id
      })
      fetchData()
    } catch (err) {
      setError('リストアの実行に失敗しました')
    }
  }

  if (loading) return (
    <div className="min-h-screen h-full bg-gray-100 flex justify-center items-center">
      <p className="text-xl">読み込み中...</p>
    </div>
  )

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <div className="flex">
        <nav className="w-64 bg-white h-screen fixed shadow-lg">
          <div className="p-5">
            <h1 className="text-xl font-bold text-gray-800">気象データ管理システム</h1>
          </div>
          <div className="mt-5">
            {/* サイドバーメニュー */}
          </div>
        </nav>
        
        <main className="flex-1 ml-64 p-8">
          <h2 className="text-2xl font-bold mb-8">バックアップ管理</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FiSettings className="mr-2" />
                バックアップ設定
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.enabled}
                    onChange={(e) => setScheduleConfig({...scheduleConfig, enabled: e.target.checked})}
                    className="mr-2"
                  />
                  <span>自動バックアップを有効にする</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">頻度</label>
                    <select
                      value={scheduleConfig.frequency}
                      onChange={(e) => setScheduleConfig({...scheduleConfig, frequency: e.target.value})}
                      className="w-full border rounded p-2"
                    >
                      <option value="daily">毎日</option>
                      <option value="weekly">毎週</option>
                      <option value="monthly">毎月</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">時刻</label>
                    <input
                      type="time"
                      value={scheduleConfig.time}
                      onChange={(e) => setScheduleConfig({...scheduleConfig, time: e.target.value})}
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">保持期間（日）</label>
                  <input
                    type="number"
                    value={scheduleConfig.retention}
                    onChange={(e) => setScheduleConfig({...scheduleConfig, retention: parseInt(e.target.value)})}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <BiHistory className="mr-2" />
                  バックアップ履歴
                </h3>
                <button
                  onClick={executeBackup}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <FiDownload className="mr-2" />
                  手動バックアップ
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 text-left">日時</th>
                      <th className="p-4 text-left">種類</th>
                      <th className="p-4 text-left">サイズ</th>
                      <th className="p-4 text-left">状態</th>
                      <th className="p-4 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup) => (
                      <tr key={backup.id} className="border-t">
                        <td className="p-4">{backup.timestamp}</td>
                        <td className="p-4">{backup.type === 'auto' ? '自動' : '手動'}</td>
                        <td className="p-4">{backup.size}</td>
                        <td className="p-4">
                          {backup.status === 'success' ? (
                            <span className="text-green-500 flex items-center">
                              <FiCheckCircle className="mr-1" />成功
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center">
                              <FiXCircle className="mr-1" />失敗
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => executeRestore(backup)}
                            className="text-blue-500 hover:text-blue-600 flex items-center"
                          >
                            <FiUpload className="mr-1" />
                            リストア
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default BackupManagement