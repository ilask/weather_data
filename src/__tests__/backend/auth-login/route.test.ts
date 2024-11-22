import { createMocks } from 'node-mocks-http';
import { NextApiRequest } from 'next';
import authLogin from '@/pages/api/auth-login';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('認証APIのテスト', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn()
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: null, error: null })
      }))
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('正常なログインリクエストが成功すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
        password: 'password123'
      }
    });

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'dummy-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    });

    await authLogin(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('token', 'dummy-token');
    expect(responseData).toHaveProperty('user');
  });

  it('必須パラメータが不足している場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser'
      }
    });

    await authLogin(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'ユーザーIDとパスワードは必須です');
  });

  it('認証失敗時にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'wronguser',
        password: 'wrongpass'
      }
    });

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { message: '認証に失敗しました' }
    });

    await authLogin(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(401);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', '認証に失敗しました');
  });

  it('POST以外のメソッドでリクエストした場合にエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await authLogin(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Method Not Allowed');
  });

  it('Supabaseのエラー時に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
        password: 'password123'
      }
    });

    mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(
      new Error('データベース接続エラー')
    );

    await authLogin(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', 'Internal Server Error');
  });

  it('アクセスログが正常に記録されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
        password: 'password123'
      }
    });

    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.from.mockReturnValue({ insert: insertMock });

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'dummy-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    });

    await authLogin(req as NextApiRequest, res);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_access_logs');
    expect(insertMock).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('リクエストボディのバリデーションが正しく機能すること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: '',
        password: ' '
      }
    });

    await authLogin(req as NextApiRequest, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error', '有効なユーザーIDとパスワードを入力してください');
  });
});