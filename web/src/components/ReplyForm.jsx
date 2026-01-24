import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { EmojiButton } from './EmojiPicker';
import { authenticatedFetch } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ReplyForm({ reviewId, onReplyAdded }) {
  const { currentUser } = useSelector((state) => state.user);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  if (!currentUser) return null;

  const handleEmojiClick = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setComment(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Reply cannot be empty');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/review/reply/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setComment('');
        if (onReplyAdded) onReplyAdded();
      } else {
        setError(data.message || 'Failed to add reply');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
          placeholder="Write a reply..."
          disabled={loading}
        />
        <div className="absolute bottom-2 right-2">
          <EmojiButton onEmojiClick={handleEmojiClick} inputRef={textareaRef} />
        </div>
      </div>
      {error && <div className="text-red-600 text-xs">{error}</div>}
      <button
        type="submit"
        className="self-end bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
        disabled={loading || !comment.trim()}
      >
        {loading ? 'Replying...' : 'Reply'}
      </button>
    </form>
  );
} 