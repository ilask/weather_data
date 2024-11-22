```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import DataConfigScreen from '@/pages/data-config';
import '@testing-library/jest-dom';
import axios from 'axios';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/Header', () => {
  return function MockHeader({ title, onLogout }: { title: string; onLogout: () => void }) {
    return (
      <div data-testid="mock-header">
        <h1>{title}</h1>
        <button onClick={onLogout}>ログアウト</button>
      </div>
    );
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar({ activeItem }: { activeItem: string }) {
    return <div data-testid="mock-sidebar">Sidebar: {activeItem}</div>;
  };
});

jest.mock('@/components/ConfigForm', () => {
  return function MockConfigForm({ config, onSave }: { config: any; onSave: (data: any) => void }) {
    return (
      <div data-testid="mock-config-form">
        <button onClick={() => onSave(config)}>設定を保存</button>
      </div>
    );
  };
});

const mockWeatherConfig = {
  areaCode: '130000',
  items: ['temperature', 'rainfall'],
  schedule: '0 0 * * *'
};

describe('DataConfigScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しくレンダリングされること', () => {
    render(<DataConfigScreen />);
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-config-form')).toBeInTheDocument();
  });

  it('地域コードを入力できること', async () => {
    render(<DataConfigScreen />);
    const areaCodeInput = screen.getByLabelText('地域コード');
    await userEvent.type(areaCodeInput, '130000');
    expect(areaCodeInput).toHaveValue('130000');
  });

  it('気象データ項目を選択できること', async () => {
    render(<DataConfigScreen />);
    const temperatureCheckbox = screen.getByLabelText('気温');
    const rainfallCheckbox = screen.getByLabelText('降水量');
    
    await userEvent.click(temperatureCheckbox);
    await userEvent.click(rainfallCheckbox);
    
    expect(temperatureCheckbox).toBeChecked();
    expect(rainfallCheckbox).toBeChecked();
  });

  it('スケジュール設定を入力できること', async () => {
    render(<DataConfigScreen />);
    const scheduleInput = screen.getByLabelText('実行スケジュール');
    await userEvent.type(scheduleInput, '0 0 * * *');
    expect(scheduleInput).toHaveValue('0 0 * * *');
  });

  it('設定を保存できること', async () => {
    const mockAxios = axios as jest.Mocked<typeof axios>;
    mockAxios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<DataConfigScreen />);
    
    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/weather-config', expect.any(Object));
    });
  });

  it('保存失敗時にエラーメッセージが表示されること', async () => {
    const mockAxios = axios as jest.Mocked<typeof axios>;
    mockAxios.post.mockRejectedValueOnce(new Error('設定の保存に失敗しました'));

    render(<DataConfigScreen />);
    
    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('設定の保存に失敗しました')).toBeInTheDocument();
    });
  });

  it('初期データが正しく読み込まれること', async () => {
    const mockAxios = axios as jest.Mocked<typeof axios>;
    mockAxios.get.mockResolvedValueOnce({ data: mockWeatherConfig });

    render(<DataConfigScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('地域コード')).toHaveValue('130000');
      expect(screen.getByLabelText('気温')).toBeChecked();
      expect(screen.getByLabelText('降水量')).toBeChecked();
      expect(screen.getByLabelText('実行スケジュール')).toHaveValue('0 0 * * *');
    });
  });

  it('フォームのバリデーションが機能すること', async () => {
    render(<DataConfigScreen />);
    
    const saveButton = screen.getByText('設定を保存');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('地域コードは必須です')).toBeInTheDocument();
      expect(screen.getByText('1つ以上の項目を選択してください')).toBeInTheDocument();
      expect(screen.getByText('スケジュールは必須です')).toBeInTheDocument();
    });
  });

  it('ログアウトボタンが機能すること', async () => {
    const mockRouter = useRouter as jest.Mock;
    render(<DataConfigScreen />);
    
    const logoutButton = screen.getByText('ログアウト');
    await userEvent.click(logoutButton);

    expect(mockRouter).toHaveBeenCalledWith('/login');
  });
});
```