```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigForm from '@/pages/ConfigForm';
import { act } from 'react-dom/test-utils';

const mockOnSave = jest.fn();

const defaultConfig = {
  dataFetchInterval: 15,
  maxRetryCount: 3,
  locations: ['東京', '大阪'],
  dataTypes: ['気温', '湿度'],
  alertThreshold: {
    temperature: 35,
    humidity: 80
  },
  saveHistoryDays: 30,
};

describe('ConfigForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初期値が正しく表示される', () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);
    
    expect(screen.getByLabelText('データ取得間隔（分）')).toHaveValue(15);
    expect(screen.getByLabelText('最大リトライ回数')).toHaveValue(3);
    expect(screen.getByLabelText('保存期間（日）')).toHaveValue(30);
    expect(screen.getByLabelText('気温アラートしきい値')).toHaveValue(35);
    expect(screen.getByLabelText('湿度アラートしきい値')).toHaveValue(80);
  });

  test('各入力フィールドの値変更が動作する', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const intervalInput = screen.getByLabelText('データ取得間隔（分）');
    const retryInput = screen.getByLabelText('最大リトライ回数');
    
    await act(async () => {
      await userEvent.clear(intervalInput);
      await userEvent.type(intervalInput, '30');
      
      await userEvent.clear(retryInput);
      await userEvent.type(retryInput, '5');
    });

    expect(intervalInput).toHaveValue(30);
    expect(retryInput).toHaveValue(5);
  });

  test('地域選択の追加と削除が動作する', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const addLocationButton = screen.getByText('地域を追加');
    await userEvent.click(addLocationButton);

    const locationInput = screen.getByPlaceholderText('新しい地域を入力');
    await userEvent.type(locationInput, '名古屋{enter}');

    expect(screen.getByText('名古屋')).toBeInTheDocument();

    const removeButtons = screen.getAllByText('削除');
    await userEvent.click(removeButtons[0]);

    expect(screen.queryByText('東京')).not.toBeInTheDocument();
  });

  test('データ種別の選択が動作する', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const dataTypeSelect = screen.getByLabelText('データ種別選択');
    await userEvent.selectOptions(dataTypeSelect, ['降水量']);

    expect(screen.getByText('降水量')).toBeInTheDocument();
  });

  test('フォーム送信時にonSaveが呼び出される', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const saveButton = screen.getByText('設定を保存');
    
    await act(async () => {
      await userEvent.click(saveButton);
    });

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      dataFetchInterval: 15,
      maxRetryCount: 3,
      locations: ['東京', '大阪'],
      dataTypes: ['気温', '湿度'],
      alertThreshold: {
        temperature: 35,
        humidity: 80
      },
      saveHistoryDays: 30
    }));
  });

  test('バリデーションエラーが正しく表示される', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const intervalInput = screen.getByLabelText('データ取得間隔（分）');
    
    await act(async () => {
      await userEvent.clear(intervalInput);
      await userEvent.type(intervalInput, '0');
    });

    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    expect(screen.getByText('データ取得間隔は1以上の値を入力してください')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('リセットボタンで初期値に戻る', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const intervalInput = screen.getByLabelText('データ取得間隔（分）');
    await act(async () => {
      await userEvent.clear(intervalInput);
      await userEvent.type(intervalInput, '30');
    });

    const resetButton = screen.getByText('リセット');
    await userEvent.click(resetButton);

    expect(intervalInput).toHaveValue(15);
  });

  test('非同期バリデーションが動作する', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const locationInput = screen.getByPlaceholderText('新しい地域を入力');
    await act(async () => {
      await userEvent.type(locationInput, '無効な地域{enter}');
    });

    await waitFor(() => {
      expect(screen.getByText('無効な地域コードです')).toBeInTheDocument();
    });
  });

  test('フォームのロード中状態が正しく表示される', async () => {
    render(<ConfigForm config={defaultConfig} onSave={mockOnSave} />);

    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByText('保存中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
});
```