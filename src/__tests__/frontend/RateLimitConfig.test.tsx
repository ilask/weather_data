```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RateLimitConfig from '@/pages/RateLimitConfig';
import { jest } from '@jest/globals';

const mockLimits = [
  { id: '1', path: '/api/weather', limit: 1000, window: 3600, enabled: true },
  { id: '2', path: '/api/forecast', limit: 500, window: 1800, enabled: false }
];

describe('RateLimitConfig', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期表示時にレート制限一覧が表示される', () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('/api/weather')).toBeInTheDocument();
    expect(screen.getByText('/api/forecast')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('レート制限の追加が正しく動作する', async () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    const addButton = screen.getByText('追加');
    fireEvent.click(addButton);

    const pathInput = screen.getByPlaceholderText('APIパス');
    const limitInput = screen.getByPlaceholderText('制限回数');
    const windowInput = screen.getByPlaceholderText('期間（秒）');
    
    await userEvent.type(pathInput, '/api/new');
    await userEvent.type(limitInput, '2000');
    await userEvent.type(windowInput, '7200');
    
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(mockOnUpdate).toHaveBeenCalledWith([
      ...mockLimits,
      expect.objectContaining({
        path: '/api/new',
        limit: 2000,
        window: 7200,
        enabled: true
      })
    ]);
  });

  it('レート制限の編集が正しく動作する', async () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    const limitInput = screen.getByDisplayValue('1000');
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '1500');

    const saveButton = screen.getByText('更新');
    fireEvent.click(saveButton);

    const updatedLimits = [...mockLimits];
    updatedLimits[0] = { ...updatedLimits[0], limit: 1500 };
    
    expect(mockOnUpdate).toHaveBeenCalledWith(updatedLimits);
  });

  it('レート制限の削除が正しく動作する', async () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('削除確認')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('削除する');
    fireEvent.click(confirmButton);

    expect(mockOnUpdate).toHaveBeenCalledWith([mockLimits[1]]);
  });

  it('レート制限の有効/無効切り替えが正しく動作する', () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    const toggles = screen.getAllByRole('checkbox');
    fireEvent.click(toggles[0]);

    const updatedLimits = [...mockLimits];
    updatedLimits[0] = { ...updatedLimits[0], enabled: false };
    
    expect(mockOnUpdate).toHaveBeenCalledWith(updatedLimits);
  });

  it('入力バリデーションが正しく動作する', async () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    const addButton = screen.getByText('追加');
    fireEvent.click(addButton);

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(screen.getByText('APIパスは必須です')).toBeInTheDocument();
    expect(screen.getByText('制限回数は必須です')).toBeInTheDocument();
    expect(screen.getByText('期間は必須です')).toBeInTheDocument();

    const limitInput = screen.getByPlaceholderText('制限回数');
    await userEvent.type(limitInput, '-100');

    expect(screen.getByText('制限回数は0以上の数値を入力してください')).toBeInTheDocument();
  });

  it('一括更新が正しく動作する', async () => {
    render(<RateLimitConfig limits={mockLimits} onUpdate={mockOnUpdate} />);
    
    const bulkUpdateButton = screen.getByText('一括更新');
    fireEvent.click(bulkUpdateButton);

    const windowInputs = screen.getAllByPlaceholderText('期間（秒）');
    await userEvent.clear(windowInputs[0]);
    await userEvent.type(windowInputs[0], '3600');

    const applyButton = screen.getByText('一括適用');
    fireEvent.click(applyButton);

    const updatedLimits = mockLimits.map(limit => ({
      ...limit,
      window: 3600
    }));
    
    expect(mockOnUpdate).toHaveBeenCalledWith(updatedLimits);
  });
});
```