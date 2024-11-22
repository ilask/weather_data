import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FiSave, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'
import { supabase } from '@/supabase'
import axios from 'axios'

const FormatConfig = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const response = await axios.get('/api/conversion-rules')
      setRules(response.data.rules || [])
      setPreviewData(response.data.previewData || [])
    } catch (error) {
      setError('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (newRules: any[]) => {
    try {
      setError('')
      setValidationErrors([])
      await axios.post('/api/conversion-rules', { rules: newRules })
      setRules(newRules)
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors)
      } else {
        setError(`エラーが発生しました：${error.message}`)
      }
    }
  }

  const updatePreview = async () => {
    try {
      const response = await axios.get('/api/preview-data')
      setPreviewData(response.data.previewData || [])
    } catch (error: any) {
      setError('プレビューの更新に失敗しました')
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <div data-testid="header" className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">データ変換設定</h1>
        </div>
      </div>

      <div className="flex">
        <div data-testid="sidebar" className="w-64 bg-white shadow-sm h-screen">
          <nav className="mt-5 px-2">
            <a href="#" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              データ変換設定
            </a>
          </nav>
        </div>

        <main className="flex-1 p-8">
          {loading ? (
            <div className="text-center">読み込み中...</div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div data-testid="conversion-form">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">変換ルール設定</h2>
                  <button
                    onClick={() => handleSave(rules)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FiSave className="mr-2" />
                    Save
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">プレビュー</h2>
                  <button
                    onClick={updatePreview}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiRefreshCw className="mr-2" />
                    プレビュー更新
                  </button>

                  <div className="mt-4 border rounded-lg overflow-hidden">
                    {previewData.map((item, index) => (
                      <div key={index} className="p-4 border-b last:border-b-0">
                        {item.data}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex">
                      <FiAlertCircle className="text-red-400 mt-1" />
                      <div className="ml-3 text-red-700">{error}</div>
                    </div>
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <FiAlertCircle className="text-yellow-400 mt-1" />
                      <div className="ml-3">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-yellow-700">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
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

export default FormatConfig