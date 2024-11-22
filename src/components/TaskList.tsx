import React, { useState, useMemo, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiFilter, FiCheck } from 'react-icons/fi';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  errorMessage?: string;
};

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate, onTaskDelete }) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByStatus, setSortByStatus] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<string | null>(null);

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortByStatus) {
      result = [...result].sort((a, b) => a.status.localeCompare(b.status));
    }

    return result;
  }, [tasks, searchQuery, sortByStatus]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  }, [filteredAndSortedTasks]);

  const handleTaskSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSave = (task: Task) => {
    onTaskUpdate(task);
    setEditingTask(null);
  };

  const handleDelete = (taskId: string) => {
    onTaskDelete(taskId);
    setDeleteConfirmTask(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="タスク名で検索"
          className="px-4 py-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={() => setSortByStatus(!sortByStatus)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
        >
          <FiFilter />
          ステータスでソート
        </button>
      </div>

      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          タスクが登録されていません
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedTasks.size === filteredAndSortedTasks.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="全て選択"
            />
            <span>全て選択</span>
          </div>

          <ul className="space-y-4">
            {filteredAndSortedTasks.map((task) => (
              <li
                key={task.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
                role="listitem"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => handleTaskSelect(task.id)}
                    aria-label="タスク選択"
                  />
                  
                  {editingTask?.id === task.id ? (
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                        className="w-full px-2 py-1 border rounded"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleSave(editingTask)}
                          className="px-3 py-1 bg-green-500 text-white rounded"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingTask(null)}
                          className="px-3 py-1 bg-gray-500 text-white rounded"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                          task.status === 'エラー' ? 'bg-red-100 text-red-800 error-status' :
                          task.status === '実行中' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-2 text-gray-600 hover:text-blue-500"
                          aria-label="編集"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTask(task.id)}
                          className="p-2 text-gray-600 hover:text-red-500"
                          aria-label="削除"
                        >
                          <FiTrash2 />
                        </button>
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="p-2 text-gray-600"
                          aria-label="詳細"
                        >
                          {expandedTasks.has(task.id) ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {expandedTasks.has(task.id) && (
                  <div className="mt-4 pl-8 text-sm text-gray-600">
                    <p>スケジュール: {task.schedule}</p>
                    <p>次回実行: {task.nextRun}</p>
                    <p>前回実行: {task.lastRun}</p>
                    {task.errorMessage && (
                      <p className="text-red-500">{task.errorMessage}</p>
                    )}
                  </div>
                )}

                {deleteConfirmTask === task.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p>このタスクを削除してもよろしいですか？</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                      >
                        確認
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTask(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskList;