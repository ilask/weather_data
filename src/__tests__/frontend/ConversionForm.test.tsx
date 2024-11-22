```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversionForm from '@/pages/ConversionForm';
import { jest } from '@jest/globals';

const mockRules = [
  {
    id: '1',
    sourceField: '気温',
    targetField: 'temperature',
    conversionType: '数値変換',
    conversionRule: 'value * 1.0'
  },
  {
    id: '2', 
    sourceField: '湿度',
    targetField: 'humidity',
    conversionType: '数値変換',
    conversionRule: 'value * 1.0'
  }
];

const mockOnSave = jest.fn();

describe('ConversionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期表示時にルール一覧が表示される', () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    expect(screen.getByText('気温')).toBeInTheDocument();
    expect(screen.getByText('湿度')).toBeInTheDocument();
  });

  it('新規ルール追加ボタンをクリックすると入力フォームが表示される', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const addButton = screen.getByText('新規ルール追加');
    await userEvent.click(addButton);

    expect(screen.getByLabelText('変換元フィールド')).toBeInTheDocument();
    expect(screen.getByLabelText('変換先フィールド')).toBeInTheDocument();
    expect(screen.getByLabelText('変換タイプ')).toBeInTheDocument();
    expect(screen.getByLabelText('変換ルール')).toBeInTheDocument();
  });

  it('既存のルールを編集できる', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const editButton = screen.getAllByText('編集')[0];
    await userEvent.click(editButton);

    const sourceInput = screen.getByLabelText('変換元フィールド');
    await userEvent.clear(sourceInput);
    await userEvent.type(sourceInput, '気圧');

    const saveButton = screen.getByText('保存');
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: '1',
        sourceField: '気圧'
      })
    ]));
  });

  it('ルールを削除できる', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const deleteButton = screen.getAllByText('削除')[0];
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByText('削除確認');
    await userEvent.click(confirmButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.not.arrayContaining([
        expect.objectContaining({
          id: '1'
        })
      ])
    );
  });

  it('バリデーションエラーが表示される', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const addButton = screen.getByText('新規ルール追加');
    await userEvent.click(addButton);

    const saveButton = screen.getByText('保存');
    await userEvent.click(saveButton);

    expect(screen.getByText('変換元フィールドは必須です')).toBeInTheDocument();
    expect(screen.getByText('変換先フィールドは必須です')).toBeInTheDocument();
    expect(screen.getByText('変換タイプは必須です')).toBeInTheDocument();
    expect(screen.getByText('変換ルールは必須です')).toBeInTheDocument();
  });

  it('全てのルールが正しく保存される', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const addButton = screen.getByText('新規ルール追加');
    await userEvent.click(addButton);

    const sourceInput = screen.getByLabelText('変換元フィールド');
    const targetInput = screen.getByLabelText('変換先フィールド');
    const typeSelect = screen.getByLabelText('変換タイプ');
    const ruleInput = screen.getByLabelText('変換ルール');

    await userEvent.type(sourceInput, '風速');
    await userEvent.type(targetInput, 'windSpeed');
    await userEvent.selectOptions(typeSelect, '数値変換');
    await userEvent.type(ruleInput, 'value * 0.1');

    const saveButton = screen.getByText('保存');
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(expect.arrayContaining([
      ...mockRules,
      expect.objectContaining({
        sourceField: '風速',
        targetField: 'windSpeed',
        conversionType: '数値変換',
        conversionRule: 'value * 0.1'
      })
    ]));
  });

  it('フォームのキャンセルが正しく動作する', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const addButton = screen.getByText('新規ルール追加');
    await userEvent.click(addButton);

    const cancelButton = screen.getByText('キャンセル');
    await userEvent.click(cancelButton);

    expect(screen.queryByLabelText('変換元フィールド')).not.toBeInTheDocument();
  });

  it('変換タイプに応じて適切な入力フィールドが表示される', async () => {
    render(<ConversionForm rules={mockRules} onSave={mockOnSave} />);
    
    const addButton = screen.getByText('新規ルール追加');
    await userEvent.click(addButton);

    const typeSelect = screen.getByLabelText('変換タイプ');
    
    await userEvent.selectOptions(typeSelect, '数値変換');
    expect(screen.getByLabelText('変換ルール')).toBeInTheDocument();

    await userEvent.selectOptions(typeSelect, 'マッピング変換');
    expect(screen.getByText('マッピング定義')).toBeInTheDocument();
  });
});
```