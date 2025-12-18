# Emoji Picker Implementation Guide for Community.jsx and AdminCommunity.jsx

## Summary
This document outlines all the changes needed to add emoji picker functionality to message/reply boxes and edit boxes in both Community.jsx and AdminCommunity.jsx.

## Changes Already Made to Community.jsx:

1. ✅ Added FaSmile import to react-icons
2. ✅ Added EmojiPicker import from 'emoji-picker-react'
3. ✅ Added showEmojiPicker state: `const [showEmojiPicker, setShowEmojiPicker] = useState({ show: false, type: null, id: null });`
4. ✅ Added handleEmojiClick function
5. ✅ Added emoji picker to top-level reply input (directly to comment) - around line 1310-1365

## Changes Still Needed for Community.jsx:

### 1. Nested Reply Input (around line 1512-1527)
Replace the button container div with emoji picker support

### 2. Comment Input (around line 1565-1578)
Add emoji picker button before the send button

### 3. New Post Modal Textarea (around line 1701-1708)
Add emoji picker button at bottom-right of textarea

### 4. Edit Boxes - Need to add emoji pickers to:
- Post edit textarea (when editingPost is active)
- Comment edit textarea (when editingContent.type === 'comment')
- Reply edit textarea (when editingContent.type === 'reply')

## Implementation for AdminCommunity.jsx:

Need to replicate ALL the above changes in AdminCommunity.jsx:
1. Add imports (FaSmile, EmojiPicker)
2. Add state (showEmojiPicker)
3. Add handleEmojiClick function
4. Add emoji pickers to all reply inputs
5. Add emoji pickers to comment inputs
6. Add emoji pickers to new post modal
7. Add emoji pickers to all edit boxes

## Edit Box Implementation Pattern:

For edit boxes, we need to:
1. Update handleEmojiClick to handle 'edit-post', 'edit-comment', 'edit-reply' types
2. Add emoji picker button to each edit textarea
3. Position it at top-right of the edit box

Example for edit boxes:
```jsx
<div className="relative">
    <textarea
        value={editingContent.content}
        onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
        className="w-full bg-white border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 min-h-[50px]"
        autoFocus
    />
    <button
        type="button"
        onClick={() => setShowEmojiPicker(prev => ({
            show: prev.type === 'edit-reply' && prev.id === reply._id ? !prev.show : true,
            type: 'edit-reply',
            id: reply._id
        }))}
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
        title="Add Emoji"
    >
        <FaSmile className="text-sm" />
    </button>
    {showEmojiPicker.show && showEmojiPicker.type === 'edit-reply' && showEmojiPicker.id === reply._id && (
        <div className="absolute top-full right-0 z-[100] mt-2 shadow-xl animate-fade-in">
            <EmojiPicker 
                onEmojiClick={(emojiData) => {
                    setEditingContent(prev => ({ ...prev, content: prev.content + emojiData.emoji }));
                }}
                width={300}
                height={400}
                previewConfig={{ showPreview: false }}
            />
        </div>
    )}
</div>
```

## Next Steps:
1. Complete Community.jsx emoji pickers (nested replies, comments, new post, edit boxes)
2. Apply all changes to AdminCommunity.jsx
3. Test all emoji pickers work correctly
4. Ensure emoji pickers close when clicking outside or submitting forms
