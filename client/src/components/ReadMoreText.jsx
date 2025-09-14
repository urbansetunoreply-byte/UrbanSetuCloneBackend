import React, { useState } from 'react';
import { FormattedTextWithLinks, FormattedTextWithLinksAndSearch } from '../utils/linkFormatter.jsx';

const ReadMoreText = ({ 
  text, 
  isSentMessage, 
  className = "", 
  searchQuery = null,
  maxLength = 200,
  minHeight = "60px"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Clean the text
  const cleanText = (text || '').replace(/\n+$/, '');
  
  // Check if text is long enough to need truncation
  const needsTruncation = cleanText.length > maxLength;
  
  // Get the truncated text
  const truncatedText = needsTruncation ? cleanText.substring(0, maxLength) + '...' : cleanText;
  
  // Determine which component to use based on search query
  const TextComponent = searchQuery ? FormattedTextWithLinksAndSearch : FormattedTextWithLinks;
  
  return (
    <div className="relative">
      <div 
        className={`${className} ${!isExpanded && needsTruncation ? 'overflow-hidden' : ''}`}
        style={{
          minHeight: !isExpanded && needsTruncation ? minHeight : 'auto',
          maxHeight: !isExpanded && needsTruncation ? minHeight : 'none'
        }}
      >
        <TextComponent 
          text={isExpanded ? cleanText : truncatedText}
          isSentMessage={isSentMessage}
          className={className}
          {...(searchQuery && { searchQuery })}
        />
      </div>
      
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-1 text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
            isSentMessage 
              ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export default ReadMoreText;