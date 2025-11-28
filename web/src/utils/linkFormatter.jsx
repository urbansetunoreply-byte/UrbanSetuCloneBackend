import React, { useState, useEffect, useRef } from 'react';

// Utility function to format markdown text
const formatMarkdown = (text, isSentMessage = false) => {
  if (!text || typeof text !== 'string') return text;

  const lines = text.split('\n');
  const result = [];

  // Create a map to store processed parts for each line
  const lineProcessedParts = new Map();

  lines.forEach((line, lineIndex) => {
    // Ensure line is a string and not null/undefined
    if (!line || typeof line !== 'string') {
      return;
    }

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
  if (!text || typeof text !== 'string') return text || '';

  // URL regex pattern to match various link formats
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Check if this part is a URL - create a new regex instance to avoid global flag side effects
    const testRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
    if (testRegex.test(part)) {
      // Ensure URL has protocol
      let url = part;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Different styling for sent vs received messages
      const linkClasses = isSentMessage
        ? "text-white hover:text-blue-200 underline transition-colors duration-200 cursor-pointer" // White for sent messages (blue background)
        : "text-blue-600 hover:text-blue-800 underline transition-colors duration-200 cursor-pointer"; // Blue for received messages (white/gray background)

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
export const FormattedTextWithLinks = ({ text, isSentMessage = false, className = "", style = {}, textRef = null }) => {
  if (!text || typeof text !== 'string') return <div className={className} style={style} ref={textRef}>{text}</div>;

  // First apply markdown formatting
  const markdownFormatted = formatMarkdown(text, isSentMessage);

  // Then apply link formatting to text parts
  const finalFormatted = markdownFormatted.map((part, partIndex) => {
    if (typeof part === 'string') {
      // Handle property mentions first, then URLs
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

      // First, handle property mentions
      let processedText = part;
      const mentionMatches = [...part.matchAll(mentionRegex)];

      // Replace property mentions with placeholders to avoid conflicts with URL detection
      const mentionPlaceholders = [];
      mentionMatches.forEach((match, index) => {
        const [full, name, listingId] = match;
        const placeholder = `__MENTION_${partIndex}_${index}__`;
        processedText = processedText.replace(full, placeholder);
        mentionPlaceholders.push({ placeholder, name, listingId, full });
      });

      // Then handle URLs
      const urlMatches = [...processedText.matchAll(urlRegex)];
      const urlPlaceholders = [];
      urlMatches.forEach((match, index) => {
        const [url] = match;
        const placeholder = `__URL_${partIndex}_${index}__`;
        processedText = processedText.replace(url, placeholder);
        urlPlaceholders.push({ placeholder, url });
      });

      // Split by placeholders and process
      const allPlaceholders = [...mentionPlaceholders, ...urlPlaceholders];
      let parts;
      if (allPlaceholders.length > 0) {
        const placeholderRegex = new RegExp(`(${allPlaceholders.map(p => p.placeholder).join('|')})`, 'g');
        parts = processedText.split(placeholderRegex);
      } else {
        parts = [processedText];
      }

      return parts.map((subPart, index) => {
        if (!subPart) return null;

        // Check if it's a placeholder
        const mentionPlaceholder = mentionPlaceholders.find(p => p.placeholder === subPart);
        if (mentionPlaceholder) {
          const { name, listingId } = mentionPlaceholder;
          const basePrefix = window.location.pathname.includes('/admin') ? '/admin/listing/' : '/user/listing/';
          const href = `${basePrefix}${listingId}`;
          const linkClasses = isSentMessage
            ? "text-white underline decoration-dotted hover:text-blue-200 cursor-pointer"
            : "text-blue-600 underline decoration-dotted hover:text-blue-800 cursor-pointer";

          return (
            <a
              key={`mention-${partIndex}-${index}`}
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={linkClasses}
              title={`Open ${name}`}
            >
              @{name}
            </a>
          );
        }

        const urlPlaceholder = urlPlaceholders.find(p => p.placeholder === subPart);
        if (urlPlaceholder) {
          const { url } = urlPlaceholder;
          let finalUrl = url;
          if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
          }

          const linkClasses = isSentMessage
            ? "text-white hover:text-blue-200 underline transition-colors duration-200 cursor-pointer"
            : "text-blue-600 hover:text-blue-800 underline transition-colors duration-200 cursor-pointer";

          return (
            <a
              key={`url-${partIndex}-${index}`}
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
              onClick={(e) => e.stopPropagation()}
            >
              {url}
            </a>
          );
        }

        return subPart;
      });
    }
    // If it's already a React element (from markdown formatting), return it as is
    return part;
  });

  return (
    <div className={className} style={style} ref={textRef}>
      {finalFormatted}
    </div>
  );
};

// Component wrapper for formatted text with links and search highlighting
// Component wrapper with read more functionality for long messages
export const FormattedTextWithReadMore = ({ text, isSentMessage = false, className = "", searchQuery = "", maxLines = 4 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      // Check if content overflows
      const element = textRef.current;
      // We check if scrollHeight is greater than clientHeight.
      // Note: This check works best when line-clamp is applied.
      // If expanded, clientHeight will equal scrollHeight, so we rely on state persistence or check only when collapsed.
      if (!isExpanded) {
        setShouldShowReadMore(element.scrollHeight > element.clientHeight);
      }
    }
  }, [text, maxLines, isExpanded]);

  // Use the appropriate component based on search query
  const FormattedComponent = searchQuery && searchQuery.trim() ? FormattedTextWithLinksAndSearch : FormattedTextWithLinks;

  return (
    <div className="relative">
      <FormattedComponent
        text={text}
        isSentMessage={isSentMessage}
        className={className}
        searchQuery={searchQuery}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: !isExpanded ? maxLines : 'unset',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
        textRef={textRef}
      />

      {shouldShowReadMore && !isExpanded && (
        <div className="mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            className={`text-xs font-medium transition-colors duration-200 ${isSentMessage
                ? 'text-blue-200 hover:text-white'
                : 'text-blue-600 hover:text-blue-800'
              }`}
          >
            Read more
          </button>
        </div>
      )}

      {isExpanded && shouldShowReadMore && (
        <div className="mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            className={`text-xs font-medium transition-colors duration-200 ${isSentMessage
                ? 'text-blue-200 hover:text-white'
                : 'text-blue-600 hover:text-blue-800'
              }`}
          >
            Read less
          </button>
        </div>
      )}
    </div>
  );
};

export const FormattedTextWithLinksAndSearch = ({ text, isSentMessage = false, className = "", searchQuery = "", style = {}, textRef = null }) => {
  if (!text || typeof text !== 'string') return <div className={className} style={style} ref={textRef}>{text}</div>;

  // First apply markdown formatting
  const markdownFormatted = formatMarkdown(text, isSentMessage);

  // Then apply link formatting and search highlighting
  const finalFormatted = markdownFormatted.map((part, partIndex) => {
    if (typeof part === 'string') {
      // Handle property mentions first, then URLs
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

      // First, handle property mentions
      let processedText = part;
      const mentionMatches = [...part.matchAll(mentionRegex)];

      // Replace property mentions with placeholders to avoid conflicts with URL detection
      const mentionPlaceholders = [];
      mentionMatches.forEach((match, index) => {
        const [full, name, listingId] = match;
        const placeholder = `__MENTION_${partIndex}_${index}__`;
        processedText = processedText.replace(full, placeholder);
        mentionPlaceholders.push({ placeholder, name, listingId, full });
      });

      // Then handle URLs
      const urlMatches = [...processedText.matchAll(urlRegex)];
      const urlPlaceholders = [];
      urlMatches.forEach((match, index) => {
        const [url] = match;
        const placeholder = `__URL_${partIndex}_${index}__`;
        processedText = processedText.replace(url, placeholder);
        urlPlaceholders.push({ placeholder, url });
      });

      // Split by placeholders and process
      const allPlaceholders = [...mentionPlaceholders, ...urlPlaceholders];
      let parts;
      if (allPlaceholders.length > 0) {
        const placeholderRegex = new RegExp(`(${allPlaceholders.map(p => p.placeholder).join('|')})`, 'g');
        parts = processedText.split(placeholderRegex);
      } else {
        parts = [processedText];
      }

      return parts.map((subPart, index) => {
        if (!subPart) return null;

        // Check if it's a placeholder
        const mentionPlaceholder = mentionPlaceholders.find(p => p.placeholder === subPart);
        if (mentionPlaceholder) {
          const { name, listingId } = mentionPlaceholder;
          const basePrefix = window.location.pathname.includes('/admin') ? '/admin/listing/' : '/user/listing/';
          const href = `${basePrefix}${listingId}`;
          const linkClasses = isSentMessage
            ? "text-white underline decoration-dotted hover:text-blue-200 cursor-pointer"
            : "text-blue-600 underline decoration-dotted hover:text-blue-800 cursor-pointer";

          return (
            <a
              key={`mention-${partIndex}-${index}`}
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={linkClasses}
              title={`Open ${name}`}
            >
              @{name}
            </a>
          );
        }

        const urlPlaceholder = urlPlaceholders.find(p => p.placeholder === subPart);
        if (urlPlaceholder) {
          const { url } = urlPlaceholder;
          let finalUrl = url;
          if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
          }

          const linkClasses = isSentMessage
            ? "text-white hover:text-blue-200 underline transition-colors duration-200 cursor-pointer"
            : "text-blue-600 hover:text-blue-800 underline transition-colors duration-200 cursor-pointer";

          return (
            <a
              key={`url-${partIndex}-${index}`}
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
              onClick={(e) => e.stopPropagation()}
            >
              {url}
            </a>
          );
        }

        // Check for search highlighting
        if (searchQuery && searchQuery.trim()) {
          const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          const searchParts = subPart.split(regex);

          return searchParts.map((searchPart, searchIndex) => {
            if (regex.test(searchPart)) {
              return (
                <span key={`search-${partIndex}-${index}-${searchIndex}`} className="search-text-highlight bg-yellow-200 text-black px-1 rounded">
                  {searchPart}
                </span>
              );
            }
            return searchPart;
          });
        }

        return subPart;
      });
    }
    return part;
  });

  return (
    <div className={className} style={style} ref={textRef}>
      {finalFormatted}
    </div>
  );
};