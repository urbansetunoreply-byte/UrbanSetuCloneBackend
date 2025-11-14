# Gemini Chatbot Implementation Analysis

## Overview
This document provides a comprehensive analysis of the Gemini AI chatbot implementation, including backend API, frontend message handling, and code highlighting functionality.

---

## Backend Implementation

### API Route: `api/routes/gemini.route.js`

**Main Endpoint:**
- `POST /api/gemini/chat` - Chat with Gemini AI
  - Middleware: `optionalAuth` (users can chat without login, but authenticated users get better features)
  - Rate Limiting: `aiChatRateLimit` (role-based limits)

**Other Endpoints:**
- `GET /api/gemini/sessions` - Get user's chat sessions (authenticated)
- `POST /api/gemini/sessions` - Create new session (authenticated)
- `DELETE /api/gemini/sessions/:sessionId` - Delete session (authenticated)
- `DELETE /api/gemini/sessions` - Delete all sessions (authenticated)
- `POST /api/gemini/rate` - Rate a message (authenticated)
- `GET /api/gemini/ratings/:sessionId` - Get message ratings (authenticated)
- `POST /api/gemini/bookmark` - Bookmark message (authenticated)
- `DELETE /api/gemini/bookmark` - Remove bookmark (authenticated)
- `GET /api/gemini/bookmarks/:sessionId` - Get bookmarked messages (authenticated)

---

### Controller: `api/controllers/gemini.controller.js`

#### Main Function: `chatWithGemini`

**Parameters Accepted:**
```javascript
{
    message,                    // Required: user message
    history,                    // Optional: conversation history array
    sessionId,                  // Optional: session identifier
    tone,                       // Optional: 'friendly', 'formal', 'concise', 'neutral'
    responseLength,             // Optional: 'short', 'medium', 'long'
    creativity,                 // Optional: 'conservative', 'balanced', 'creative'
    temperature,                // Optional: AI temperature (0.1-1.0)
    topP,                      // Optional: Top-p sampling
    topK,                       // Optional: Top-k sampling
    maxTokens,                 // Optional: Max output tokens
    enableStreaming,           // Optional: Enable streaming response
    enableContextMemory,       // Optional: Use conversation history
    contextWindow,              // Optional: Number of messages to include in context
    enableSystemPrompts,        // Optional: Use enhanced system prompts
    audioUrl,                   // Optional: Audio file URL
    imageUrl,                   // Optional: Image file URL
    videoUrl,                   // Optional: Video file URL
    documentUrl,                // Optional: Document file URL
    selectedProperties         // Optional: Selected property IDs for context
}
```

**Key Features:**

1. **System Prompt Generation:**
   - Real estate-focused assistant
   - Incorporates website data (properties, FAQs, articles)
   - Tone-based customization
   - Dynamic context from cached website data

2. **Streaming vs Non-Streaming:**
   - Supports both streaming (`enableStreaming: true`) and regular responses
   - Streaming: Uses Server-Sent Events (SSE) format
   - Returns chunks in format: `data: {type: 'chunk', content: string, done: false}\n\n`
   - Final chunk: `data: {type: 'done', content: string, done: true}\n\n`

3. **Model Configuration:**
   - Uses `gemini-2.0-flash-exp` model
   - Dynamic token limits based on response length and complexity
   - Customizable temperature, topP, topK, maxTokens

4. **Chat History Management:**
   - Saves messages to `ChatHistory` model (if user authenticated)
   - Auto-generates session titles using AI (after 2+ messages)
   - Context window filtering (last N messages)

5. **Error Handling:**
   - Timeout handling (90 seconds)
   - Rate limit detection (429 errors)
   - Authentication errors (401)
   - Service unavailable errors (503/500)
   - Graceful fallback from streaming to non-streaming

**Response Format:**

**Non-Streaming:**
```json
{
    "success": true,
    "response": "AI response text",
    "sessionId": "session_1234567890_abc123"
}
```

**Streaming:**
- Uses Server-Sent Events (SSE)
- Content-Type: `text/plain; charset=utf-8`
- Format: `data: {JSON object}\n\n` per chunk
- Chunks include: `{type: 'chunk', content: string, done: false}`
- Final: `{type: 'done', content: string, done: true}`

