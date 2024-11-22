import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { supabase } from '@/supabase';

type RateLimit = {
  id: string;
  path: string;
  limit: number;
  window: number;
  enabled: boolean;
};

type Props = {
  limits: RateLimit[];
  onUpdate: (limits: RateLimit[]) => void;
};

const RateLimitConfig = ({ limits, onUpdate }: Props) => {
  const [localLimits, setLocalLimits] = useState<RateLimit[]>(limits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkWindow, setBulkWindow] = useState<number>(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState({
    path: '',
    limit: '',
    window: ''
  });

  const validateForm = (data: typeof formData) => {
    const newErrors: {[key: string]: string} = {};
    
    if (!data.path) newErrors.path = 'APIパスは必須です';
    if (!data.limit) newErrors.limit = '制限回数は必須です';
    if (!data.window) newErrors.window = '期間は必須です';
    if (Number(data.limit) < 0) newErrors.limit = '制限回数は0以上の数値を入力してください';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm(formData)) return;

    const newLimit: RateLimit = {
      id: Date.now().toString(),
      path: formData.path,
      limit: Number(formData.limit),
      window: Number(formData.window),
      enabled: true
    };

    const updatedLimits = [...localLimits, newLimit];
    setLocalLimits(updatedLimits);
    onUpdate(updatedLimits);
    setShowAddForm(false);
    setFormData({ path: '', limit: '', window: '' });
  };

  const handleEdit = (id: string) => {
    const limit = localLimits.find(l => l.id === id);
    if (limit) {
      setFormData({
        path: limit.path,
        limit: limit.limit.toString(),
        window: limit.window.toString()
      });
      setEditingId(id);
    }
  };

  const handleUpdate = (id: string) => {
    if (!validateForm(formData)) return;

    const updatedLimits = localLimits.map(limit =>
      limit.id === id
        ? {
            ...limit,
            path: formData.path,
            limit: Number(formData.limit),
            window: Number(formData.window)
          }
        : limit
    );

    setLocalLimits(updatedLimits);
    onUpdate(updatedLimits);
    setEditingId(null);
    setFormData({ path: '', limit: '', window: '' });
  };

  const handleDelete = (id: string) => {
    const updatedLimits = localLimits.filter(limit => limit.id !== id);
    setLocalLimits(updatedLimits);
    onUpdate(updatedLimits);
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleToggle = (id: string) => {
    const updatedLimits = localLimits.map(limit =>
      limit.id === id ? { ...limit, enabled: !limit.enabled } : limit
    );
    setLocalLimits(updatedLimits);
    onUpdate(updatedLimits);
  };

  const handleBulkUpdate = () => {
    const updatedLimits = localLimits.map(limit => ({
      ...limit,
      window: bulkWindow
    }));
    setLocalLimits(updatedLimits);
    onUpdate(updatedLimits);
    setShowBulkUpdate(false);
    setBulkWindow(0);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">APIレート制限設定</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowBulkUpdate(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            一括更新
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            追加
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                APIパス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                制限回数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                期間（秒）
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {localLimits.map(limit => (
              <tr key={limit.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === limit.id ? (
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      className="border rounded px-2 py-1 w-full"
                      placeholder="APIパス"
                    />
                  ) : (
                    limit.path
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === limit.id ? (
                    <input
                      type="number"
                      value={formData.limit}
                      onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                      className="border rounded px-2 py-1 w-full"
                      placeholder="制限回数"
                    />
                  ) : (
                    limit.limit
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === limit.id ? (
                    <input
                      type="number"
                      value={formData.window}
                      onChange={(e) => setFormData({ ...formData, window: e.target.value })}
                      className="border rounded px-2 py-1 w-full"
                      placeholder="期間（秒）"
                    />
                  ) : (
                    limit.window
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={limit.enabled}
                    onChange={() => handleToggle(limit.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  {editingId === limit.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(limit.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        更新
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(limit.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTargetId(limit.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">新規レート制限追加</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="APIパス"
                />
                {errors.path && <p className="text-red-500 text-sm">{errors.path}</p>}
              </div>
              <div>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="制限回数"
                />
                {errors.limit && <p className="text-red-500 text-sm">{errors.limit}</p>}
              </div>
              <div>
                <input
                  type="number"
                  value={formData.window}
                  onChange={(e) => setFormData({ ...formData, window: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="期間（秒）"
                />
                {errors.window && <p className="text-red-500 text-sm">{errors.window}</p>}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ path: '', limit: '', window: '' });
                    setErrors({});
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">削除確認</h3>
            <p>このレート制限を削除してもよろしいですか？</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">一括更新</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="number"
                  value={bulkWindow}
                  onChange={(e) => setBulkWindow(Number(e.target.value))}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="期間（秒）"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowBulkUpdate(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  一括適用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateLimitConfig;