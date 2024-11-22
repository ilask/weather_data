import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import dataConversion from '@/pages/api/data-conversion';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('データ変換API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常なデータ変換リクエストを処理できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        data: [
          { temperature: 25.5, rainfall: 0 },
          { temperature: 26.0, rainfall: 10 }
        ],
        rules: {
          temperature: 'celsius_to_fahrenheit',
          rainfall: 'mm_to_inch'
        }
      }
    });

    mockSupabase.insert.mockResolvedValueOnce({ data: { id: 1 }, error: null });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('jobId');
    expect(responseData).toHaveProperty('status', 'processing');
  });

  it('無効なリクエストボディの場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Invalid request body');
  });

  it('変換ジョブの状態を取得できること', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { jobId: '123' }
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: '123',
        status: 'completed',
        result: [
          { temperature: 77.9, rainfall: 0 },
          { temperature: 78.8, rainfall: 0.39 }
        ]
      },
      error: null
    });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('status', 'completed');
    expect(responseData).toHaveProperty('result');
  });

  it('存在しないジョブIDの場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { jobId: 'non-existent' }
    });

    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(404);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Job not found');
  });

  it('サポートされていないHTTPメソッドの場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'PUT'
    });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Method not allowed');
  });

  it('大量データの変換リクエストを処理できること', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      temperature: 25 + (i % 10),
      rainfall: i % 100
    }));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        data: largeDataset,
        rules: {
          temperature: 'celsius_to_fahrenheit',
          rainfall: 'mm_to_inch'
        }
      }
    });

    mockSupabase.insert.mockResolvedValueOnce({ data: { id: 2 }, error: null });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('jobId');
    expect(responseData).toHaveProperty('status', 'processing');
  });

  it('データベースエラーが発生した場合に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        data: [{ temperature: 25.5, rainfall: 0 }],
        rules: {
          temperature: 'celsius_to_fahrenheit',
          rainfall: 'mm_to_inch'
        }
      }
    });

    mockSupabase.insert.mockRejectedValueOnce(new Error('Database connection failed'));

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Internal server error');
  });

  it('不正な変換ルールの場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        data: [{ temperature: 25.5, rainfall: 0 }],
        rules: {
          temperature: 'invalid_conversion'
        }
      }
    });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Invalid conversion rule');
  });

  it('変換ジョブのキャンセルリクエストを処理できること', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { jobId: '123' }
    });

    mockSupabase.update.mockResolvedValueOnce({ data: { id: '123', status: 'cancelled' }, error: null });

    await dataConversion(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('status', 'cancelled');
  });
});