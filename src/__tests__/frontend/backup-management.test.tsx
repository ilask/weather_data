```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import BackupManagement from '@/pages/backup-management';
import '@testing-library/jest-dom';

// モックデータ
const mockBackupHistory = [
  {
    id: '1',
    timestamp: '2024-01-01 10:00:00',
    status: 'success',
    size: '1.2GB',
    type: 'auto'
  },
  {
    id: '2', 
    timestamp: '2024-01-02 10:00:00',
    status: 'failed',
    size: '0B',
    type: 'manual'
  }
];

const mockScheduleConfig = {
  enabled: true,
  frequency: 'daily',
  time: '00:00',
  retention: 7
};

// モック関数
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/Header', () => {
  return function DummyHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function DummySidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/BackupPanel', () => {
  return function DummyBackupPanel({ backupHistory, onBackup, onRestore }) {
    return (
      <div data-testid="mock-backup-panel">
        <button onClick={onBackup}>バックアップ実行</button>
        <button onClick={() => onRestore(mockBackupHistory[0])}>リストア実行</button>
      </div>
    );
  };
});

describe('BackupManagement', () => {
  beforeEach(() => {
    // APIモックのリセット
    jest.clearAllMocks();
    
    // Axiosモック
    global.axios.get.mockImplementation((url) => {
      if (url.includes('/api/backup/history')) {
        return Promise.resolve({ data: mockBackupHistory });
      }
      if (url.includes('/api/backup/config')) {
        return Promise.resolve({ data: mockScheduleConfig });
      }
      return Promise.reject(new Error('Not found'));
    });

    global.axios.post.mockImplementation((url) => {
      if (url.includes('/api/backup/execute')) {
        return Promise.resolve({ data: { status: 'success' } });
      }
      if (url.includes('/api/backup/restore')) {
        return Promise.resolve({ data: { status: 'success' } });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('初期表示時にバックアップ履歴とスケジュール設定を取得して表示すること', async () => {
    render(<BackupManagement />);

    // ヘッダーとサイドバーが表示されていること
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    
    // バックアップパネルが表示されていること
    expect(screen.getByTestId('mock-backup-panel')).toBeInTheDocument();

    // APIが呼ばれていること
    await waitFor(() => {
      expect(global.axios.get).toHaveBeenCalledWith('/api/backup/history');
      expect(global.axios.get).toHaveBeenCalledWith('/api/backup/config');
    });
  });

  it('手動バックアップを実行できること', async () => {
    render(<BackupManagement />);

    const backupButton = screen.getByText('バックアップ実行');
    await act(async () => {
      fireEvent.click(backupButton);
    });

    await waitFor(() => {
      expect(global.axios.post).toHaveBeenCalledWith('/api/backup/execute', expect.any(Object));
    });
  });

  it('リストアを実行できること', async () => {
    render(<BackupManagement />);

    const restoreButton = screen.getByText('リストア実行');
    await act(async () => {
      fireEvent.click(restoreButton);
    });

    await waitFor(() => {
      expect(global.axios.post).toHaveBeenCalledWith('/api/backup/restore', {
        backupId: mockBackupHistory[0].id
      });
    });
  });

  it('エラー時にエラーメッセージを表示すること', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('バックアップ履歴の取得に失敗しました'));

    render(<BackupManagement />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('ローディング中はローディング表示されること', async () => {
    render(<BackupManagement />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });
});
```