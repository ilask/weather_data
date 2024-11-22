import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { supabase } from '@/supabase';

type ConversionRule = {
  id: string;
  sourceField: string;
  targetField: string;
  conversionType: string;
  conversionRule: string;
};

interface ConversionFormProps {
  rules: ConversionRule[];
  onSave: (rules: ConversionRule[]) => void;
}

const ConversionForm: React.FC<ConversionFormProps> = ({ rules, onSave }) => {
  const [localRules, setLocalRules] = useState<ConversionRule[]>(rules);
  const [editingRule, setEditingRule] = useState<ConversionRule | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const conversionTypes = ['数値変換', 'マッピング変換'];

  const validateRule = (rule: ConversionRule) => {
    const newErrors: Record<string, string> = {};
    
    if (!rule.sourceField) newErrors.sourceField = '変換元フィールドは必須です';
    if (!rule.targetField) newErrors.targetField = '変換先フィールドは必須です';
    if (!rule.conversionType) newErrors.conversionType = '変換タイプは必須です';
    if (!rule.conversionRule) newErrors.conversionRule = '変換ルールは必須です';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    const newRule: ConversionRule = {
      id: Date.now().toString(),
      sourceField: '',
      targetField: '',
      conversionType: '',
      conversionRule: ''
    };
    setEditingRule(newRule);
  };

  const handleEdit = (rule: ConversionRule) => {
    setEditingRule({ ...rule });
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id: string) => {
    const updatedRules = localRules.filter(rule => rule.id !== id);
    setLocalRules(updatedRules);
    onSave(updatedRules);
    setShowDeleteConfirm(null);
  };

  const handleSave = () => {
    if (!editingRule) return;

    if (!validateRule(editingRule)) return;

    const updatedRules = editingRule.id
      ? localRules.map(rule => (rule.id === editingRule.id ? editingRule : rule))
      : [...localRules, editingRule];

    setLocalRules(updatedRules);
    onSave(updatedRules);
    setEditingRule(null);
    setErrors({});
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">データ変換ルール設定</h2>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          新規ルール追加
        </button>
      </div>

      {editingRule && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="sourceField">
                変換元フィールド
              </label>
              <input
                id="sourceField"
                type="text"
                value={editingRule.sourceField}
                onChange={e => setEditingRule({ ...editingRule, sourceField: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.sourceField && (
                <p className="mt-1 text-sm text-red-600">{errors.sourceField}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="targetField">
                変換先フィールド
              </label>
              <input
                id="targetField"
                type="text"
                value={editingRule.targetField}
                onChange={e => setEditingRule({ ...editingRule, targetField: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.targetField && (
                <p className="mt-1 text-sm text-red-600">{errors.targetField}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="conversionType">
                変換タイプ
              </label>
              <select
                id="conversionType"
                value={editingRule.conversionType}
                onChange={e => setEditingRule({ ...editingRule, conversionType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {conversionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.conversionType && (
                <p className="mt-1 text-sm text-red-600">{errors.conversionType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="conversionRule">
                変換ルール
              </label>
              <input
                id="conversionRule"
                type="text"
                value={editingRule.conversionRule}
                onChange={e => setEditingRule({ ...editingRule, conversionRule: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.conversionRule && (
                <p className="mt-1 text-sm text-red-600">{errors.conversionRule}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setEditingRule(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                変換元フィールド
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                変換先フィールド
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                変換タイプ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                変換ルール
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {localRules.map(rule => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap">{rule.sourceField}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rule.targetField}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rule.conversionType}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rule.conversionRule}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">このルールを削除してもよろしいですか？</h3>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                削除確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionForm;