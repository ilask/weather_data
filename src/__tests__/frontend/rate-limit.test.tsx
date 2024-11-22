```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RateLimit from '@/pages/rate-limit';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import axios from 'axios';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn()
};

describe('RateLimit画面のテスト', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const mockLimitData = {
    limits: [
      { clientId: 'client1', requestsPerMinute: 60, isBlocked: false },
      { clientId: 'client2', requestsPerMinute: 30, isBlocked: true }
    ],
    currentStatus: {
      totalRequests: 1000,
      blockedClients: 1
    }
  };

  test('画面の初期表示が正しく行われる', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLimitData });

    render(<RateLimit />);

    await waitFor(() => {
      expect(screen.getByText('レート制限設定')).toBeInTheDocument();
      expect(screen.getByText('制限状況モニター')).toBeInTheDocument();
      expect(screen.getByText('ブロックリスト')).toBeInTheDocument();
    });
  });

  test('レート制限値の更新が正しく動作する', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLimitData });
    (axios.put as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<RateLimit />);

    const limitInput = await screen.findByLabelText('制限値（リクエスト/分）');
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '100');

    const saveButton = screen.getByText('保存');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/rate-limits', expect.any(Object));
    });
  });

  test('クライアントのブロック/解除が正しく動作する', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLimitData });
    (axios.post as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<RateLimit />);

    const blockButton = await screen.findByText('ブロック解除');
    await userEvent.click(blockButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/client-block', expect.any(Object));
    });
  });

  test('エラー時にエラーメッセージが表示される', async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<RateLimit />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('現在の制限状況が正しく表示される', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLimitData });

    render(<RateLimit />);

    await waitFor(() => {
      expect(screen.getByText('総リクエスト数: 1000')).toBeInTheDocument();
      expect(screen.getByText('ブロック中のクライアント: 1')).toBeInTheDocument();
    });
  });

  test('制限値の入力バリデーションが正しく機能する', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLimitData });

    render(<RateLimit />);

    const limitInput = await screen.findByLabelText('制限値（リクエスト/分）');
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '-1');

    const saveButton = screen.getByText('保存');
    await userEvent.click(saveButton);

    expect(screen.getByText('0以上の値を入力してください')).toBeInTheDocument();
  });

  test('クライアントIDでの検索フィルタリングが正しく動作する', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLimitData });

    render(<RateLimit />);

    const searchInput = await screen.findByPlaceholderText('クライアントID検索');
    await userEvent.type(searchInput, 'client1');

    await waitFor(() => {
      expect(screen.getByText('client1')).toBeInTheDocument();
      expect(screen.queryByText('client2')).not.toBeInTheDocument();
    });
  });
});
```