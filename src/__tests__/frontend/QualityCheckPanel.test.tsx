```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import QualityCheckPanel from '@/pages/QualityCheckPanel';

interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  issues: QualityIssue[];
}

interface QualityIssue {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'fixed';
}

const mockQualityData: QualityMetrics = {
  completeness: 95,
  accuracy: 98,
  consistency: 92,
  issues: [
    {
      id: '1',
      type: 'missing_data',
      description: '温度データの欠損',
      severity: 'high',
      status: 'open'
    },
    {
      id: '2', 
      type: 'outlier',
      description: '異常値の検出',
      severity: 'medium',
      status: 'open'
    }
  ]
};

describe('QualityCheckPanel', () => {
  const mockOnCheck = jest.fn();
  const mockOnFix = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しくメトリクスとイシューが表示されること', () => {
    render(
      <QualityCheckPanel 
        qualityData={mockQualityData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    expect(screen.getByText('完全性: 95%')).toBeInTheDocument();
    expect(screen.getByText('正確性: 98%')).toBeInTheDocument();
    expect(screen.getByText('一貫性: 92%')).toBeInTheDocument();
    expect(screen.getByText('温度データの欠損')).toBeInTheDocument();
    expect(screen.getByText('異常値の検出')).toBeInTheDocument();
  });

  it('品質チェックボタンをクリックするとonCheckが呼ばれること', async () => {
    render(
      <QualityCheckPanel 
        qualityData={mockQualityData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    const checkButton = screen.getByText('品質チェック実行');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(mockOnCheck).toHaveBeenCalledTimes(1);
    });
  });

  it('イシューの修正ボタンをクリックするとonFixが正しく呼ばれること', async () => {
    render(
      <QualityCheckPanel 
        qualityData={mockQualityData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    const fixButtons = screen.getAllByText('修正');
    fireEvent.click(fixButtons[0]);

    await waitFor(() => {
      expect(mockOnFix).toHaveBeenCalledWith(mockQualityData.issues[0]);
    });
  });

  it('深刻度に応じて正しいスタイルが適用されること', () => {
    render(
      <QualityCheckPanel 
        qualityData={mockQualityData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    const highSeverity = screen.getByText('高');
    const mediumSeverity = screen.getByText('中');

    expect(highSeverity).toHaveClass('bg-red-500');
    expect(mediumSeverity).toHaveClass('bg-yellow-500');
  });

  it('メトリクスが閾値を下回る場合に警告が表示されること', () => {
    const lowQualityData = {
      ...mockQualityData,
      completeness: 70,
      accuracy: 75
    };

    render(
      <QualityCheckPanel 
        qualityData={lowQualityData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    expect(screen.getByText('品質メトリクスが基準値を下回っています')).toBeInTheDocument();
  });

  it('イシューがない場合に適切なメッセージが表示されること', () => {
    const noIssuesData = {
      ...mockQualityData,
      issues: []
    };

    render(
      <QualityCheckPanel 
        qualityData={noIssuesData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    expect(screen.getByText('検出された品質問題はありません')).toBeInTheDocument();
  });

  it('ローディング中の表示が正しく動作すること', async () => {
    const { rerender } = render(
      <QualityCheckPanel 
        qualityData={null}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    expect(screen.getByText('データ読み込み中...')).toBeInTheDocument();

    rerender(
      <QualityCheckPanel 
        qualityData={mockQualityData}
        onCheck={mockOnCheck}
        onFix={mockOnFix}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('データ読み込み中...')).not.toBeInTheDocument();
    });
  });
});
```