// This file contains the emoji picker additions for Community.jsx
// To be integrated into the main file

// 1. For nested reply input (around line 1512-1527)
<div className="flex gap-1 items-center">
    <div className="relative">
        <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => ({
                show: prev.type === 'reply' && prev.id === reply._id ? !prev.show : true,
                type: 'reply',
                id: reply._id
            }))}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
            title="Add Emoji"
        >
            <FaSmile className="text-sm" />
        </button>
        {showEmojiPicker.show && showEmojiPicker.type === 'reply' && showEmojiPicker.id === reply._id && (
            <div className="absolute bottom-full right-0 z-[100] mb-2 shadow-xl animate-fade-in">
                <EmojiPicker 
                    onEmojiClick={(emojiData) => handleEmojiClick(emojiData, 'reply', reply._id)}
                    width={300}
                    height={400}
                    previewConfig={{ showPreview: false }}
                />
            </div>
        )}
    </div>
    <button
        type="button"
        onClick={() => { setActiveReplyInput(null); setReplyText(''); setReplyingTo(null); setShowEmojiPicker({ show: false, type: null, id: null }); }}
        className="text-xs text-gray-500 px-2 hover:bg-gray-100 rounded"
    >
        Cancel
    </button>
    <button
        type="submit"
        disabled={!replyText.trim()}
        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full disabled:opacity-50"
    >
        Reply
    </button>
</div>

// 2. For comment input (around line 1565-1578)
<input
    type="text"
    placeholder="Write a comment... (use @ to mention property)"
    className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-16 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    value={commentText[post._id] || ''}
    onChange={(e) => handleInputChange(e, 'comment', post._id)}
/>
<div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center">
    <button
        type="button"
        onClick={() => setShowEmojiPicker(prev => ({
            show: prev.type === 'comment' && prev.id === post._id ? !prev.show : true,
            type: 'comment',
            id: post._id
        }))}
        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
        title="Add Emoji"
    >
        <FaSmile className="text-base" />
    </button>
    {showEmojiPicker.show && showEmojiPicker.type === 'comment' && showEmojiPicker.id === post._id && (
        <div className="absolute bottom-full right-0 z-[100] mb-2 shadow-xl animate-fade-in">
            <EmojiPicker 
                onEmojiClick={(emojiData) => handleEmojiClick(emojiData, 'comment', post._id)}
                width={300}
                height={400}
                previewConfig={{ showPreview: false }}
            />
        </div>
    )}
</div>

// 3. For new post modal textarea (around line 1701-1708)
<div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
    {showMentionSuggestions.show && showMentionSuggestions.type === 'post' && renderMentionsPanel()}
    <textarea
        value={newPost.content}
        onChange={(e) => handleInputChange(e, 'post')}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32 resize-none"
        placeholder="Share details... Use @ to mention property"
        required
    />
    <div className="absolute right-2 bottom-2">
        <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => ({
                show: prev.type === 'post' ? !prev.show : true,
                type: 'post',
                id: 'new-post'
            }))}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
            title="Add Emoji"
        >
            <FaSmile className="text-lg" />
        </button>
        {showEmojiPicker.show && showEmojiPicker.type === 'post' && (
            <div className="absolute bottom-full right-0 z-[100] mb-2 shadow-xl animate-fade-in">
                <EmojiPicker 
                    onEmojiClick={(emojiData) => handleEmojiClick(emojiData, 'post', 'new-post')}
                    width={300}
                    height={400}
                    previewConfig={{ showPreview: false }}
                />
            </div>
        )}
    </div>
</div>
