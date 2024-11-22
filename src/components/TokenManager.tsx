import { useState, useEffect } from 'react';
import { FiCopy, FiEye, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { createClient } from '@/supabase';
import { IoMdRefresh } from 'react-icons/io';

interface ApiToken {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface TokenManagerProps {
  tokens: ApiToken[];
  onGenerate: () => void;
  onRevoke: (token: string) => void;
}

export default function TokenManager({ tokens: initialTokens, onGenerate, onRevoke }: TokenManagerProps) {
  const [tokens, setTokens] = useState<ApiToken[]>(initialTokens);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 5;

  const filteredTokens = tokens.filter(token =>
    token.token.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    return sortOrder === 'asc'
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const paginatedTokens = sortedTokens.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedTokens.length / itemsPerPage);

  const handleGenerate = async () => {
    try {
      await onGenerate();
    } catch (err) {
      setError('トークン生成に失敗しました');
    }
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
    } catch (err) {
      setError('コピーに失敗しました');
    }
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen h-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">APIトークン管理</h1>
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            新規トークン生成
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="トークンを検索"
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={handleSort}>
                  作成日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">トークン</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有効期限</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTokens.map((token) => (
                <tr key={token.id} data-testid="token-row" className="border-t">
                  <td className="px-6 py-4 whitespace-nowrap">{token.createdAt}</td>
                  <td className="px-6 py-4">{token.token}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{token.expiresAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      token.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {token.status === 'active' ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopy(token.token)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <FiCopy /> コピー
                      </button>
                      <button
                        onClick={() => setSelectedToken(token)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEye /> 詳細
                      </button>
                      <button
                        onClick={() => onRevoke(token.token)}
                        disabled={token.status === 'revoked'}
                        className={`text-red-600 hover:text-red-900 ${
                          token.status === 'revoked' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <FiTrash2 /> 無効化
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
          >
            <FiChevronLeft />
          </button>
          <span>ページ {currentPage}</span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
          >
            <FiChevronRight />
          </button>
        </div>

        {selectedToken && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">トークン詳細情報</h2>
              <p>ID: {selectedToken.id}</p>
              <p>作成日: {selectedToken.createdAt}</p>
              <p>有効期限: {selectedToken.expiresAt}</p>
              <p>状態: {selectedToken.status}</p>
              <button
                onClick={() => setSelectedToken(null)}
                className="mt-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}