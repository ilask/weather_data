import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaCloudUploadAlt, FaHistory, FaRedoAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

type BackupLog = {
  id: string;
  filename: string;
  createdAt: string;
  size: string;
  status: 'completed' | 'failed';
};

interface BackupPanelProps {
  backupHistory: BackupLog[];
  onBackup: () => void;
  onRestore: (backup: BackupLog) => void;
  isProcessing?: boolean;
}

const BackupPanel: React.FC<BackupPanelProps> = ({
  backupHistory,
  onBackup,
  onRestore,
  isProcessing = false
}) => {
  const getStatusColor = (status: 'completed' | 'failed') => {
    return status === 'completed' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (status: 'completed' | 'failed') => {
    return status === 'completed' ? '完了' : '失敗';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaHistory className="mr-2" />
          バックアップ管理
        </h2>
        <button
          onClick={onBackup}
          disabled={isProcessing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaCloudUploadAlt className="mr-2" />
          新規バックアップ
        </button>
      </div>

      {backupHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          バックアップ履歴がありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">ファイル名</th>
                <th className="px-4 py-2 text-left">作成日時</th>
                <th className="px-4 py-2 text-left">サイズ</th>
                <th className="px-4 py-2 text-left">ステータス</th>
                <th className="px-4 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {backupHistory.map((backup) => (
                <tr key={backup.id} className="border-b">
                  <td className="px-4 py-3">{backup.filename}</td>
                  <td className="px-4 py-3">
                    {format(new Date(backup.createdAt), 'yyyy/MM/dd HH:mm')}
                  </td>
                  <td className="px-4 py-3">{backup.size}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center ${getStatusColor(backup.status)}`}>
                      {backup.status === 'completed' ? (
                        <FaCheckCircle className="mr-1" />
                      ) : (
                        <FaTimesCircle className="mr-1" />
                      )}
                      {getStatusText(backup.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onRestore(backup)}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaRedoAlt className="mr-1" />
                      リストア
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BackupPanel;