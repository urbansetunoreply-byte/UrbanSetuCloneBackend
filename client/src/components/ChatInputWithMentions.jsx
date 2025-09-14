import React, { useState, useRef, useEffect, forwardRef } from 'react';

const ChatInputWithMentions = forwardRef(({ 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  style = {},
  onKeyPress,
  onClick,
  disabled = false,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Use the forwarded ref or the internal ref
  const textareaRef = ref || inputRef;

  // Update display value when value prop changes
  useEffect(() => {
    if (value !== actualValue) {
      setActualValue(value);
      setDisplayValue(convertMentionsForDisplay(value));
    }
  }, [value, actualValue]);

  // Convert mentions from @[Name](id) format to @Name for display
  const convertMentionsForDisplay = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
  };

  // Convert mentions from @Name format to @[Name](id) for storage
  const convertMentionsForStorage = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Keep the original format for storage - the parent component handles the conversion
    return text;
  };

  const handleInputChange = (e) => {
    const newDisplayValue = e.target.value;
    setDisplayValue(newDisplayValue);
    
    // For storage, we need to convert @Name back to @[Name](id) format
    // But since we don't have the ID mapping here, we'll pass the display value
    // and let the parent component handle the conversion when needed
    setActualValue(newDisplayValue);
    
    // Create a new event with the display value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: newDisplayValue
      }
    };
    
    onChange(syntheticEvent);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onClick) onClick(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
  };

  // Format text for preview
  const formatTextForPreview = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const lines = text.split('\n');
    const result = [];
    
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
        
        // Handle list items
        if (isNumberedList) {
          const listMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
          if (listMatch) {
            const [, indent, num, content] = listMatch;
            result.push(
              <div key={lineIndex} className={`${indent ? 'ml-4' : ''} mb-1`}>
                <span className="font-medium text-blue-600">{num}.</span> {parts && parts.length > 0 ? parts : content}
              </div>
            );
            return;
          }
        } else if (isBulletList) {
          const listMatch = line.match(/^(\s*)[-•]\s+(.*)$/);
          if (listMatch) {
            const [, indent, content] = listMatch;
            result.push(
              <div key={lineIndex} className={`${indent ? 'ml-4' : ''} mb-1`}>
                <span className="text-blue-600">•</span> {parts && parts.length > 0 ? parts : content}
              </div>
            );
            return;
          }
        }
      } else if (line.trim().match(/^>\s+/)) {
        // Quote
        const quoteMatch = line.match(/^>\s+(.*)$/);
        if (quoteMatch) {
          const content = quoteMatch[1];
          // Process markdown formatting in quote content
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
          
          result.push(
            <div key={lineIndex} className="border-l-4 border-gray-300 pl-3 ml-2 italic text-gray-600 mb-1">
              {parts && parts.length > 0 ? parts : content}
            </div>
          );
          return;
        }
      } else {
        // Regular line - process markdown formatting
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
        
        if (parts && parts.length > 0) {
          result.push(<span key={lineIndex}>{parts}</span>);
        } else if (line.trim()) {
          result.push(<span key={lineIndex}>{line}</span>);
        }
      }
      
      // Add line break if not last line and line is not empty
      if (lineIndex < lines.length - 1 && line.trim()) {
        result.push(<br key={`br-${lineIndex}`} />);
      }
    });
    
    return result;
  };

  return (
    <div className="relative">
      {/* Preview overlay - only show when focused and has content */}
      {isFocused && displayValue && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 p-3 text-sm whitespace-pre-wrap break-words overflow-hidden"
          style={{
            ...style,
            minHeight: style.minHeight || '48px',
            maxHeight: style.maxHeight || '144px',
            lineHeight: style.lineHeight || '24px',
            wordBreak: 'break-all',
            overflowWrap: 'break-word',
            color: 'transparent', // Make text transparent so only formatting shows
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit',
            textAlign: 'inherit',
            textIndent: 'inherit',
            textTransform: 'inherit',
            textDecoration: 'inherit',
            textShadow: 'inherit',
            textOverflow: 'inherit',
            whiteSpace: 'inherit',
            wordSpacing: 'inherit',
            writingMode: 'inherit'
          }}
        >
          {formatTextForPreview(displayValue)}
        </div>
      )}
      
      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={{
          ...style,
          position: 'relative',
          zIndex: 1,
          backgroundColor: isFocused && displayValue ? 'transparent' : 'white'
        }}
        {...props}
      />
    </div>
  );
});

ChatInputWithMentions.displayName = 'ChatInputWithMentions';

export default ChatInputWithMentions;