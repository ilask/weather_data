import { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { FiUsers, FiShield, FiAlertCircle, FiSearch, FiRefreshCw } from 'react-icons/fi'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '@/supabase'
import Link from 'next/link'

type RateLimitData = {
  clientId: string
  requestsPerMinute: number
  isBlocked: boolean
}

type MonitoringStatus = {
  totalRequests: number
  blockedClients: number
}

const RateLimit: NextPage = () => {
  const [limitData, setLimitData] = useState<RateLimitData[]>([])
  const [status, setStatus] = useState<MonitoringStatus>({
    totalRequests: 0,
    blockedClients: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('api_access_logs')
        .select('*')
      
      if (error) throw error

      // サンプルデータ変換
      const processedData: RateLimitData[] = [
        { clientId: 'client1', requestsPerMinute: 60, isBlocked: false },
        { clientId: 'client2', requestsPerMinute: 30, isBlocked: true },
        { clientId: 'client3', requestsPerMinute: 45, isBlocked: false }
      ]

      setLimitData(processedData)
      setStatus({
        totalRequests: logs.length,
        blockedClients: processedData.filter(d => d.isBlocked).length
      })
    } catch (error) {
      setError('データの取得に失敗しました')
    }
  }

  const handleLimitUpdate = async () => {
    if (parseInt(newLimit) < 0) {
      setError('0以上の値を入力してください')
      return
    }

    try {
      await supabase
        .from('api_access_logs')
        .update({ request_info: { limit: parseInt(newLimit) } })
      
      setSuccess('制限値を更新しました')
      fetchData()
    } catch (error) {
      setError('更新に失敗しました')
    }
  }

  const handleBlockToggle = async (clientId: string, currentState: boolean) => {
    try {
      await supabase
        .from('api_access_logs')
        .update({ request_info: { isBlocked: !currentState } })
        .eq('client_id', clientId)

      setSuccess(`クライアント ${clientId} の状態を更新しました`)
      fetchData()
    } catch (error) {
      setError('更新に失敗しました')
    }
  }

  const filteredData = limitData.filter(data =>
    data.clientId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Head>
        <title>レート制限設定 - API管理</title>
      </Head>

      <div className="flex">
        <aside className="w-64 bg-white h-screen fixed shadow-md">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800">API管理</h2>
            <nav className="mt-4">
              <Link href="/api-dashboard" className="block py-2 text-gray-600 hover:text-gray-800">
                ダッシュボード
              </Link>
              <Link href="/rate-limit" className="block py-2 text-blue-600 font-semibold">
                レート制限設定
              </Link>
              <Link href="/api-tokens" className="block py-2 text-gray-600 hover:text-gray-800">
                APIトークン管理
              </Link>
            </nav>
          </div>
        </aside>

        <main className="ml-64 p-8 w-full">
          <h1 className="text-2xl font-bold mb-8">レート制限設定</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">制限状況モニター</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-blue-600 font-semibold">総リクエスト数</div>
                  <div className="text-2xl font-bold">{status.totalRequests}</div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-red-600 font-semibold">ブロック中のクライアント</div>
                  <div className="text-2xl font-bold">{status.blockedClients}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">レート制限設定</h2>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    制限値（リクエスト/分）
                  </label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full border rounded p-2"
                    min="0"
                  />
                </div>
                <button
                  onClick={handleLimitUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">クライアント一覧</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="クライアントID検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border rounded p-2"
                  />
                </div>
                <button
                  onClick={fetchData}
                  className="bg-gray-100 p-2 rounded hover:bg-gray-200"
                  aria-label="更新"
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      クライアントID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      リクエスト制限（/分）
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((data) => (
                    <tr key={data.clientId}>
                      <td className="px-6 py-4 whitespace-nowrap">{data.clientId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{data.requestsPerMinute}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            data.isBlocked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {data.isBlocked ? 'ブロック中' : 'アクティブ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleBlockToggle(data.clientId, data.isBlocked)}
                          className={`${
                            data.isBlocked
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white px-3 py-1 rounded text-sm`}
                        >
                          {data.isBlocked ? 'ブロック解除' : 'ブロック'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default RateLimit