```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import AuthForm from '@/pages/AuthForm';

describe('AuthForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しくレンダリングされること', () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('エラーメッセージが表示されること', () => {
    const errorMessage = 'ログインに失敗しました';
    render(<AuthForm onSubmit={mockOnSubmit} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('バリデーションエラーが表示されること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
    expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
  });

  it('メールアドレスの形式バリデーションが機能すること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    await userEvent.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
  });

  it('パスワードの最小文字数バリデーションが機能すること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    await userEvent.type(passwordInput, '123');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
  });

  it('正常な入力で送信が成功すること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('送信中は送信ボタンが無効化されること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(submitButton).toBeDisabled();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('パスワードの表示/非表示が切り替えられること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    const toggleButton = screen.getByRole('button', { name: 'パスワードを表示' });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('入力フィールドのクリアボタンが機能すること', async () => {
    render(<AuthForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    const emailClearButton = screen.getByRole('button', { name: 'メールアドレスをクリア' });
    const passwordClearButton = screen.getByRole('button', { name: 'パスワードをクリア' });
    
    await userEvent.click(emailClearButton);
    expect(emailInput).toHaveValue('');
    
    await userEvent.click(passwordClearButton);
    expect(passwordInput).toHaveValue('');
  });
});
```