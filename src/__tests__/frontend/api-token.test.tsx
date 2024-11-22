```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import APITokenManagement from '@/pages/api-token';
import '@testing-library/jest-dom';

// モックの定義
jest.mock('@/components/Header', () => {
  return function MockHeader({ title, user, onLogout }: any) {
    return (
      <div data-testid="mock-header">
        <div>{title}</div>
        <div>{user.name}</div>
        <button onClick={onLogout}>ログアウト</button>
      </div>
    );
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar({ menuItems, activeItem, onMenuSelect }: any) {
    return (
      <div data-testid="mock-sidebar">
        {menuItems.map((item: any) => (
          <button key={item.id} onClick={() => onMenuSelect(item.id)}>
            {item.name}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('@/components/TokenManager', () => {
  return function MockTokenManager({ tokens, onGenerate, onRevoke }: any) {
    return (
      <div data-testid="mock-token-manager">
        <button onClick={onGenerate}>新規トークン発行</button>
        {tokens.map((token: any) => (
          <div key={token.id}>
            <span>{token.value}</span>
            <button onClick={() => onRevoke(token.id)}>無効化</button>
          </div>
        ))}
      </div>
    );
  };
});

const mockTokens = [
  { id: '1', value: 'token1', status: 'active' },
  { id: '2', value: 'token2', status: 'active' }
];

describe('APITokenManagement', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tokens: mockTokens }),
      })
    ) as jest.Mock;
  });

  test('画面の初期表示が正しく行われること', async () => {
    render(<APITokenManagement />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-token-manager')).toBeInTheDocument();
  });

  test('新規トークン発行ボタンのクリックで発行処理が実行されること', async () => {
    render(<APITokenManagement />);
    
    const generateButton = screen.getByText('新規トークン発行');
    await act(async () => {
      fireEvent.click(generateButton);
    });
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tokens'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  test('トークン無効化ボタンのクリックで無効化処理が実行されること', async () => {
    render(<APITokenManagement />);
    
    const revokeButton = screen.getAllByText('無効化')[0];
    await act(async () => {
      fireEvent.click(revokeButton);
    });
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tokens/1'),
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });

  test('エラー発生時にエラーメッセージが表示されること', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API Error'))
    ) as jest.Mock;

    render(<APITokenManagement />);
    
    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
    });
  });

  test('ログアウトボタンクリックでログアウト処理が実行されること', async () => {
    const mockRouter = {
      push: jest.fn()
    };

    render(<APITokenManagement />);
    
    const logoutButton = screen.getByText('ログアウト');
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/logout'),
      expect.any(Object)
    );
  });

  test('サイドバーメニュー選択で画面遷移が実行されること', async () => {
    render(<APITokenManagement />);
    
    const menuButton = screen.getByText(/ダッシュボード/);
    await act(async () => {
      fireEvent.click(menuButton);
    });

    expect(global.mockNextRouter.push).toHaveBeenCalled();
  });
});
```