---

## Frontend Implementation

### Component: `web/src/components/GeminiChatbox.jsx`

#### Key Dependencies

**Code Highlighting:**
```javascript
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
```

#### State Management

**Message State:**
```javascript
const [messages, setMessages] = useState([
    {
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant...',
        timestamp: new Date().toISOString()
    }
]);
```

**Code Highlighting State:**
```javascript
const [enableCodeHighlighting, setEnableCodeHighlighting] = useState(
    () => getUserSetting('gemini_code_highlighting', 'true') !== 'false'
);
```

**Highlighted Message State:**
```javascript
const [highlightedMessage, setHighlightedMessage] = useState(null);
// Used for visual highlighting (bookmark navigation, search results)
```

---

### Message Rendering

#### 1. Markdown Processing (`renderMarkdown` function)

**Location:** Lines 3462-3554

**Process Flow:**

1. **Check if markdown is enabled:**
   ```javascript
   if (!enableMarkdown) return text;
   ```

2. **Process Code Blocks First:**
   - Regex: `/```(\w+)?\n?([\s\S]*?)```/g`
   - Extracts: language identifier and code content
   - Language mapping (aliases → Prism.js names):
     ```javascript
     const languageMap = {
         'html': 'markup',
         'xml': 'markup',
         'js': 'javascript',
         'py': 'python',
         'sh': 'bash',
         'shell': 'bash',
         'md': 'markdown'
     };
     ```

3. **Code Highlighting Logic:**
   ```javascript
   if (enableCodeHighlighting) {
       try {
           // Highlight with Prism.js
           const highlightedCode = Prism.highlight(
               cleanCode, 
               Prism.languages[lang] || Prism.languages.text, 
               lang
           );
           
           // Return HTML with syntax highlighting
           return `<div class="code-block">
               <pre class="bg-gray-900 dark:bg-gray-800 ...">
                   <code class="language-${lang}">${highlightedCode}</code>
               </pre>
           </div>`;
       } catch (error) {
           // Fallback to plain code without highlighting
           return `<div class="code-block">
               <pre class="...">
                   <code class="language-${lang}">${cleanCode}</code>
               </pre>
           </div>`;
       }
   } else {
       // No highlighting, plain code block
       return `<div class="code-block">...</div>`;
   }
   ```

4. **Process Inline Code:**
   - Regex: /`([^`]+)`/g
   - Converts to: `<code class="bg-gray-100...">$1</code>`

5. **Process Other Markdown:**
   - **Bold:** `**text**` → `<strong>text</strong>`
   - **Italic:** `*text*` → `<em>text</em>`
   - **Headers:** `## Heading` → `<h2>Heading</h2>`
   - **Lists:** `- item` → `<ul><li>item</li></ul>`
   - **Links:** `[text](url)` → `<a href="url">text</a>`

---

#### 2. Prism.js Initialization

**Location:** Lines 871-876

```javascript
useEffect(() => {
    if (enableCodeHighlighting) {
        Prism.highlightAll();  // Re-highlight all code blocks on mount/update
    }
}, [messages, enableCodeHighlighting]);
```

**When it runs:**
- After messages array updates
- When `enableCodeHighlighting` setting changes
- Automatically highlights all `<code>` elements with `language-*` classes

---

#### 3. Message Display Component

**Location:** Lines 4105-4200 (message rendering in JSX)

**Message Structure:**
```jsx
<div
    data-message-index={index}
    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
        highlightedMessage === index ? 'animate-pulse' : ''
    }`}
>
    <div className={`max-w-[85%] ... ${highlightedMessage === index 
        ? 'ring-4 ring-yellow-400 ring-opacity-50 shadow-lg transform scale-105' 
        : ''}`}>
        {/* Message content with markdown rendering */}
        <div 
            className="..."
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
    </div>
