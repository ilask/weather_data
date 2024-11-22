```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusPanel from '@/pages/StatusPanel';
import { SystemMetrics, SystemStatus } from '@/types';

const mockMetrics: SystemMetrics = {
  cpu: 45.5,
  memory: 65.2,
  disk: 78.3,
  network: {
    incoming: 1250,
    outgoing: 890
  },
  uptime: '5d 12h 30m',
  lastUpdate: '2024-01-20T10:30:00Z'
};

const mockStatus: SystemStatus = {
  overall: 'healthy',
  components: {
    dataFetcher: 'active',
    database: 'active', 
    apiServer: 'active',
    taskScheduler: 'warning'
  },
  alerts: [
    {
      id: 'alert-1',
      severity: 'warning',
      message: 'タスクスケジューラーの応答が遅延しています',
      timestamp: '2024-01-20T10:25:00Z'
    }
  ]
};

describe('StatusPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メトリクスとステータスが正しく表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    expect(screen.getByText('システムステータス')).toBeInTheDocument();
    expect(screen.getByText('45.5%')).toBeInTheDocument(); // CPU使用率
    expect(screen.getByText('65.2%')).toBeInTheDocument(); // メモリ使用率
    expect(screen.getByText('78.3%')).toBeInTheDocument(); // ディスク使用率
  });

  it('コンポーネントステータスが正しく表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    const components = screen.getByTestId('component-status-list');
    expect(components).toHaveTextContent('データフェッチャー: 稼働中');
    expect(components).toHaveTextContent('データベース: 稼働中');
    expect(components).toHaveTextContent('APIサーバー: 稼働中');
    expect(components).toHaveTextContent('タスクスケジューラー: 警告');
  });

  it('アラートが正しく表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    const alerts = screen.getByTestId('alert-list');
    expect(alerts).toHaveTextContent('タスクスケジューラーの応答が遅延しています');
  });

  it('メトリクスの更新時間が正しく表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    expect(screen.getByText('最終更新: 2024/01/20 19:30:00')).toBeInTheDocument();
  });

  it('稼働時間が正しく表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    expect(screen.getByText('稼働時間: 5d 12h 30m')).toBeInTheDocument();
  });

  it('ネットワークトラフィックが正しく表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    expect(screen.getByText('1250 KB/s')).toBeInTheDocument(); // 受信
    expect(screen.getByText('890 KB/s')).toBeInTheDocument(); // 送信
  });

  it('警告状態のコンポーネントが強調表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    const warningComponent = screen.getByText('タスクスケジューラー: 警告');
    expect(warningComponent).toHaveClass('warning');
  });

  it('システム全体のステータスに応じて適切なアイコンが表示されること', () => {
    render(<StatusPanel metrics={mockMetrics} status={mockStatus} />);
    
    const statusIcon = screen.getByTestId('overall-status-icon');
    expect(statusIcon).toHaveClass('healthy');
  });

  it('高負荷状態でメトリクスが強調表示されること', () => {
    const highLoadMetrics = {
      ...mockMetrics,
      cpu: 90.5,
      memory: 95.2
    };
    
    render(<StatusPanel metrics={highLoadMetrics} status={mockStatus} />);
    
    const cpuMetric = screen.getByTestId('cpu-metric');
    const memoryMetric = screen.getByTestId('memory-metric');
    
    expect(cpuMetric).toHaveClass('critical');
    expect(memoryMetric).toHaveClass('critical');
  });
});
```