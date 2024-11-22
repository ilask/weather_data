```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MonitoringPanel from '@/pages/MonitoringPanel';

// モックデータ
const mockStatus = {
  isRunning: true,
  lastUpdated: '2024-01-01T00:00:00Z',
  progress: 75,
  currentTask: 'データ取得中'
};

const mockErrors = [
  {
    id: '1',
    timestamp: '2024-01-01T00:00:00Z',
    message: 'APIエラー',
    severity: 'error',
    details: {
      code: 500,
      endpoint: '/api/weather'
    }
  }
];

const mockOnRetry = jest.fn();

describe('MonitoringPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常にレンダリングされること', () => {
    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('モニタリングパネル')).toBeInTheDocument();
    expect(screen.getByText('データ取得中')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('ステータス情報が正しく表示されること', () => {
    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('実行状態：稼働中')).toBeInTheDocument();
    expect(screen.getByText('最終更新：2024/01/01 00:00:00')).toBeInTheDocument();
  });

  it('エラーリストが正しく表示されること', () => {
    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('APIエラー')).toBeInTheDocument();
    expect(screen.getByText('2024/01/01 00:00:00')).toBeInTheDocument();
  });

  it('リトライボタンクリック時にonRetryが呼ばれること', async () => {
    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByText('リトライ');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('エラーがない場合はエラーメッセージが表示されないこと', () => {
    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={[]}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.queryByText('APIエラー')).not.toBeInTheDocument();
  });

  it('進捗バーが正しく表示されること', () => {
    render(
      <MonitoringPanel 
        status={{...mockStatus, progress: 50}}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('停止中の場合は停止状態が表示されること', () => {
    render(
      <MonitoringPanel 
        status={{...mockStatus, isRunning: false}}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('実行状態：停止中')).toBeInTheDocument();
  });

  it('エラー詳細が展開できること', async () => {
    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={mockErrors}
        onRetry={mockOnRetry}
      />
    );

    const expandButton = screen.getByText('詳細を表示');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('エラーコード: 500')).toBeInTheDocument();
      expect(screen.getByText('エンドポイント: /api/weather')).toBeInTheDocument();
    });
  });

  it('エラーの重要度に応じて適切なスタイルが適用されること', () => {
    const criticalError = [{
      ...mockErrors[0],
      severity: 'critical'
    }];

    render(
      <MonitoringPanel 
        status={mockStatus}
        errors={criticalError}
        onRetry={mockOnRetry}
      />
    );

    const errorElement = screen.getByTestId('error-item-1');
    expect(errorElement).toHaveClass('error-critical');
  });
});
```