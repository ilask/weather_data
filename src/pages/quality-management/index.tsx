import { useEffect, useState } from 'react'
import { supabase } from '@/supabase'
import Link from 'next/link'
import { FiActivity, FiAlertCircle, FiCheck, FiDatabase, FiRefreshCw } from 'react-icons/fi'
import { MdAutorenew } from 'react-icons/md'

type QualityMetrics = {
  completeness: number
  accuracy: number
  consistency: number
}

type QualityIssue = {
  id: string
  type: string
  description: string
}

type QualityData = {
  metrics: QualityMetrics
  issues: QualityIssue[]
}

const QualityManagement = () => {
  const [qualityData, setQualityData] = useState<QualityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [error, setError] = useState('')

  const fetchQualityData = async () => {
    try {
      const { data: reports, error } = await supabase
        .from('data_quality_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      const formattedData: QualityData = {
        metrics: {
          completeness: reports.quality_metrics.completeness,
          accuracy: reports.quality_metrics.accuracy,
          consistency: reports.quality_metrics.consistency,
        },
        issues: reports.issues_found,
      }
      setQualityData(formattedData)
    } catch (err) {
      setError('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQualityData()
  }, [])

  const handleQualityCheck = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/quality/check', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('品質チェックに失敗しました')
      await fetchQualityData()
    } catch (err) {
      setError('品質チェックに失敗しました')
    } finally {
      setIsChecking(false)
    }
  }

  const handleFix = async (issueId: string) => {
    setIsFixing(true)
    try {
      const response = await fetch('/api/quality/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: issueId }),
      })
      if (!response.ok) throw new Error('補正処理に失敗しました')
      await fetchQualityData()
    } catch (err) {
      setError('補正処理に失敗しました')
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-[#2C3E50] text-white p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">気象データ連携基盤</h2>
          </div>
          <nav>
            <Link href="/dashboard" className="block py-2 px-4 hover:bg-[#34495E] rounded">
              <FiDatabase className="inline mr-2" />
              ダッシュボード
            </Link>
            <Link href="/quality-management" className="block py-2 px-4 bg-[#34495E] rounded">
              <FiActivity className="inline mr-2" />
              品質管理
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">データ品質管理</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">品質メトリクス</h2>
                {qualityData && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>完全性</span>
                      <span className="font-mono">{qualityData.metrics.completeness}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>正確性</span>
                      <span className="font-mono">{qualityData.metrics.accuracy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>一貫性</span>
                      <span className="font-mono">{qualityData.metrics.consistency}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleQualityCheck}
                  disabled={isChecking}
                  className="mt-4 w-full bg-[#3498DB] text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <FiRefreshCw className="inline animate-spin mr-2" />
                      品質チェック実行中...
                    </>
                  ) : (
                    <>
                      <FiCheck className="inline mr-2" />
                      品質チェック実行
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">検出された問題</h2>
                {qualityData?.issues.length === 0 ? (
                  <p className="text-gray-500">問題は検出されていません</p>
                ) : (
                  <div className="space-y-4">
                    {qualityData?.issues.map((issue) => (
                      <div key={issue.id} className="border p-4 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <FiAlertCircle className="inline text-yellow-500 mr-2" />
                            <span>{issue.description}</span>
                          </div>
                          <button
                            onClick={() => handleFix(issue.id)}
                            disabled={isFixing}
                            className="bg-[#2ECC71] text-white py-1 px-3 rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {isFixing ? (
                              <>
                                <MdAutorenew className="inline animate-spin mr-1" />
                                補正処理実行中...
                              </>
                            ) : (
                              '補正実行'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default QualityManagement