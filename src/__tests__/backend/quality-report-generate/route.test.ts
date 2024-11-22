import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import qualityReportGenerate from '@/pages/api/quality-report-generate';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('データ品質レポート生成APIのテスト', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const mockWeatherData = [
    {
      id: '1',
      area_code: '130000',
      weather_data: {
        temperature: 25.5,
        humidity: 60,
        precipitation: 0
      },
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  it('正常なレポート生成処理が実行されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    mockSupabase.select.mockResolvedValue({ data: mockWeatherData, error: null });
    mockSupabase.insert.mockResolvedValue({ data: { id: '1' }, error: null });

    await qualityReportGenerate(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('reportId');
    expect(responseData).toHaveProperty('metrics');
    expect(responseData.metrics).toHaveProperty('completeness');
    expect(responseData.metrics).toHaveProperty('accuracy');
  });

  it('データ抽出エラー時に500エラーが返されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    mockSupabase.select.mockResolvedValue({ data: null, error: new Error('データ抽出エラー') });

    await qualityReportGenerate(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('データの抽出に失敗しました');
  });

  it('レポート保存エラー時に500エラーが返されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    mockSupabase.select.mockResolvedValue({ data: mockWeatherData, error: null });
    mockSupabase.insert.mockResolvedValue({ data: null, error: new Error('保存エラー') });

    await qualityReportGenerate(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('レポートの保存に失敗しました');
  });

  it('日付範囲指定でデータが正しく抽出されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-01-02'
      }
    });

    mockSupabase.select.mockResolvedValue({ data: mockWeatherData, error: null });
    mockSupabase.insert.mockResolvedValue({ data: { id: '1' }, error: null });

    await qualityReportGenerate(req, res);

    expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
    expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-02');
    expect(res._getStatusCode()).toBe(200);
  });

  it('異常値が検出された場合にissuesが含まれること', async () => {
    const mockAbnormalData = [{
      ...mockWeatherData[0],
      weather_data: {
        temperature: 999,
        humidity: -1,
        precipitation: 0
      }
    }];

    const { req, res } = createMocks({
      method: 'POST'
    });

    mockSupabase.select.mockResolvedValue({ data: mockAbnormalData, error: null });
    mockSupabase.insert.mockResolvedValue({ data: { id: '1' }, error: null });

    await qualityReportGenerate(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.issues).toBeDefined();
    expect(responseData.issues.length).toBeGreaterThan(0);
  });

  it('GET以外のメソッドで405エラーが返されること', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await qualityReportGenerate(req, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('Method not allowed');
  });

  it('品質メトリクスが正しく計算されること', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    });

    mockSupabase.select.mockResolvedValue({ data: mockWeatherData, error: null });
    mockSupabase.insert.mockResolvedValue({ data: { id: '1' }, error: null });

    await qualityReportGenerate(req, res);

    const responseData = JSON.parse(res._getData());
    expect(responseData.metrics.completeness).toBeGreaterThanOrEqual(0);
    expect(responseData.metrics.completeness).toBeLessThanOrEqual(1);
    expect(responseData.metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(responseData.metrics.accuracy).toBeLessThanOrEqual(1);
  });

  it('認証エラー時に401エラーが返されること', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Invalid Token'
      }
    });

    mockSupabase.from.mockImplementation(() => {
      throw new Error('認証エラー');
    });

    await qualityReportGenerate(req, res);

    expect(res._getStatusCode()).toBe(401);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('認証に失敗しました');
  });
});