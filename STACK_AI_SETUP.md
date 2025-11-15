# Stack AI Integration Setup

This document describes the environment variables required for Stack AI integration.

## Required Environment Variables

Add the following environment variables to your `.env` file:

### 1. STACK_AI_API_KEY (Required)
- **Description**: Your Stack AI API key for authentication
- **Example**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **How to get it**: 
  - Sign up at https://stack-ai.com
  - Navigate to your API settings
  - Generate a new API key
  - Copy the key and add it to your `.env` file

### 2. STACK_AI_API_URL (Optional)
- **Description**: The Stack AI API endpoint URL
- **Default**: `https://api.stack-ai.com/v1/chat/completions`
- **Note**: Only set this if you're using a custom endpoint or proxy

### 3. STACK_AI_MODEL (Optional)
- **Description**: The AI model to use for chat completions
- **Default**: `gpt-4o-mini`
- **Options**: Check Stack AI documentation for available models
- **Examples**: 
  - `gpt-4o-mini` (default, cost-effective)
  - `gpt-4o` (more capable, higher cost)
  - `gpt-3.5-turbo` (legacy option)

## Example .env Configuration

```env
# Stack AI Configuration
STACK_AI_API_KEY=sk-your-api-key-here
STACK_AI_API_URL=https://api.stack-ai.com/v1/chat/completions
STACK_AI_MODEL=gpt-4o-mini
```

## Migration from Gemini

The following changes were made:
1. Removed `GEMINI_API_KEY` dependency
2. Replaced `@google/genai` package with `axios` (already in dependencies)
3. Updated API calls to use Stack AI's OpenAI-compatible format
4. Removed toast notifications showing "prompts left"
5. Updated all references from "Gemini" to generic "AI assistant"

## Notes

- Stack AI uses an OpenAI-compatible API format, making it easy to switch between providers
- Streaming responses are supported
- Non-streaming fallback is available if streaming fails
- All existing chat history and session management features remain unchanged

