import { jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import rateLimitCheck from '@/pages/api/rate-limit-check';
import { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

interface MockResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): string;
}

describe('レート制限チェックAPIのテスト', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
    })),
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('正常なリクエストの処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
      headers: {
        'x-client-id': 'test-client',
      },
    });

    mockSupabase.from().select.mockResolvedValueOnce({
      data: [{ requests_per_minute: 60, is_blocked: false }],
      error: null,
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: { count: 30 },
      error: null,
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      allowed: true,
      remaining: 30,
    });
  });

  test('ブロック済みクライアントの処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
      headers: {
        'x-client-id': 'blocked-client',
      },
    });

    mockSupabase.from().select.mockResolvedValueOnce({
      data: [{ requests_per_minute: 60, is_blocked: true }],
      error: null,
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'クライアントがブロックされています',
    });
  });

  test('制限超過時の処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
      headers: {
        'x-client-id': 'test-client',
      },
    });

    mockSupabase.from().select.mockResolvedValueOnce({
      data: [{ requests_per_minute: 60, is_blocked: false }],
      error: null,
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: { count: 61 },
      error: null,
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'レート制限を超過しました',
    });
  });

  test('クライアントID未指定時の処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'クライアントIDが必要です',
    });
  });

  test('データベースエラー時の処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
      headers: {
        'x-client-id': 'test-client',
      },
    });

    mockSupabase.from().select.mockResolvedValueOnce({
      data: null,
      error: new Error('データベースエラー'),
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'サーバーエラーが発生しました',
    });
  });

  test('アクセスログの記録', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
      headers: {
        'x-client-id': 'test-client',
      },
    });

    mockSupabase.from().select.mockResolvedValueOnce({
      data: [{ requests_per_minute: 60, is_blocked: false }],
      error: null,
    });

    mockSupabase.rpc.mockResolvedValueOnce({
      data: { count: 30 },
      error: null,
    });

    await rateLimitCheck(req, res);

    expect(mockSupabase.from).toHaveBeenCalledWith('api_access_logs');
    expect(mockSupabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'test-client',
      request_info: expect.any(Object),
    }));
  });

  test('不正なHTTPメソッドの処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      headers: {
        'x-client-id': 'test-client',
      },
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: '許可されていないメソッドです',
    });
  });

  test('レート制限の更新処理', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'PUT',
      headers: {
        'x-client-id': 'test-client',
      },
      body: {
        requests_per_minute: 100,
      },
    });

    mockSupabase.from().update.mockResolvedValueOnce({
      data: { requests_per_minute: 100 },
      error: null,
    });

    await rateLimitCheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      updated_limit: 100,
    });
  });
});