</div>
```

**Key Features:**
- **Visual Highlighting:** When `highlightedMessage === index`, applies pulse animation and yellow ring
- **Role-based styling:** User messages (right-aligned, gradient background), Assistant messages (left-aligned, gray background)
- **HTML Rendering:** Uses `dangerouslySetInnerHTML` to render processed markdown HTML

---

### Streaming Response Handling

**Location:** Lines 1350-1450 (approximate, based on code structure)

**Process:**

1. **Setup EventSource or Fetch with ReadableStream:**
   ```javascript
   const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ ...options, enableStreaming: true })
   });
   ```

2. **Read Stream:**
   ```javascript
   const reader = response.body.getReader();
   const decoder = new TextDecoder();
   
   while (true) {
       const { done, value } = await reader.read();
       if (done) break;
       
       const chunk = decoder.decode(value);
       // Process chunk (format: "data: {...}\n\n")
   }
   ```

3. **Process Chunks:**
   ```javascript
   // Parse SSE format: "data: {JSON}\n\n"
   const lines = chunk.split('\n\n');
   lines.forEach(line => {
       if (line.startsWith('data: ')) {
           const data = JSON.parse(line.slice(6));
           
           if (data.type === 'chunk') {
               // Append chunk to message
               setMessages(prev => {
                   const lastMsg = prev[prev.length - 1];
                   if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                       return [...prev.slice(0, -1), {
                           ...lastMsg,
                           content: lastMsg.content + data.content
                       }];
                   }
                   return prev;
               });
           } else if (data.type === 'done') {
               // Finalize message
               setMessages(prev => {
                   const lastMsg = prev[prev.length - 1];
                   return [...prev.slice(0, -1), {
                       ...lastMsg,
                       content: data.content,
                       isStreaming: false
                   }];
               });
           }
       }
   });
   ```

4. **Re-highlight After Streaming:**
   - After message completes, `Prism.highlightAll()` is called via useEffect
   - Ensures code blocks are highlighted even when streamed

---

### Code Highlighting Styles

**Location:** Lines 6746-7052 (CSS styling)

**Key Styles:**

1. **Code Block Container:**
   ```css
   .code-block {
       margin: 1rem 0;
       position: relative;
   }
   .code-block pre {
       overflow-x: auto;
       padding: 1rem;
       border-radius: 0.5rem;
       border: 1px solid;
   }
   ```

2. **Theme Support:**
   - **Light Mode:** `bg-gray-100`, `text-gray-900`
   - **Dark Mode:** `bg-gray-900`, `text-gray-100` (when highlighting enabled)
   - **Fallback (no highlighting):** `bg-gray-100` (light), `bg-gray-800` (dark)

3. **Prism.js Token Colors (when highlighting enabled):**
   - Comments: Gray
   - Keywords: Blue/Purple
   - Strings: Green
   - Numbers: Orange/Yellow
   - Functions: Cyan
   - Operators: Red

4. **Disabled Highlighting Effects:**
   - Line numbers removed
   - Line highlighting disabled
   - Hover effects minimal
   - Selection effects customized

---

### Settings Integration

**Code Highlighting Toggle:**
```javascript
const updateEnableCodeHighlighting = (enabled) => {
    setEnableCodeHighlighting(enabled);
    setUserSetting('gemini_code_highlighting', enabled.toString());
};
```

**User Setting Storage:**
- Stored per-user in localStorage
- Key format: `user_{userId}_gemini_code_highlighting`
- Default: `'true'` (enabled)

**Location in UI:** Settings panel with toggle switch (line ~5933-5945)

---

## Message Flow Summary

### Complete Flow Diagram

```
User Types Message
    ↓
Frontend: Send to /api/gemini/chat
    ↓
Backend: Process with Gemini API
    ├── [Streaming] → Stream chunks back
    └── [Non-Streaming] → Return full response
    ↓
Frontend: Receive Response
    ├── [Streaming] → Append chunks to message
    └── [Non-Streaming] → Add complete message
    ↓
Frontend: renderMarkdown()
    ├── Detect code blocks (```language code```)
    ├── Highlight with Prism.js (if enabled)
    ├── Process inline code (`code`)
    ├── Process markdown (bold, italic, links, etc.)
    └── Return HTML string
    ↓
Frontend: Render with dangerouslySetInnerHTML
    ↓
useEffect: Prism.highlightAll()
    ↓
