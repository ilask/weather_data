import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { FiSave, FiMap, FiClock, FiList } from 'react-icons/fi'
import { supabase } from '@/supabase'
import toast from 'react-hot-toast'

const DataConfigScreen = () => {
  const router = useRouter()
  const [areaCode, setAreaCode] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [schedule, setSchedule] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)

  const weatherItems = [
    { id: 'temperature', label: '気温' },
    { id: 'rainfall', label: '降水量' },
    { id: 'humidity', label: '湿度' },
    { id: 'windSpeed', label: '風速' },
    { id: 'pressure', label: '気圧' }
  ]

  useEffect(() => {
    const fetchCurrentConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('weather_data')
          .select('area_code, weather_data')
          .single()

        if (error) throw error

        if (data) {
          setAreaCode(data.area_code)
          setSelectedItems(data.weather_data.items || [])
          setSchedule(data.weather_data.schedule || '')
        }
      } catch (error) {
        toast.error('設定の読み込みに失敗しました')
      }
    }

    fetchCurrentConfig()
  }, [])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!areaCode) {
      newErrors.areaCode = '地域コードは必須です'
    }
    if (selectedItems.length === 0) {
      newErrors.items = '1つ以上の項目を選択してください'
    }
    if (!schedule) {
      newErrors.schedule = 'スケジュールは必須です'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('weather_data')
        .upsert({
          area_code: areaCode,
          weather_data: {
            items: selectedItems,
            schedule
          }
        })

      if (error) throw error

      toast.success('設定を保存しました')
    } catch (error) {
      toast.error('設定の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Head>
        <title>データ取得設定 | 気象データ連携基盤</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">データ取得設定</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Area Code Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FiMap className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">地域コード設定</h2>
            </div>
            <input
              type="text"
              aria-label="地域コード"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="例: 130000"
            />
            {errors.areaCode && (
              <p className="mt-2 text-sm text-red-600">{errors.areaCode}</p>
            )}
          </div>

          {/* Weather Items Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FiList className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">取得項目設定</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {weatherItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleItemToggle(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    aria-label={item.label}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            {errors.items && (
              <p className="mt-2 text-sm text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Schedule Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FiClock className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">スケジュール設定</h2>
            </div>
            <input
              type="text"
              aria-label="実行スケジュール"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Cron形式で入力 (例: 0 0 * * *)"
            />
            {errors.schedule && (
              <p className="mt-2 text-sm text-red-600">{errors.schedule}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <FiSave className="mr-2" />
              {loading ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataConfigScreen