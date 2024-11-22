import { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { FiKey, FiTrash2, FiRefreshCw, FiPlus } from 'react-icons/fi'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/supabase'

type Token = {
  id: string
  client_id: string
  permissions: string[]
  created_at: string
  last_used: string | null
  status: 'active' | 'revoked'
}

const APITokenManagement: NextPage = () => {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      const { data: accessLogs, error } = await supabase
        .from('api_access_logs')
        .select('client_id, request_info')

      if (error) throw error

      const formattedTokens = accessLogs.map((log: any) => ({
        id: log.request_info.token_id || crypto.randomUUID(),
        client_id: log.client_id,
        permissions: log.request_info.permissions || [],
        created_at: new Date().toISOString(),
        last_used: log.request_info.accessed_at,
        status: 'active' as const
      }))

      setTokens(formattedTokens)
      setLoading(false)
    } catch (err) {
      setError('トークンの取得中にエラーが発生しました')
      setLoading(false)
    }
  }

  const generateToken = async () => {
    try {
      const newToken = {
        id: crypto.randomUUID(),
        client_id: `tk_${Math.random().toString(36).substr(2, 9)}`,
        permissions: ['read'],
        created_at: new Date().toISOString(),
        last_used: null,
        status: 'active' as const
      }

      const { error } = await supabase
        .from('api_access_logs')
        .insert([
          {
            client_id: newToken.client_id,
            request_info: {
              token_id: newToken.id,
              permissions: newToken.permissions,
              accessed_at: null
            }
          }
        ])

      if (error) throw error

      setTokens([...tokens, newToken])
    } catch (err) {
      setError('トークンの生成中にエラーが発生しました')
    }
  }

  const revokeToken = async (tokenId: string) => {
    try {
      setTokens(tokens.map(token => 
        token.id === tokenId ? { ...token, status: 'revoked' as const } : token
      ))
    } catch (err) {
      setError('トークンの無効化中にエラーが発生しました')
    }
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        <nav className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800">API管理</h2>
            <ul className="mt-4">
              <li className="mb-2">
                <Link href="/dashboard" className="flex items-center p-2 text-gray-700 rounded hover:bg-gray-100">
                  <span>ダッシュボード</span>
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/api-token" className="flex items-center p-2 text-blue-600 bg-blue-50 rounded">
                  <FiKey className="mr-2" />
                  <span>APIトークン管理</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">APIトークン管理</h1>
              <button
                onClick={generateToken}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                新規トークン発行
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <FiRefreshCw className="animate-spin text-gray-500 text-2xl" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          クライアントID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作成日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          最終使用日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          アクション
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tokens.map((token) => (
                        <tr key={token.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {token.client_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(token.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {token.last_used ? new Date(token.last_used).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              token.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {token.status === 'active' ? '有効' : '無効'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {token.status === 'active' && (
                              <button
                                onClick={() => revokeToken(token.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default APITokenManagement