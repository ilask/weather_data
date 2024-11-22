import { useEffect, useState } from 'react'
import { supabase } from '@/supabase'
import { useRouter } from 'next/router'
import { FiAlertCircle, FiRefreshCw, FiCheck, FiLoader } from 'react-icons/fi'
import Head from 'next/head'
import Link from 'next/link'

type MonitoringStatus = {
  isRunning: boolean
  lastUpdate: string
  processedCount: number
}

type ErrorLog = {
  id: string
  message: string
  timestamp: string
  details: string
}

export default function Monitor() {
  const router = useRouter()
  const [status, setStatus] = useState<MonitoringStatus>({
    isRunning: false,
    lastUpdate: '',
    processedCount: 0
  })
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchMonitoringData = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: weatherData, error: weatherError } = await supabase
        .from('weather_data')
        .select('created_at, weather_data')
        .order('created_at', { ascending: false })
        .limit(1)

      if (logsError || weatherError) throw new Error('データの取得に失敗しました')

      const processedErrors = logsData
        ?.filter(log => log.log_level === 'error')
        .map(log => ({
          id: log.id,
          message: log.message,
          timestamp: log.created_at,
          details: log.error_details
        })) || []

      setErrors(processedErrors)
      setStatus({
        isRunning: true,
        lastUpdate: weatherData?.[0]?.created_at || '',
        processedCount: weatherData?.length || 0
      })
      setErrorMessage('')
    } catch (error) {
      setErrorMessage('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async (errorId: string) => {
    try {
      await supabase
        .from('system_logs')
        .update({ log_level: 'retry' })
        .eq('id', errorId)
      fetchMonitoringData()
    } catch (error) {
      setErrorMessage('リトライ処理に失敗しました')
    }
  }

  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Head>
        <title>データ取得モニタリング | 気象データ連携基盤</title>
      </Head>

      <div className="flex">
        <aside className="w-64 min-h-screen bg-[#2C3E50] text-white p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold">気象データ連携基盤</h1>
          </div>
          <nav>
            <Link href="/dashboard" 
              className="block py-2 px-4 hover:bg-[#34495E] rounded">
              ダッシュボード
            </Link>
            <Link href="/data-config"
              className="block py-2 px-4 hover:bg-[#34495E] rounded">
              データ取得設定
            </Link>
            <Link href="/monitor"
              className="block py-2 px-4 bg-[#34495E] rounded">
              モニタリング
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">データ取得モニタリング</h2>
            <button
              onClick={() => fetchMonitoringData()}
              className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] text-white rounded hover:bg-blue-600"
            >
              <FiRefreshCw className="animate-spin" />
              更新
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-lg font-semibold mb-2">実行状態</div>
              <div className="flex items-center gap-2">
                {status.isRunning ? (
                  <><FiCheck className="text-green-500" /> 実行中</>
                ) : (
                  <><FiLoader className="text-gray-500" /> 停止中</>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-lg font-semibold mb-2">最終更新</div>
              <div>{new Date(status.lastUpdate).toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-lg font-semibold mb-2">処理件数</div>
              <div>{status.processedCount.toLocaleString()}件</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">エラー履歴</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <FiLoader className="animate-spin inline text-2xl text-gray-400" />
              </div>
            ) : errors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                エラーは発生していません
              </div>
            ) : (
              <div className="space-y-4">
                {errors.map(error => (
                  <div key={error.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-red-600 font-semibold">
                          <FiAlertCircle />
                          {error.message}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-700 mt-2">
                          {error.details}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRetry(error.id)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                      >
                        リトライ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}