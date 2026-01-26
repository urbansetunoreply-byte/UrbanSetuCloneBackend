import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Bold, Italic, List, Link, Heading1, Heading2,
    Code, Quote, Image as ImageIcon, Eye, Edit3
} from 'lucide-react';

const MarkdownEditor = ({ value, onChange, placeholder }) => {
    const [activeTab, setActiveTab] = useState('edit');

    const insertText = (before, after = '') => {
        const textarea = document.getElementById('markdown-editor-textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

        onChange(newText);

        // Reset focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const toolbarItems = [
        { icon: Heading1, action: () => insertText('# ', ''), label: 'H1' },
        { icon: Heading2, action: () => insertText('## ', ''), label: 'H2' },
        { icon: Bold, action: () => insertText('**', '**'), label: 'Bold' },
        { icon: Italic, action: () => insertText('_', '_'), label: 'Italic' },
        { icon: List, action: () => insertText('- ', ''), label: 'List' },
        { icon: Quote, action: () => insertText('> ', ''), label: 'Quote' },
        { icon: Code, action: () => insertText('`', '`'), label: 'Inline Code' },
        { icon: Link, action: () => insertText('[', '](https://)'), label: 'Link' },
        { icon: ImageIcon, action: () => insertText('![alt text](', ')'), label: 'Image' },
    ];

    return (
        <div className="w-full border border-gray-200 dark:border-gray-600 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 shadow-sm focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-2 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 gap-1">
                <div className="flex flex-wrap gap-1">
                    {toolbarItems.map((item, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={item.action}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                            title={item.label}
                        >
                            <item.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-200/50 dark:bg-gray-600/50 p-1 rounded-xl gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Edit3 className="w-3 h-3" /> EDIT
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Eye className="w-3 h-3" /> PREVIEW
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative min-h-[300px]">
                {activeTab === 'edit' ? (
                    <textarea
                        id="markdown-editor-textarea"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full min-h-[400px] p-6 bg-transparent text-gray-800 dark:text-white border-none focus:ring-0 font-mono text-sm resize-y placeholder-gray-400 dark:placeholder-gray-500"
                    />
                ) : (
                    <div className="p-8 prose dark:prose-invert max-w-none prose-blue dark:prose-indigo prose-img:rounded-3xl prose-headings:font-black prose-p:text-gray-600 dark:prose-p:text-gray-300 min-h-[400px]">
                        {value ? (
                            <ReactMarkdown>{value}</ReactMarkdown>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic">
                                Nothing to preview yet...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarkdownEditor;
