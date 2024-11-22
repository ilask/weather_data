```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import FormatConfig from '@/pages/format-config';
import userEvent from '@testing-library/user-event';

// モックの定義
jest.mock('@/components/Header', () => {
  return function DummyHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function DummySidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/ConversionForm', () => {
  return function DummyConversionForm({ onSave }: { onSave: (rules: any[]) => void }) {
    return (
      <div data-testid="conversion-form">
        <button onClick={() => onSave([])}>Save</button>
      </div>
    );
  };
});

const mockAxios = {
  get: jest.fn(),
  post: jest.fn()
};

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios
}));

describe('FormatConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockResolvedValue({ 
      data: { 
        rules: [],
        previewData: []
      } 
    });
    mockAxios.post.mockResolvedValue({ 
      data: { 
        success: true 
      } 
    });
  });

  it('共通コンポーネントが正しく表示されること', () => {
    render(<FormatConfig />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('conversion-form')).toBeInTheDocument();
  });

  it('初期データの読み込みが正しく行われること', async () => {
    render(<FormatConfig />);
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/conversion-rules');
    });
  });

  it('プレビューデータが正しく表示されること', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: {
        previewData: [
          { id: 1, data: 'テストデータ1' },
          { id: 2, data: 'テストデータ2' }
        ]
      }
    });

    render(<FormatConfig />);
    
    await waitFor(() => {
      expect(screen.getByText('テストデータ1')).toBeInTheDocument();
      expect(screen.getByText('テストデータ2')).toBeInTheDocument();
    });
  });

  it('変換ルールの保存が正しく行われること', async () => {
    render(<FormatConfig />);
    
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/conversion-rules', {
        rules: []
      });
    });
  });

  it('エラー時にエラーメッセージが表示されること', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('保存に失敗しました'));
    
    render(<FormatConfig />);
    
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました：保存に失敗しました')).toBeInTheDocument();
    });
  });

  it('バリデーションエラーが正しく表示されること', async () => {
    mockAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          errors: ['必須項目が未入力です']
        }
      }
    });

    render(<FormatConfig />);
    
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('必須項目が未入力です')).toBeInTheDocument();
    });
  });

  it('プレビュー更新が正しく行われること', async () => {
    render(<FormatConfig />);
    
    const updateButton = screen.getByText('プレビュー更新');
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/preview-data');
    });
  });

  it('ローディング状態が正しく表示されること', async () => {
    mockAxios.get.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<FormatConfig />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });
});
```