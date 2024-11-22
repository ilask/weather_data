import { createMocks } from 'node-mocks-http';
import type { NextApiRequest } from 'next';
import type { MockResponse } from 'node-mocks-http';
import weatherFetch from '@/pages/api/weather-fetch';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('axios');

describe('気象データ自動取得処理 API', () => {
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('正常な気象データ取得と保存を実行できること', async () => {
    const mockWeatherData = {
      area: {
        code: '130000',
        name: '東京都'
      },
      temperature: 25.5,
      rainfall: 0,
    };

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockWeatherData });

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        items: ['temperature', 'rainfall']
      },
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: mockWeatherData
    });
  });

  it('気象庁APIからのデータ取得に失敗した場合エラーを返すこと', async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('API接続エラー'));

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        items: ['temperature']
      },
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データ取得に失敗しました: API接続エラー'
    });
  });

  it('Supabaseへのデータ保存に失敗した場合エラーを返すこと', async () => {
    const mockWeatherData = {
      area: { code: '130000' },
      temperature: 25.5
    };

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockWeatherData });
    mockSupabaseClient.insert.mockResolvedValueOnce({
      data: null,
      error: new Error('データベースエラー')
    });

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        items: ['temperature']
      },
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データの保存に失敗しました: データベースエラー'
    });
  });

  it('無効なリクエストメソッドの場合405エラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'GET',
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('必須パラメータが欠けている場合400エラーを返すこと', async () => {
    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        // items が欠けている
      },
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: '必須パラメータが不足しています'
    });
  });

  it('データ品質チェックで異常が検出された場合警告を含むレスポンスを返すこと', async () => {
    const mockWeatherData = {
      area: { code: '130000' },
      temperature: -999, // 異常値
      rainfall: 0
    };

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockWeatherData });

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        items: ['temperature', 'rainfall']
      },
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: mockWeatherData,
      warnings: ['温度の値が異常です']
    });
  });

  it('リトライ処理が正常に機能すること', async () => {
    (axios.get as jest.Mock)
      .mockRejectedValueOnce(new Error('一時的なエラー'))
      .mockResolvedValueOnce({ 
        data: {
          area: { code: '130000' },
          temperature: 25.5
        }
      });

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        items: ['temperature']
      },
    });

    await weatherFetch(req, res);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(res._getStatusCode()).toBe(200);
  });

  it('システムログが正しく記録されること', async () => {
    const mockWeatherData = {
      area: { code: '130000' },
      temperature: 25.5
    };

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockWeatherData });

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCode: '130000',
        items: ['temperature']
      },
    });

    await weatherFetch(req, res);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_logs');
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        log_level: 'INFO',
        message: expect.stringContaining('気象データ取得成功')
      })
    );
  });

  it('大量データの取得と保存が正常に処理されること', async () => {
    const mockWeatherData = Array(100).fill(null).map((_, index) => ({
      area: { code: `${130000 + index}` },
      temperature: 25.5,
      rainfall: 0
    }));

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockWeatherData });

    const { req, res } = createMocks<NextApiRequest, MockResponse>({
      method: 'POST',
      body: {
        areaCodes: mockWeatherData.map(d => d.area.code),
        items: ['temperature', 'rainfall']
      },
    });

    await weatherFetch(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(1);
  });
});