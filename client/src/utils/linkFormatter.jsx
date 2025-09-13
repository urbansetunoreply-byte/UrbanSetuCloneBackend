import React from 'react';

// Utility function to format markdown text
const formatMarkdown = (text, isSentMessage = false) => {
  if (!text || typeof text !== 'string') return text;
  
  const lines = text.split('\n');
  const result = [];
  
  lines.forEach((line, lineIndex) => {
    let processedLine = line;
    const parts = [];
    let lastIndex = 0;
    
    // Process markdown formatting in order of precedence
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, tag: 'strong' }, // Bold
      { regex: /\*(.*?)\*/g, tag: 'em' }, // Italic
      { regex: /__(.*?)__/g, tag: 'u' }, // Underline
      { regex: /~~(.*?)~~/g, tag: 'del' }, // Strikethrough
    ];
    
    // Find all markdown patterns
    const matches = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(processedLine)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          tag: pattern.tag,
          full: match[0]
        });
      }
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Process non-overlapping matches
    const validMatches = [];
    matches.forEach(match => {
      const overlaps = validMatches.some(vm => 
        (match.start >= vm.start && match.start < vm.end) ||
        (match.end > vm.start && match.end <= vm.end)
      );
      if (!overlaps) {
        validMatches.push(match);
      }
    });
    
    // Build the formatted line
    validMatches.sort((a, b) => a.start - b.start);
    let currentIndex = 0;
    
    validMatches.forEach((match, idx) => {
      // Add text before the match
      if (match.start > currentIndex) {
        parts.push(processedLine.slice(currentIndex, match.start));
      }
      
      // Add the formatted element
      const TagName = match.tag;
      parts.push(
        <TagName key={`${lineIndex}-${idx}`} className={match.tag === 'u' ? 'underline' : ''}>
          {match.content}
        </TagName>
      );
      
      currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < processedLine.length) {
      parts.push(processedLine.slice(currentIndex));
    }
    
    // Handle list items
    if (line.trim().match(/^(\d+)\.\s+/)) {
      // Numbered list
      const listMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (listMatch) {
        const [, indent, num, content] = listMatch;
        result.push(
          <div key={lineIndex} className={`${indent ? 'ml-4' : ''} mb-1`}>
            <span className="font-medium text-blue-600">{num}.</span> {parts.length > 0 ? parts : content}
          </div>
        );
        return;
      }
    } else if (line.trim().match(/^[-•]\s+/)) {
      // Bullet list
      const listMatch = line.match(/^(\s*)[-•]\s+(.*)$/);
      if (listMatch) {
        const [, indent, content] = listMatch;
        result.push(
          <div key={lineIndex} className={`${indent ? 'ml-4' : ''} mb-1`}>
            <span className="text-blue-600">•</span> {parts.length > 0 ? parts : content}
          </div>
        );
        return;
      }
    } else if (line.trim().match(/^>\s+/)) {
      // Quote
      const quoteMatch = line.match(/^>\s+(.*)$/);
      if (quoteMatch) {
        const content = quoteMatch[1];
        result.push(
          <div key={lineIndex} className="border-l-4 border-gray-300 pl-3 ml-2 italic text-gray-600 mb-1">
            {parts.length > 0 ? parts : content}
          </div>
        );
        return;
      }
    }
    
    // Regular line
    if (parts.length > 0) {
      result.push(<span key={lineIndex}>{parts}</span>);
    } else if (line.trim()) {
      result.push(<span key={lineIndex}>{line}</span>);
    }
    
    // Add line break if not last line and line is not empty
    if (lineIndex < lines.length - 1 && line.trim()) {
      result.push(<br key={`br-${lineIndex}`} />);
    }
  });
  
  return result;
};

// Utility function to detect and format links in text
export const formatLinksInText = (text, isSentMessage = false) => {
  if (!text || typeof text !== 'string') return text;

  // URL regex pattern to match various link formats
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[^\s]{2,})/gi;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a URL
    if (urlRegex.test(part)) {
      // Ensure URL has protocol
      let url = part;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Different styling for sent vs received messages
      const linkClasses = isSentMessage 
        ? "text-white hover:text-blue-200 underline transition-colors duration-200" // White for sent messages (blue background)
        : "text-blue-600 hover:text-blue-800 underline transition-colors duration-200"; // Blue for received messages (white/gray background)
      
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    
    return part;
  });
};

// Component wrapper for formatted text with links
export const FormattedTextWithLinks = ({ text, isSentMessage = false, className = "" }) => {
  if (!text || typeof text !== 'string') return <span className={className}>{text}</span>;

  // First apply markdown formatting
  const markdownFormatted = formatMarkdown(text, isSentMessage);
  
  // Then apply link formatting to text parts
  const finalFormatted = markdownFormatted.map((part, index) => {
    if (typeof part === 'string') {
      return formatLinksInText(part, isSentMessage);
    }
    return part;
  });
  
  return (
    <span className={className}>
      {finalFormatted}
    </span>
  );
};

// Component wrapper for formatted text with links and search highlighting
export const FormattedTextWithLinksAndSearch = ({ text, isSentMessage = false, className = "", searchQuery = "" }) => {
  if (!text || typeof text !== 'string') return <span className={className}>{text}</span>;

  // First apply markdown formatting
  const markdownFormatted = formatMarkdown(text, isSentMessage);
  
  // Then process each part for search highlighting and property mentions
  const processedParts = markdownFormatted.map((part, partIndex) => {
    if (typeof part !== 'string') return part; // Keep React elements as-is
    
    let processedText = part;
    
    // Apply search highlighting
    if (searchQuery) {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = processedText.split(regex);
      
      processedText = parts.map((subPart, index) => {
        if (regex.test(subPart)) {
          return `<span class="search-text-highlight bg-yellow-200 text-black px-1 rounded">${subPart}</span>`;
        }
        return subPart;
      }).join('');
    }

    // Detect property mention tokens of the form @[Name](listingId)
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const pieces = [];
    let lastIndex = 0;
    let match;
    while ((match = mentionRegex.exec(processedText)) !== null) {
      const [full, name, listingId] = match;
      if (match.index > lastIndex) {
        pieces.push(processedText.slice(lastIndex, match.index));
      }
      const basePrefix = window.location.pathname.includes('/admin') ? '/admin/listing/' : '/user/listing/';
      const href = `${basePrefix}${listingId}`;
      const linkClasses = isSentMessage 
        ? "text-white underline decoration-dotted hover:text-blue-200"
        : "text-blue-600 underline decoration-dotted hover:text-blue-800";
      pieces.push(
        <a key={`prop-${listingId}-${match.index}-${partIndex}`} href={href} onClick={(e) => e.stopPropagation()} className={linkClasses} title={`Open ${name}`}>@{name}</a>
      );
      lastIndex = match.index + full.length;
    }
    if (lastIndex < processedText.length) {
      pieces.push(processedText.slice(lastIndex));
    }

    // Apply URL link formatting to non-mention text segments
    return pieces.flatMap((subPart, idx) => {
      if (typeof subPart === 'string') {
        return formatLinksInText(subPart, isSentMessage);
      }
      return subPart;
    });
  });

  return (
    <span className={className}>
      {processedParts}
    </span>
  );
};