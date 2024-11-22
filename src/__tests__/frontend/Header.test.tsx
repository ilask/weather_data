```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/pages/Header';
import { jest } from '@jest/globals';

interface UserInfo {
  id: string;
  name: string;
  role: string;
  email: string;
}

const mockUser: UserInfo = {
  id: '1',
  name: 'テストユーザー',
  role: '管理者',
  email: 'test@example.com'
};

describe('Header', () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('タイトルとユーザー情報が正しく表示される', () => {
    render(
      <Header 
        title="テストタイトル"
        user={mockUser}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.role)).toBeInTheDocument();
  });

  it('ログアウトボタンクリックで関数が呼ばれる', () => {
    render(
      <Header
        title="テストタイトル"
        user={mockUser}
        onLogout={mockOnLogout}
      />
    );

    const logoutButton = screen.getByRole('button', { name: 'ログアウト' });
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('ユーザーメニューの開閉動作が正しく機能する', () => {
    render(
      <Header
        title="テストタイトル"
        user={mockUser}
        onLogout={mockOnLogout}
      />
    );

    const userMenuButton = screen.getByRole('button', { name: 'ユーザーメニュー' });
    
    // メニューは初期状態で非表示
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // メニューを開く
    fireEvent.click(userMenuButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // メニューを閉じる
    fireEvent.click(userMenuButton);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('レスポンシブ対応のハンバーガーメニューが正しく動作する', () => {
    render(
      <Header
        title="テストタイトル"
        user={mockUser}
        onLogout={mockOnLogout}
      />
    );

    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    
    // モバイルメニューは初期状態で非表示
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    // モバイルメニューを開く
    fireEvent.click(hamburgerButton);
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // モバイルメニューを閉じる
    fireEvent.click(hamburgerButton);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('未認証ユーザーの場合、ログインリンクが表示される', () => {
    render(
      <Header
        title="テストタイトル"
        user={null}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.queryByText('ログアウト')).not.toBeInTheDocument();
  });

  it('ロゴがクリック可能でホームページへのリンクとなっている', () => {
    render(
      <Header
        title="テストタイトル"
        user={mockUser}
        onLogout={mockOnLogout}
      />
    );

    const logoLink = screen.getByRole('link', { name: /ロゴ/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
```