```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import '@testing-library/jest-dom'
import Login from '@/pages/login'
import axios from 'axios'

jest.mock('next/navigation')
jest.mock('axios')

describe('ログイン画面', () => {
  const mockRouter = {
    push: jest.fn(),
  }
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
  })

  it('ログインフォームが正しく表示されること', () => {
    render(<Login />)
    
    expect(screen.getByLabelText('ユーザーID')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('入力値が空の場合にエラーメッセージが表示されること', async () => {
    render(<Login />)
    
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))
    
    expect(await screen.findByText('ユーザーIDを入力してください')).toBeInTheDocument()
    expect(await screen.findByText('パスワードを入力してください')).toBeInTheDocument()
  })

  it('認証成功時にダッシュボードへ遷移すること', async () => {
    const mockResponse = {
      data: {
        token: 'dummy-token',
        user: { id: 1, name: 'テストユーザー' }
      }
    }
    ;(axios.post as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText('ユーザーID'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('認証失敗時にエラーメッセージが表示されること', async () => {
    const errorMessage = 'ユーザーIDまたはパスワードが間違っています'
    ;(axios.post as jest.Mock).mockRejectedValueOnce(new Error(errorMessage))

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText('ユーザーID'), {
      target: { value: 'wronguser' }
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'wrongpass' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
  })

  it('ヘッダーとフッターが表示されること', () => {
    render(<Login />)
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('パスワード入力フィールドがマスクされていること', () => {
    render(<Login />)
    
    expect(screen.getByLabelText('パスワード')).toHaveAttribute('type', 'password')
  })

  it('ログイン処理中はボタンが無効化されること', async () => {
    ;(axios.post as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText('ユーザーID'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(screen.getByRole('button', { name: 'ログイン中...' })).toBeDisabled()
  })
})
```