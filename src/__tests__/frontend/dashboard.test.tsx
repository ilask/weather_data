```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Dashboard from '@/pages/dashboard';
import { useRouter } from 'next/navigation';

// モックの定義
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: ({ title, user, onLogout }: any) => (
    <div data-testid="mock-header">
      <span>{title}</span>
      <span>{user.name}</span>
      <button onClick={onLogout}>ログアウト</button>
    </div>
  )
}));

jest.mock('@/components/Sidebar', () => ({
  __esModule: true,
  default: ({ menuItems, activeItem, onMenuSelect }: any) => (
    <div data-testid="mock-sidebar">
      {menuItems.map((item: any) => (
        <button key={item.id} onClick={() => onMenuSelect(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('@/components/StatusPanel', () => ({
  __esModule: true,
  default: ({ metrics, status }: any) => (
    <div data-testid="mock-status-panel">
      <span>CPU使用率: {metrics.cpu}%</span>
      <span>システム状態: {status}</span>
    </div>
  )
}));

// モックデータ
const mockSystemData = {
  metrics: {
    cpu: 45,
    memory: 60,
    disk: 75
  },
  status: "正常",
  alerts: [
    { id: 1, message: "警告メッセージ1", severity: "warning" },
    { id: 2, message: "エラーメッセージ1", severity: "error" }
  ],
  tasks: [
    { id: 1, name: "データ取得", status: "実行中" },
    { id: 2, name: "バックアップ", status: "完了" }
  ]
};

describe('Dashboard', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      pathname: '/dashboard'
    }));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSystemData)
      })
    ) as jest.Mock;
  });

  test('ダッシュボードが正しくレンダリングされること', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-status-panel')).toBeInTheDocument();
    });
  });

  test('システムメトリクスが正しく表示されること', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/CPU使用率: 45%/)).toBeInTheDocument();
      expect(screen.getByText(/システム状態: 正常/)).toBeInTheDocument();
    });
  });

  test('アラート一覧が正しく表示されること', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('警告メッセージ1')).toBeInTheDocument();
      expect(screen.getByText('エラーメッセージ1')).toBeInTheDocument();
    });
  });

  test('タスク実行状況が正しく表示されること', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('データ取得')).toBeInTheDocument();
      expect(screen.getByText('バックアップ')).toBeInTheDocument();
      expect(screen.getByText('実行中')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });
  });

  test('エラー時のエラーメッセージが表示されること', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    ) as jest.Mock;

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('システムデータの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('更新ボタンクリックでデータが再取得されること', async () => {
    render(<Dashboard />);
    
    const updateButton = screen.getByText('更新');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('ログアウトボタンクリックで適切な処理が実行されること', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush
    }));

    render(<Dashboard />);
    
    const logoutButton = screen.getByText('ログアウト');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
```