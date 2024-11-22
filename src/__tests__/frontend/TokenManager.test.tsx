```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import TokenManager from '@/pages/TokenManager';
import { jest } from '@jest/globals';

const mockTokens = [
  { id: '1', token: 'token1', createdAt: '2024-01-01', expiresAt: '2024-12-31', status: 'active' },
  { id: '2', token: 'token2', createdAt: '2024-01-01', expiresAt: '2024-12-31', status: 'revoked' }
];

const mockOnGenerate = jest.fn();
const mockOnRevoke = jest.fn();

const renderTokenManager = () => {
  return render(
    <TokenManager 
      tokens={mockTokens}
      onGenerate={mockOnGenerate}
      onRevoke={mockOnRevoke}
    />
  );
};

describe('TokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('トークン一覧が正しく表示されること', () => {
    renderTokenManager();
    
    expect(screen.getByText('token1')).toBeInTheDocument();
    expect(screen.getByText('token2')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('2024-12-31')).toBeInTheDocument();
  });

  it('トークン生成ボタンがクリックされた時にonGenerateが呼ばれること', () => {
    renderTokenManager();
    
    const generateButton = screen.getByText('新規トークン生成');
    fireEvent.click(generateButton);
    
    expect(mockOnGenerate).toHaveBeenCalledTimes(1);
  });

  it('トークン無効化ボタンがクリックされた時にonRevokeが呼ばれること', () => {
    renderTokenManager();
    
    const revokeButton = screen.getAllByText('無効化')[0];
    fireEvent.click(revokeButton);
    
    expect(mockOnRevoke).toHaveBeenCalledWith('token1');
  });

  it('トークンの状態に応じて無効化ボタンが制御されること', () => {
    renderTokenManager();
    
    const revokeButtons = screen.getAllByText('無効化');
    expect(revokeButtons[0]).not.toBeDisabled();
    expect(revokeButtons[1]).toBeDisabled();
  });

  it('検索機能でトークンをフィルタリングできること', () => {
    renderTokenManager();
    
    const searchInput = screen.getByPlaceholderText('トークンを検索');
    fireEvent.change(searchInput, { target: { value: 'token1' } });
    
    expect(screen.getByText('token1')).toBeInTheDocument();
    expect(screen.queryByText('token2')).not.toBeInTheDocument();
  });

  it('トークンの詳細情報が表示されること', () => {
    renderTokenManager();
    
    const detailsButton = screen.getAllByText('詳細')[0];
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('トークン詳細情報')).toBeInTheDocument();
    expect(screen.getByText('ID: 1')).toBeInTheDocument();
    expect(screen.getByText('作成日: 2024-01-01')).toBeInTheDocument();
  });

  it('ソート機能が正しく動作すること', () => {
    renderTokenManager();
    
    const sortButton = screen.getByText('作成日');
    fireEvent.click(sortButton);
    
    const tokenElements = screen.getAllByTestId('token-row');
    expect(tokenElements[0]).toHaveTextContent('token2');
    expect(tokenElements[1]).toHaveTextContent('token1');
  });

  it('エラーメッセージが表示されること', async () => {
    mockOnGenerate.mockRejectedValueOnce(new Error('トークン生成に失敗しました'));
    renderTokenManager();
    
    const generateButton = screen.getByText('新規トークン生成');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('トークン生成に失敗しました')).toBeInTheDocument();
    });
  });

  it('トークンのコピー機能が動作すること', () => {
    const mockClipboard = {
      writeText: jest.fn()
    };
    Object.assign(navigator, {
      clipboard: mockClipboard
    });
    
    renderTokenManager();
    
    const copyButton = screen.getAllByText('コピー')[0];
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('token1');
  });

  it('ページネーションが正しく動作すること', () => {
    renderTokenManager();
    
    const nextPageButton = screen.getByText('次へ');
    fireEvent.click(nextPageButton);
    
    expect(screen.getByText('ページ 2')).toBeInTheDocument();
  });
});
```