Display: Highlighted code blocks in UI
```

---

## Key Implementation Details

### 1. Code Block Detection

**Pattern:** Triple backticks with optional language identifier
- Format: ` ```language\ncode\n``` `
- Regex: `/```(\w+)?\n?([\s\S]*?)```/g`
- Captures: Language (group 1), Code (group 2)

### 2. Language Detection & Mapping

**Supported Languages:**
- JavaScript (`js`, `javascript`)
- Python (`py`, `python`)
- Java (`java`)
- CSS (`css`)
- HTML/XML/SVG (`html`, `xml`, `svg` → `markup`)
- JSON (`json`)
- SQL (`sql`)
- Bash/Shell (`sh`, `shell`, `bash`)
- Markdown (`md`, `markdown`)
- Text (default fallback)

### 3. Highlighting Process

**Steps:**
1. Extract code block from markdown
2. Detect or map language identifier
3. Call `Prism.highlight(code, Prism.languages[lang], lang)`
4. Wrap result in HTML with appropriate classes
5. Insert back into markdown string
6. Continue processing rest of markdown

### 4. Error Handling

**Graceful Degradation:**
- If Prism.js fails → Show plain code block without highlighting
- If language not supported → Use `Prism.languages.text` (no syntax highlighting)
- If highlighting disabled → Plain code block with basic styling

### 5. Performance Optimizations

**Prism.highlightAll() Timing:**
- Runs after messages update (useEffect dependency)
- Only runs when `enableCodeHighlighting` is true
- Re-runs when highlighting setting changes

**Streaming Optimization:**
- Chunks appended incrementally
- Highlighting applied once after streaming completes
- Avoids re-highlighting on every chunk

---

## Configuration Options

### User Settings (localStorage)

**Code Highlighting:**
- Key: `user_{userId}_gemini_code_highlighting`
- Values: `'true'` (enabled), `'false'` (disabled)
- Default: `'true'`

**Related Settings:**
- `gemini_enable_markdown`: Enable/disable markdown processing
- `gemini_dark_mode`: Dark mode toggle
- `gemini_streaming`: Enable streaming responses
- `gemini_tone`: Response tone (friendly, formal, concise, neutral)

---

## Code Highlighting Output Examples

### Input (Markdown):
````markdown
Here's a JavaScript example:

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
}
```

And inline code: `const x = 42;`
````

### Output (With Highlighting Enabled):
```html
Here's a JavaScript example:

<div class="code-block">
    <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg ...">
        <code class="language-javascript">
            <span class="token keyword">function</span> 
            <span class="token function">greet</span>
            <span class="token punctuation">(</span>
            <span class="token parameter">name</span>
            <span class="token punctuation">)</span> 
            <span class="token punctuation">{</span>
            <span class="token console class-name">console</span>
            <span class="token punctuation">.</span>
            <span class="token method">log</span>
            <span class="token punctuation">(</span>
            <span class="token template-string string">`Hello, ${name}!`</span>
            <span class="token punctuation">)</span>
            <span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        </code>
    </pre>
</div>

And inline code: <code class="bg-gray-100 px-2 py-1 rounded ...">const x = 42;</code>
```

### Output (With Highlighting Disabled):
```html
Here's a JavaScript example:

<div class="code-block">
    <pre class="bg-gray-100 text-gray-900 p-4 rounded-lg ...">
        <code class="language-javascript">
function greet(name) {
    console.log(`Hello, ${name}!`);
}
        </code>
    </pre>
</div>

And inline code: <code class="bg-gray-100 px-2 py-1 rounded ...">const x = 42;</code>
```

---

## Summary

### Backend:
- ✅ Streams or returns complete responses
- ✅ Handles errors gracefully
- ✅ Saves chat history (authenticated users)
- ✅ Auto-generates session titles

### Frontend:
- ✅ Prism.js for code syntax highlighting
- ✅ Markdown processing with code block detection
- ✅ Streaming support with incremental rendering
- ✅ User-configurable highlighting (toggle on/off)
- ✅ Theme-aware code blocks (light/dark mode)
- ✅ Multiple language support
- ✅ Graceful fallback when highlighting fails

### Code Highlighting:
- ✅ Automatic detection of code blocks in markdown
- ✅ Language identification and mapping
- ✅ Syntax highlighting via Prism.js
- ✅ Theme-aware styling
- ✅ Inline code support
- ✅ Performance optimized (highlights after message complete)

Ready for modifications! 🚀
