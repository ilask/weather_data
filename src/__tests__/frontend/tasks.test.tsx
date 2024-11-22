```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Tasks from '@/pages/tasks';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// モックデータ
const mockTasks = [
  {
    id: '1',
    name: 'データ取得タスク',
    schedule: '0 0 * * *', 
    status: 'active',
    lastRun: '2024-01-01T00:00:00Z',
    nextRun: '2024-01-02T00:00:00Z'
  },
  {
    id: '2',
    name: 'バックアップタスク',
    schedule: '0 12 * * *',
    status: 'inactive',
    lastRun: '2024-01-01T12:00:00Z',
    nextRun: '2024-01-02T12:00:00Z'
  }
];

const mockApiResponse = {
  data: mockTasks,
  status: 200
};

// モック
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve(mockApiResponse)),
  post: jest.fn(() => Promise.resolve({ status: 200 })),
  put: jest.fn(() => Promise.resolve({ status: 200 })),
  delete: jest.fn(() => Promise.resolve({ status: 200 }))
}));

describe('Tasks画面のテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('画面の初期表示が正しく行われる', async () => {
    render(<Tasks />);
    
    expect(screen.getByText('タスク一覧')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('データ取得タスク')).toBeInTheDocument();
      expect(screen.getByText('バックアップタスク')).toBeInTheDocument();
    });
  });

  test('新規タスク作成ボタンが機能する', async () => {
    render(<Tasks />);
    
    const newTaskButton = screen.getByText('新規タスク作成');
    fireEvent.click(newTaskButton);

    expect(screen.getByText('タスク作成')).toBeInTheDocument();
    expect(screen.getByLabelText('タスク名')).toBeInTheDocument();
    expect(screen.getByLabelText('スケジュール')).toBeInTheDocument();
  });

  test('タスクの編集が正しく機能する', async () => {
    render(<Tasks />);

    await waitFor(() => {
      const editButton = screen.getAllByText('編集')[0];
      fireEvent.click(editButton);
    });

    const nameInput = screen.getByLabelText('タスク名');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '更新後のタスク名');

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.axios.put).toHaveBeenCalled();
    });
  });

  test('タスクの削除が正しく機能する', async () => {
    render(<Tasks />);

    await waitFor(() => {
      const deleteButton = screen.getAllByText('削除')[0];
      fireEvent.click(deleteButton);
    });

    const confirmButton = screen.getByText('確認');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.axios.delete).toHaveBeenCalled();
    });
  });

  test('タスクの状態切り替えが機能する', async () => {
    render(<Tasks />);

    await waitFor(() => {
      const statusToggle = screen.getAllByRole('switch')[0];
      fireEvent.click(statusToggle);
    });

    await waitFor(() => {
      expect(global.axios.put).toHaveBeenCalled();
    });
  });

  test('エラー時にエラーメッセージが表示される', async () => {
    global.axios.get.mockRejectedValueOnce(new Error('APIエラー'));
    
    render(<Tasks />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('タスク詳細の表示が正しく機能する', async () => {
    render(<Tasks />);

    await waitFor(() => {
      const taskName = screen.getByText('データ取得タスク');
      fireEvent.click(taskName);
    });

    expect(screen.getByText('タスク詳細')).toBeInTheDocument();
    expect(screen.getByText('最終実行:')).toBeInTheDocument();
    expect(screen.getByText('次回実行:')).toBeInTheDocument();
  });

  test('検索フィルターが正しく機能する', async () => {
    render(<Tasks />);

    const searchInput = screen.getByPlaceholderText('タスク名で検索');
    await userEvent.type(searchInput, 'データ取得');

    await waitFor(() => {
      expect(screen.getByText('データ取得タスク')).toBeInTheDocument();
      expect(screen.queryByText('バックアップタスク')).not.toBeInTheDocument();
    });
  });

  test('ソート機能が正しく動作する', async () => {
    render(<Tasks />);

    const sortButton = screen.getByText('名前順');
    fireEvent.click(sortButton);

    await waitFor(() => {
      const taskNames = screen.getAllByTestId('task-name');
      expect(taskNames[0]).toHaveTextContent('バックアップタスク');
      expect(taskNames[1]).toHaveTextContent('データ取得タスク');
    });
  });

  test('ページネーションが正しく機能する', async () => {
    const manyTasks = Array(20).fill(null).map((_, i) => ({
      id: String(i),
      name: `タスク${i}`,
      schedule: '0 0 * * *',
      status: 'active',
      lastRun: '2024-01-01T00:00:00Z',
      nextRun: '2024-01-02T00:00:00Z'
    }));

    global.axios.get.mockResolvedValueOnce({ data: manyTasks, status: 200 });

    render(<Tasks />);

    await waitFor(() => {
      const nextPageButton = screen.getByLabelText('次のページ');
      fireEvent.click(nextPageButton);
    });

    expect(screen.getByText('タスク10')).toBeInTheDocument();
  });
});
```