import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { FiUser, FiLock, FiAlertCircle } from 'react-icons/fi'
import { supabase } from '@/supabase'

const Login = () => {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    if (!userId) {
      setErrors(prev => [...prev, 'ユーザーIDを入力してください'])
    }
    if (!password) {
      setErrors(prev => [...prev, 'パスワードを入力してください'])
    }
    if (!userId || !password) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userId,
        password: password
      })

      if (error) throw error

      await supabase.from('api_access_logs').insert({
        client_id: userId,
        request_info: {
          type: 'login',
          timestamp: new Date().toISOString()
        }
      })

      router.push('/dashboard')
    } catch (error) {
      setErrors(['ユーザーIDまたはパスワードが間違っています'])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen h-full bg-gradient-to-br from-blue-50 to-blue-100">
      <header data-testid="header" className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4">
          <Image
            src="https://placehold.co/200x50"
            alt="Logo"
            width={200}
            height={50}
          />
        </div>
      </header>

      <main className="max-w-md mx-auto pt-20 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            ログイン
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700"
              >
                ユーザーID
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FiUser className="text-gray-400" />
                </div>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-md">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-red-700"
                  >
                    <FiAlertCircle className="mr-2" />
                    {error}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </main>

      <footer
        data-testid="footer"
        className="absolute bottom-0 w-full bg-white shadow-sm py-4"
      >
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          © 2024 Weather Data Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default Login