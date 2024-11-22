```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Monitor from '@/pages/monitor';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// モックデータ
const mockMonitoringData = {
  status: {
    isRunning: true,
    lastUpdate: '2024-01-01T00:00:00Z',
    processedCount: 100
  },
  errors: [
    {
      id: 'error1',
      message: 'データ取得エラー',
      timestamp: '2024-01-01T00:00:00Z',
      details: 'API接続タイムアウト'
    }
  ]
};

// コンポーネントのモック
jest.mock('@/components/Header', () => {
  return function MockHeader({ title, user, onLogout }) {
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
  return function MockSidebar({ menuItems, activeItem, onMenuSelect }) {
    return (
      <div data-testid="mock-sidebar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => onMenuSelect(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('@/components/MonitoringPanel', () => {
  return function MockMonitoringPanel({ status, errors, onRetry }) {
    return (
      <div data-testid="mock-monitoring-panel">
        <div>ステータス: {status.isRunning ? '実行中' : '停止中'}</div>
        <div>エラー数: {errors.length}</div>
        <button onClick={onRetry}>リトライ</button>
      </div>
    );
  };
});

// APIモック
jest.mock('axios');

describe('Monitor画面のテスト', () => {
  beforeEach(() => {
    global.axios.get.mockResolvedValue({ data: mockMonitoringData });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('初期レンダリングが正しく行われること', async () => {
    await act(async () => {
      render(<Monitor />);
    });

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-monitoring-panel')).toBeInTheDocument();
  });

  it('モニタリングデータが正しく取得されること', async () => {
    await act(async () => {
      render(<Monitor />);
    });

    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalled();
    });

    expect(screen.getByText('ステータス: 実行中')).toBeInTheDocument();
    expect(screen.getByText('エラー数: 1')).toBeInTheDocument();
  });

  it('リトライボタンクリックが正しく動作すること', async () => {
    const mockRetry = jest.fn();
    global.axios.post.mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      render(<Monitor />);
    });

    const retryButton = screen.getByText('リトライ');
    await act(async () => {
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(global.axios.post).toHaveBeenCalled();
    });
  });

  it('エラー発生時にエラーメッセージが表示されること', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      render(<Monitor />);
    });

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('自動更新が正しく動作すること', async () => {
    jest.useFakeTimers();

    await act(async () => {
      render(<Monitor />);
    });

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    expect(global.axios.get).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('ログアウトが正しく動作すること', async () => {
    await act(async () => {
      render(<Monitor />);
    });

    const logoutButton = screen.getByText('ログアウト');
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/login');
  });

  it('サイドバーのメニュー選択が正しく動作すること', async () => {
    await act(async () => {
      render(<Monitor />);
    });

    const menuButton = screen.getByText('データ取得設定');
    await act(async () => {
      fireEvent.click(menuButton);
    });

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/data-config');
  });
});
```