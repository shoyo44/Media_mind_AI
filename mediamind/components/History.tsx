import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { SearchHistoryEntry } from '../types';
import { renderMarkdown } from '../utils/markdown';

interface HistoryProps {
  onRestorePrompt?: (data: {
    userInput: string;
    roleName: string;
    temperature: number;
    topP: number;
  }) => void;
}

export const History: React.FC<HistoryProps> = ({ onRestorePrompt }) => {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await api.getHistory();
      setHistory(response.history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return;

    try {
      await api.clearHistory();
      await loadHistory();
    } catch (error) {
      alert('Failed to clear history: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Search History</h2>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
            >
              🗑️ Clear History
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No History Yet</h3>
          <p className="text-gray-600">Your search history will appear here once you start generating content.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-purple-600 text-lg">
                  {item.role_name}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(item.timestamp)}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 font-medium mb-1">Input:</p>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {item.user_input}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-600 font-medium">Result:</p>
                  <div className="flex gap-2">
                    {item.result.length > 300 && (
                      <button
                        onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {expandedId === item._id ? '▼ Show Less' : '▶ Show Full Content'}
                      </button>
                    )}
                  </div>
                </div>
                <div className={`text-gray-700 bg-gray-50 p-3 rounded-lg ${
                  expandedId === item._id ? 'max-h-none' : 'max-h-32'
                } overflow-y-auto`}>
                  {expandedId === item._id ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(item.result) }}
                    />
                  ) : item.result.length > 300 ? (
                    <div>
                      {item.result.substring(0, 300)}
                      <span className="text-gray-400">...</span>
                    </div>
                  ) : (
                    <div className="prose max-w-none text-sm">
                      {item.result}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Temperature: {item.temperature}</span>
                  <span>Top P: {item.top_p}</span>
                </div>
                {onRestorePrompt && (
                  <button
                    onClick={() => onRestorePrompt({
                      userInput: item.user_input,
                      roleName: item.role_name,
                      temperature: item.temperature,
                      topP: item.top_p,
                    })}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    ↻ Use This Prompt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
