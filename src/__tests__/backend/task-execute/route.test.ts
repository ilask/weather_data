import { createMocks } from 'node-mocks-http';
import { jest } from '@jest/globals';
import taskExecute from '@/pages/api/task-execute';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('定期タスク実行処理のAPIテスト', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      data: null,
      error: null,
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  const mockTasks = [
    {
      id: '1',
      name: 'データ取得タスク',
      schedule: '0 0 * * *',
      status: 'active',
      lastRun: '2024-01-01T00:00:00Z',
      nextRun: '2024-01-02T00:00:00Z',
      handler: 'fetchWeatherData'
    }
  ];

  test('実行予定タスクを正しく取得できる', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    mockSupabase.from().select().data = mockTasks;

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      tasks: mockTasks
    });
  });

  test('タスク実行が正しく記録される', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskId: '1'
      }
    });

    mockSupabase.from().select().data = mockTasks;
    mockSupabase.from().update().data = { id: '1', lastRun: expect.any(String) };

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockSupabase.from().update).toHaveBeenCalled();
  });

  test('存在しないタスクIDでエラーが返される', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskId: 'invalid-id'
      }
    });

    mockSupabase.from().select().data = [];

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'タスクが見つかりません'
    });
  });

  test('タスク実行時のエラーが適切に処理される', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskId: '1'
      }
    });

    mockSupabase.from().select().data = mockTasks;
    mockSupabase.from().update().error = new Error('データベースエラー');

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'タスク実行中にエラーが発生しました'
    });
  });

  test('無効なHTTPメソッドでリクエストした場合エラーが返される', async () => {
    const { req, res } = createMocks({
      method: 'PUT'
    });

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  test('タスク実行条件が満たされていない場合スキップされる', async () => {
    const inactiveTask = [{
      ...mockTasks[0],
      status: 'inactive'
    }];

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskId: '1'
      }
    });

    mockSupabase.from().select().data = inactiveTask;

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'タスクはスキップされました'
    });
  });

  test('複数タスクの一括実行が正しく処理される', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskIds: ['1', '2']
      }
    });

    const multipleTasks = [
      mockTasks[0],
      { ...mockTasks[0], id: '2' }
    ];

    mockSupabase.from().select().data = multipleTasks;
    mockSupabase.from().update().data = { success: true };

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockSupabase.from().update).toHaveBeenCalledTimes(2);
  });

  test('実行結果の通知が正しく送信される', async () => {
    const mockNotify = jest.fn();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskId: '1',
        notify: true
      }
    });

    mockSupabase.from().select().data = mockTasks;
    mockSupabase.from().update().data = { success: true };

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('バッチ処理の最大実行時間を超えた場合タイムアウトする', async () => {
    jest.setTimeout(5000);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        taskId: '1'
      }
    });

    mockSupabase.from().select().data = mockTasks;
    mockSupabase.from().update = jest.fn(() => 
      new Promise(resolve => setTimeout(resolve, 6000))
    );

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'タスクの実行がタイムアウトしました'
    });
  });

  test('データベース接続エラーが適切に処理される', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    mockSupabase.from().select().error = new Error('データベース接続エラー');

    await taskExecute(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'データベースへの接続に失敗しました'
    });
  });
});