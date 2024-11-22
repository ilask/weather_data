import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import backupExecute from '@/pages/api/backup-execute';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis()
};

const mockS3Client = {
  send: jest.fn()
};

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => mockS3Client),
  PutObjectCommand: jest.fn()
}));

describe('バックアップ実行API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('正常にバックアップが実行されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'manual',
        description: 'テストバックアップ'
      }
    });

    mockSupabase.from.mockImplementation(() => ({
      select: () => Promise.resolve({
        data: [{ id: 1, weather_data: { temp: 25 } }],
        error: null
      }),
      insert: () => Promise.resolve({
        data: { id: 'backup-123' },
        error: null
      })
    }));

    mockS3Client.send.mockResolvedValueOnce({ success: true });

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      success: true,
      backupId: 'backup-123'
    });
  });

  it('バックアップ対象データが存在しない場合は404を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'manual'
      }
    });

    mockSupabase.from.mockImplementation(() => ({
      select: () => Promise.resolve({
        data: [],
        error: null
      })
    }));

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'バックアップ対象のデータが存在しません'
    });
  });

  it('データベースエラー時は500を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'manual'
      }
    });

    mockSupabase.from.mockImplementation(() => ({
      select: () => Promise.resolve({
        data: null,
        error: new Error('データベースエラー')
      })
    }));

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'バックアップ処理に失敗しました'
    });
  });

  it('S3アップロードエラー時は500を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'manual'
      }
    });

    mockSupabase.from.mockImplementation(() => ({
      select: () => Promise.resolve({
        data: [{ id: 1, weather_data: { temp: 25 } }],
        error: null
      })
    }));

    mockS3Client.send.mockRejectedValueOnce(new Error('S3エラー'));

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'バックアップファイルの保存に失敗しました'
    });
  });

  it('不正なHTTPメソッドの場合は405を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('必須パラメータが不足している場合は400を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    });

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'バックアップタイプは必須です'
    });
  });

  it('バックアップ履歴の保存に失敗した場合は500を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'manual'
      }
    });

    mockSupabase.from.mockImplementation(() => ({
      select: () => Promise.resolve({
        data: [{ id: 1, weather_data: { temp: 25 } }],
        error: null
      }),
      insert: () => Promise.resolve({
        data: null,
        error: new Error('履歴保存エラー')
      })
    }));

    mockS3Client.send.mockResolvedValueOnce({ success: true });

    await backupExecute(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'バックアップ履歴の保存に失敗しました'
    });
  });
});