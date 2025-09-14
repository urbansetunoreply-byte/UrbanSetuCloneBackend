import React from 'react';

// Utility function to format markdown text
const formatMarkdown = (text, isSentMessage = false) => {
  if (!text || typeof text !== 'string') return text;
  
  const lines = text.split('\n');
  const result = [];
  
  // Create a map to store processed parts for each line
  const lineProcessedParts = new Map();
  
  lines.forEach((line, lineIndex) => {
    // Check if this is a list item first
    const isNumberedList = line.trim().match(/^(\d+)\.\s+/);
    const isBulletList = line.trim().match(/^[-•]\s+/);
    
    if (isNumberedList || isBulletList) {
      // For list items, only process the content part, not the entire line
      let content = '';
      if (isNumberedList) {
        const listMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (listMatch) {
          content = listMatch[3]; // Only the content part
        }
      } else if (isBulletList) {
        const listMatch = line.match(/^(\s*)[-•]\s+(.*)$/);
        if (listMatch) {
          content = listMatch[2]; // Only the content part
        }
      }
      
      // Process markdown formatting only on the content part
      let processedLine = content;
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
      
      // Store the processed parts in the map
      lineProcessedParts.set(lineIndex, parts);
    } else {
      // For non-list items, process the entire line as before
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
      
      // Store the processed parts in the map
      lineProcessedParts.set(lineIndex, parts);
    }
    
    // Handle list items
    if (line.trim().match(/^(\d+)\.\s+/)) {
      // Numbered list
      const listMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (listMatch) {
        const [, indent, num, content] = listMatch;
        // Use different colors for sent vs received messages
        const listColor = isSentMessage ? "text-blue-200" : "text-blue-600";
        const processedParts = lineProcessedParts.get(lineIndex);
        result.push(
          <div key={lineIndex} className={`${indent ? 'ml-4' : ''} mb-1`}>
            <span className={`font-medium ${listColor}`}>{num}.</span> {processedParts && processedParts.length > 0 ? processedParts : content}
          </div>
        );
        return;
      }
    } else if (line.trim().match(/^[-•]\s+/)) {
      // Bullet list
      const listMatch = line.match(/^(\s*)[-•]\s+(.*)$/);
      if (listMatch) {
        const [, indent, content] = listMatch;
        // Use different colors for sent vs received messages
        const listColor = isSentMessage ? "text-blue-200" : "text-blue-600";
        const processedParts = lineProcessedParts.get(lineIndex);
        result.push(
          <div key={lineIndex} className={`${indent ? 'ml-4' : ''} mb-1`}>
            <span className={listColor}>•</span> {processedParts && processedParts.length > 0 ? processedParts : content}
          </div>
        );
        return;
      }
    } else if (line.trim().match(/^>\s+/)) {
      // Quote
      const quoteMatch = line.match(/^>\s+(.*)$/);
      if (quoteMatch) {
        const content = quoteMatch[1];
        // Use different text colors for sent vs received messages
        const textColor = isSentMessage ? "text-gray-200" : "text-gray-600";
        const borderColor = isSentMessage ? "border-gray-400" : "border-gray-300";
        const processedParts = lineProcessedParts.get(lineIndex);
        result.push(
          <div key={lineIndex} className={`border-l-4 ${borderColor} pl-3 ml-2 italic ${textColor} mb-1`}>
            {processedParts && processedParts.length > 0 ? processedParts : content}
          </div>
        );
        return;
      }
    }
    
    // Regular line
    const processedParts = lineProcessedParts.get(lineIndex);
    if (processedParts && processedParts.length > 0) {
      result.push(<span key={lineIndex}>{processedParts}</span>);
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
  
  // Debug logging
  console.log('formatLinksInText called with:', { text, isSentMessage });

  // URL regex pattern to match various link formats
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a URL - create a new regex instance to avoid global flag side effects
    const testRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
    if (testRegex.test(part)) {
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
  
  // Debug logging
  console.log('FormattedTextWithLinksAndSearch called with:', { text, isSentMessage, className, searchQuery });

  // First apply markdown formatting
  const markdownFormatted = formatMarkdown(text, isSentMessage);
  
  // Then process each part for search highlighting and property mentions
  const processedParts = markdownFormatted.map((part, partIndex) => {
    if (typeof part !== 'string') return part; // Keep React elements as-is
    
    let processedText = part;
    
    // First, handle property mentions
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentionPieces = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(processedText)) !== null) {
      const [full, name, listingId] = match;
      if (match.index > lastIndex) {
        mentionPieces.push(processedText.slice(lastIndex, match.index));
      }
      const basePrefix = window.location.pathname.includes('/admin') ? '/admin/listing/' : '/user/listing/';
      const href = `${basePrefix}${listingId}`;
      const linkClasses = isSentMessage 
        ? "text-white underline decoration-dotted hover:text-blue-200"
        : "text-blue-600 underline decoration-dotted hover:text-blue-800";
      mentionPieces.push(
        <a key={`prop-${listingId}-${match.index}-${partIndex}`} href={href} onClick={(e) => e.stopPropagation()} className={linkClasses} title={`Open ${name}`}>@{name}</a>
      );
      lastIndex = match.index + full.length;
    }
    if (lastIndex < processedText.length) {
      mentionPieces.push(processedText.slice(lastIndex));
    }

    // Then apply search highlighting to text parts
    const finalPieces = mentionPieces.flatMap((piece, idx) => {
      if (typeof piece !== 'string') return piece; // Keep React elements as-is
      
      if (searchQuery) {
        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = piece.split(regex);
        
        return parts.map((subPart, index) => {
          if (regex.test(subPart)) {
            return <span key={`search-${idx}-${index}`} className="search-text-highlight bg-yellow-200 text-black px-1 rounded">{subPart}</span>;
          }
          return subPart;
        });
      }
      
      return piece;
    });

    // Finally, apply URL link formatting to text segments
    return finalPieces.flatMap((subPart, idx) => {
      if (typeof subPart === 'string') {
        const linkFormatted = formatLinksInText(subPart, isSentMessage);
        // formatLinksInText returns an array, so we need to flatten it
        return Array.isArray(linkFormatted) ? linkFormatted : [linkFormatted];
      }
      return subPart;
    });
  });

  const finalResult = processedParts.flat(Infinity);
  console.log('FormattedTextWithLinksAndSearch final result:', finalResult);
  
  return (
    <span className={className}>
      {finalResult}
    </span>
  );
};