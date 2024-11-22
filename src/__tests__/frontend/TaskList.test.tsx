```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '@/pages/TaskList';
import { jest } from '@jest/globals';

const mockTasks = [
  {
    id: '1',
    title: 'データ取得タスク',
    description: '気象データの自動取得',
    status: '実行中',
    schedule: '毎日 0時',
    nextRun: '2024-01-01 00:00:00',
    lastRun: '2023-12-31 00:00:00'
  },
  {
    id: '2', 
    title: 'データ変換タスク',
    description: '取得データの正規化',
    status: '待機中',
    schedule: '毎日 1時',
    nextRun: '2024-01-01 01:00:00',
    lastRun: '2023-12-31 01:00:00'
  }
];

describe('TaskList', () => {
  const mockOnTaskUpdate = jest.fn();
  const mockOnTaskDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('タスク一覧が正しく表示される', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('データ取得タスク')).toBeInTheDocument();
    expect(screen.getByText('データ変換タスク')).toBeInTheDocument();
  });

  it('タスクの更新が呼び出される', async () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const editButton = screen.getAllByRole('button', { name: '編集' })[0];
    fireEvent.click(editButton);

    const titleInput = screen.getByDisplayValue('データ取得タスク');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '新しいタスク名');

    const saveButton = screen.getByRole('button', { name: '保存' });
    fireEvent.click(saveButton);

    expect(mockOnTaskUpdate).toHaveBeenCalledWith({
      ...mockTasks[0],
      title: '新しいタスク名'
    });
  });

  it('タスクの削除が呼び出される', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const deleteButton = screen.getAllByRole('button', { name: '削除' })[0];
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: '確認' });
    fireEvent.click(confirmButton);

    expect(mockOnTaskDelete).toHaveBeenCalledWith('1');
  });

  it('タスクのフィルタリングが動作する', async () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const filterInput = screen.getByPlaceholderText('タスク名で検索');
    await userEvent.type(filterInput, 'データ取得');

    expect(screen.getByText('データ取得タスク')).toBeInTheDocument();
    expect(screen.queryByText('データ変換タスク')).not.toBeInTheDocument();
  });

  it('タスクのソートが動作する', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const sortButton = screen.getByRole('button', { name: 'ステータスでソート' });
    fireEvent.click(sortButton);

    const taskElements = screen.getAllByRole('listitem');
    expect(taskElements[0]).toHaveTextContent('待機中');
    expect(taskElements[1]).toHaveTextContent('実行中');
  });

  it('空のタスク一覧が表示される', () => {
    render(
      <TaskList
        tasks={[]}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('タスクが登録されていません')).toBeInTheDocument();
  });

  it('タスクの詳細表示が切り替わる', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const expandButton = screen.getAllByRole('button', { name: '詳細' })[0];
    fireEvent.click(expandButton);

    expect(screen.getByText('次回実行: 2024-01-01 00:00:00')).toBeInTheDocument();
    expect(screen.getByText('前回実行: 2023-12-31 00:00:00')).toBeInTheDocument();
  });

  it('削除確認ダイアログがキャンセルできる', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const deleteButton = screen.getAllByRole('button', { name: '削除' })[0];
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(mockOnTaskDelete).not.toHaveBeenCalled();
  });

  it('タスクの一括選択が動作する', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const selectAllCheckbox = screen.getByRole('checkbox', { name: '全て選択' });
    fireEvent.click(selectAllCheckbox);

    const taskCheckboxes = screen.getAllByRole('checkbox', { name: /タスク選択/ });
    taskCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('エラー状態が表示される', async () => {
    const tasksWithError = [{
      ...mockTasks[0],
      status: 'エラー',
      errorMessage: 'タスクの実行に失敗しました'
    }];

    render(
      <TaskList
        tasks={tasksWithError}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('エラー')).toHaveClass('error-status');
    expect(screen.getByText('タスクの実行に失敗しました')).toBeInTheDocument();
  });
});
```