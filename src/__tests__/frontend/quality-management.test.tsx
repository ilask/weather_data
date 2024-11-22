```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import QualityManagement from '@/pages/quality-management';

// モックの定義
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-header">Header</div>
}));

jest.mock('@/components/Sidebar', () => ({
  __esModule: true, 
  default: () => <div data-testid="mock-sidebar">Sidebar</div>
}));

jest.mock('@/components/QualityCheckPanel', () => ({
  __esModule: true,
  default: ({qualityData, onCheck, onFix}: any) => (
    <div data-testid="mock-quality-panel">
      <button onClick={onCheck}>品質チェック実行</button>
      <button onClick={() => onFix({id: '1'})}>補正実行</button>
      <div>{JSON.stringify(qualityData)}</div>
    </div>
  )
}));

const mockQualityData = {
  metrics: {
    completeness: 0.95,
    accuracy: 0.98,
    consistency: 0.97
  },
  issues: [
    {
      id: '1',
      type: 'missing_value',
      description: '欠損値検出'
    }
  ]
};

describe('QualityManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQualityData),
      })
    ) as jest.Mock;
  });

  test('初期レンダリング時に品質データを取得して表示する', async () => {
    render(<QualityManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-quality-panel')).toBeInTheDocument();
    });
  });

  test('品質チェックボタンクリック時にチェック処理が実行される', async () => {
    const user = userEvent.setup();
    render(<QualityManagement />);

    const checkButton = await screen.findByText('品質チェック実行');
    await user.click(checkButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/quality/check', {
        method: 'POST',
      });
    });
  });

  test('補正実行ボタンクリック時に補正処理が実行される', async () => {
    const user = userEvent.setup();
    render(<QualityManagement />);

    const fixButton = await screen.findByText('補正実行');
    await user.click(fixButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/quality/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: '1'})
      });
    });
  });

  test('エラー発生時にエラーメッセージが表示される', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API Error'))
    ) as jest.Mock;

    render(<QualityManagement />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('品質メトリクスが正しく表示される', async () => {
    render(<QualityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/0\.95/)).toBeInTheDocument();
      expect(screen.getByText(/0\.98/)).toBeInTheDocument();
      expect(screen.getByText(/0\.97/)).toBeInTheDocument();
    });
  });

  test('異常値検出結果が表示される', async () => {
    render(<QualityManagement />);

    await waitFor(() => {
      expect(screen.getByText('欠損値検出')).toBeInTheDocument();
    });
  });

  test('ローディング状態が表示される', async () => {
    render(<QualityManagement />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });

  test('品質チェック実行中の状態が表示される', async () => {
    const user = userEvent.setup();
    render(<QualityManagement />);

    const checkButton = await screen.findByText('品質チェック実行');
    await user.click(checkButton);

    expect(screen.getByText('品質チェック実行中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('品質チェック実行中...')).not.toBeInTheDocument();
    });
  });

  test('補正処理実行中の状態が表示される', async () => {
    const user = userEvent.setup();
    render(<QualityManagement />);

    const fixButton = await screen.findByText('補正実行');
    await user.click(fixButton);

    expect(screen.getByText('補正処理実行中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('補正処理実行中...')).not.toBeInTheDocument();
    });
  });
});
```