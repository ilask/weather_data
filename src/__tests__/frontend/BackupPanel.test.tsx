```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupPanel from '@/pages/BackupPanel';
import { format } from 'date-fns';

type BackupLog = {
  id: string;
  filename: string;
  createdAt: string;
  size: string;
  status: 'completed' | 'failed';
};

describe('BackupPanel', () => {
  const mockBackupHistory: BackupLog[] = [
    {
      id: '1',
      filename: 'backup_20240101.zip',
      createdAt: '2024-01-01T10:00:00Z',
      size: '1.2GB',
      status: 'completed'
    },
    {
      id: '2', 
      filename: 'backup_20240102.zip',
      createdAt: '2024-01-02T10:00:00Z',
      size: '1.3GB',
      status: 'failed'
    }
  ];

  const mockOnBackup = jest.fn();
  const mockOnRestore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('バックアップ履歴が正しく表示される', () => {
    render(
      <BackupPanel 
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
      />
    );

    expect(screen.getByText('バックアップ管理')).toBeInTheDocument();
    expect(screen.getByText('backup_20240101.zip')).toBeInTheDocument();
    expect(screen.getByText('backup_20240102.zip')).toBeInTheDocument();
    expect(screen.getByText('1.2GB')).toBeInTheDocument();
    expect(screen.getByText('1.3GB')).toBeInTheDocument();
  });

  it('バックアップボタンクリック時にonBackupが呼ばれる', async () => {
    render(
      <BackupPanel
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
      />
    );

    const backupButton = screen.getByText('新規バックアップ');
    await userEvent.click(backupButton);

    expect(mockOnBackup).toHaveBeenCalledTimes(1);
  });

  it('リストアボタンクリック時にonRestoreが呼ばれる', async () => {
    render(
      <BackupPanel
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
      />
    );

    const restoreButtons = screen.getAllByText('リストア');
    await userEvent.click(restoreButtons[0]);

    expect(mockOnRestore).toHaveBeenCalledTimes(1);
    expect(mockOnRestore).toHaveBeenCalledWith(mockBackupHistory[0]);
  });

  it('バックアップ履歴の日付が正しいフォーマットで表示される', () => {
    render(
      <BackupPanel
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
      />
    );

    const formattedDate1 = format(new Date(mockBackupHistory[0].createdAt), 'yyyy/MM/dd HH:mm');
    const formattedDate2 = format(new Date(mockBackupHistory[1].createdAt), 'yyyy/MM/dd HH:mm');

    expect(screen.getByText(formattedDate1)).toBeInTheDocument();
    expect(screen.getByText(formattedDate2)).toBeInTheDocument();
  });

  it('ステータスに応じて適切なスタイルが適用される', () => {
    render(
      <BackupPanel
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
      />
    );

    const successStatus = screen.getByText('完了');
    const failedStatus = screen.getByText('失敗');

    expect(successStatus).toHaveClass('text-green-600');
    expect(failedStatus).toHaveClass('text-red-600');
  });

  it('バックアップ履歴が空の場合、適切なメッセージが表示される', () => {
    render(
      <BackupPanel
        backupHistory={[]}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
      />
    );

    expect(screen.getByText('バックアップ履歴がありません')).toBeInTheDocument();
  });

  it('バックアップ操作中は操作ボタンが無効化される', async () => {
    const { rerender } = render(
      <BackupPanel
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
        isProcessing={true}
      />
    );

    const backupButton = screen.getByText('新規バックアップ');
    const restoreButtons = screen.getAllByText('リストア');

    expect(backupButton).toBeDisabled();
    expect(restoreButtons[0]).toBeDisabled();

    rerender(
      <BackupPanel
        backupHistory={mockBackupHistory}
        onBackup={mockOnBackup}
        onRestore={mockOnRestore}
        isProcessing={false}
      />
    );

    expect(backupButton).not.toBeDisabled();
    expect(restoreButtons[0]).not.toBeDisabled();
  });
});
```