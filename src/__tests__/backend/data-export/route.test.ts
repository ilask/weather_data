import { createMocks } from 'node-mocks-http';
import handleExport from '@/pages/api/data-export';
import { jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('データエクスポートAPI', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    data: [],
    error: null,
  };

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  it('正常なエクスポートリクエストを処理できること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'csv',
        areaCode: '130000'
      }
    });

    mockSupabase.data = [
      { id: 1, temperature: 20, rainfall: 0, timestamp: '2024-01-01T00:00:00Z' },
      { id: 2, temperature: 22, rainfall: 10, timestamp: '2024-01-01T01:00:00Z' }
    ];

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(202);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'エクスポート処理を開始しました',
      jobId: expect.any(String)
    });
  });

  it('無効なリクエストパラメータでエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: 'invalid-date',
        endDate: '2024-01-31',
        format: 'invalid-format',
        areaCode: '130000'
      }
    });

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '無効なリクエストパラメータです'
    });
  });

  it('データベースエラー時に適切なエラーレスポンスを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'csv',
        areaCode: '130000'
      }
    });

    mockSupabase.error = new Error('データベースエラー');

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データの抽出に失敗しました'
    });
  });

  it('GET以外のメソッドで405エラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'PUT'
    });

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: '許可されていないメソッドです'
    });
  });

  it('大量データの処理時にタイムアウトしないこと', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        format: 'csv',
        areaCode: '130000'
      }
    });

    mockSupabase.data = Array(10000).fill().map((_, i) => ({
      id: i,
      temperature: 20 + Math.random() * 10,
      rainfall: Math.random() * 100,
      timestamp: new Date(2024, 0, 1 + Math.floor(i / 24)).toISOString()
    }));

    const startTime = Date.now();
    await handleExport(req, res);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000);
    expect(res._getStatusCode()).toBe(202);
  });

  it('進捗状況を取得できること', async () => {
    const { req: jobReq, res: jobRes } = createMocks({
      method: 'GET',
      query: {
        jobId: '12345'
      }
    });

    mockSupabase.data = [{
      status: 'processing',
      progress: 50,
      totalRecords: 1000,
      processedRecords: 500
    }];

    await handleExport(jobReq, jobRes);

    expect(jobRes._getStatusCode()).toBe(200);
    expect(JSON.parse(jobRes._getData())).toEqual({
      status: 'processing',
      progress: 50,
      totalRecords: 1000,
      processedRecords: 500
    });
  });

  it('存在しないジョブIDでエラーを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        jobId: 'non-existent'
      }
    });

    mockSupabase.data = [];

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: '指定されたジョブが見つかりません'
    });
  });

  it('エクスポート完了時にダウンロードURLを返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        jobId: '12345'
      }
    });

    mockSupabase.data = [{
      status: 'completed',
      downloadUrl: 'https://example.com/exports/12345.csv'
    }];

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      status: 'completed',
      downloadUrl: 'https://example.com/exports/12345.csv'
    });
  });

  it('エクスポート失敗時にエラー詳細を返すこと', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        jobId: '12345'
      }
    });

    mockSupabase.data = [{
      status: 'failed',
      error: 'ストレージ容量不足'
    }];

    await handleExport(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      status: 'failed',
      error: 'ストレージ容量不足'
    });
  });
});