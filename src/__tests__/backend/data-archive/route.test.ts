import { createMocks } from 'node-mocks-http';
import { NextApiRequest } from 'next';
import archiveHandler from '@/pages/api/data-archive';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('データアーカイブ API', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    data: null,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('1年以上前のデータを正常にアーカイブできること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const archiveData = [
      { id: 1, weather_data: { temp: 25 }, created_at: '2022-01-01' },
      { id: 2, weather_data: { temp: 28 }, created_at: '2022-01-02' }
    ];

    mockSupabaseClient.data = archiveData;
    mockSupabaseClient.select.mockResolvedValue({ data: archiveData, error: null });
    mockSupabaseClient.delete.mockResolvedValue({ data: null, error: null });

    await archiveHandler(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'アーカイブ処理が完了しました',
      archivedCount: 2
    });
  });

  it('データ取得時にエラーが発生した場合、適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: null,
      error: { message: 'データベースエラー' }
    });

    await archiveHandler(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'アーカイブ対象データの取得に失敗しました',
      error: 'データベースエラー'
    });
  });

  it('アーカイブ処理時にエラーが発生した場合、適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: [{ id: 1, weather_data: { temp: 25 }, created_at: '2022-01-01' }],
      error: null
    });

    mockSupabaseClient.delete.mockResolvedValue({
      data: null,
      error: { message: 'アーカイブ処理エラー' }
    });

    await archiveHandler(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'アーカイブ処理に失敗しました',
      error: 'アーカイブ処理エラー'
    });
  });

  it('POST以外のメソッドの場合、405エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await archiveHandler(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'Method Not Allowed'
    });
  });

  it('アーカイブ対象のデータが存在しない場合、適切なレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    mockSupabaseClient.select.mockResolvedValue({
      data: [],
      error: null
    });

    await archiveHandler(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'アーカイブ対象のデータが存在しません',
      archivedCount: 0
    });
  });

  it('大量データのアーカイブを正常に処理できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    const largeDataSet = Array(1000).fill(null).map((_, index) => ({
      id: index,
      weather_data: { temp: 25 },
      created_at: '2022-01-01'
    }));

    mockSupabaseClient.select.mockResolvedValue({
      data: largeDataSet,
      error: null
    });
    mockSupabaseClient.delete.mockResolvedValue({ data: null, error: null });

    await archiveHandler(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'アーカイブ処理が完了しました',
      archivedCount: 1000
    });
  });
});