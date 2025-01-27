'use client';
import { useState } from 'react';

export default function TweetForm() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/twitter/tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (data.success) {
        setText('');
        alert('推文發送成功！');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('發推文失敗:', error);
      alert('發推文失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="寫點什麼..."
        className="p-2 border rounded"
        maxLength={280}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? '發送中...' : '發推文'}
      </button>
    </form>
  );
} 