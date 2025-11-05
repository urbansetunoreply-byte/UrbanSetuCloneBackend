import { GoogleGenAI } from "@google/genai";
import ChatHistory from '../models/chatHistory.model.js';
import MessageRating from '../models/messageRating.model.js';
import { getRelevantWebsiteData } from '../services/websiteDataService.js';
import { getRelevantCachedData, needsReindexing, indexAllWebsiteData } from '../services/dataSyncService.js';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "AIzaSyAcqc4JRzSG5pdYDWxbk3UZRn0IhrWhV7k"
});

export const chatWithGemini = async (req, res) => {
    try {
        const { 
            message, 
            history = [], 
            sessionId, 
            tone = 'neutral', 
            responseLength = 'medium', 
            creativity = 'balanced',
            temperature = '0.7',
            topP = '0.8',
            topK = '40',
            maxTokens = '2048',
            enableStreaming = true,
            enableContextMemory = true,
            contextWindow = '10',
            enableSystemPrompts = true,
            audioUrl, 
            imageUrl, 
            videoUrl, 
            documentUrl 
        } = req.body;
        const userId = req.user?.id;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message is required' 
            });
        }

        // Security: Rate limiting check
        const userAgent = req.get('User-Agent') || '';
        const ip = req.ip || req.connection.remoteAddress;
        
        // Basic input sanitization
        const sanitizedMessage = message.trim().substring(0, 2000); // Limit message length
        if (sanitizedMessage !== message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message too long. Please keep it under 2000 characters.'
            });
        }

        // Generate session ID if not provided
        const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Enhanced system prompt with more comprehensive real estate knowledge
        const getSystemPrompt = async (tone, userMessage) => {
            const basePrompt = `You are Gemini, an advanced AI assistant specializing in real estate. You provide comprehensive help with:

            PROPERTY SEARCH & RECOMMENDATIONS:
            - Finding properties based on budget, location, and preferences
            - Neighborhood analysis and local amenities
            - Property comparison and evaluation
            - Market trends and pricing insights

            HOME BUYING & SELLING:
            - Step-by-step buying process guidance
            - Selling strategies and pricing advice
            - Negotiation tips and market timing
            - Closing process and documentation

            INVESTMENT & FINANCE:
            - Real estate investment strategies
            - ROI calculations and market analysis
            - Financing options and mortgage guidance
            - Tax implications and benefits

            LEGAL & REGULATORY:
            - Property laws and regulations
            - Contract terms and conditions
            - Zoning laws and restrictions
            - Title and deed information

            PROPERTY MANAGEMENT:
            - Landlord-tenant relationships
            - Maintenance and repairs
            - Rental pricing and market analysis
            - Property improvement tips

            Always provide accurate, helpful, and professional responses. When uncertain, recommend consulting with licensed real estate professionals, attorneys, or financial advisors. Include relevant examples and actionable advice when possible.`;
            
            const toneInstructions = {
                'friendly': 'Respond in a warm, approachable, and encouraging tone. Use casual language while maintaining professionalism. Be supportive and encouraging, especially for first-time buyers.',
                'formal': 'Respond in a formal, business-like tone. Use professional language and structure your responses clearly with bullet points and sections. Focus on facts and data.',
                'concise': 'Keep responses brief and to the point. Focus on essential information without unnecessary elaboration. Use bullet points and short paragraphs.',
                'neutral': 'Maintain a balanced, professional tone that is neither too casual nor too formal. Provide comprehensive information in a clear, organized manner.'
            };
            
            // Get selected properties from request body
            const selectedProperties = req.body.selectedProperties || [];
            
            // Check if data needs re-indexing and do it if necessary
            if (needsReindexing()) {
                console.log('🔄 Data needs re-indexing, updating cache...');
                try {
                    await indexAllWebsiteData();
                    console.log('✅ Data cache updated');
                } catch (error) {
                    console.error('❌ Error updating data cache:', error);
                }
            }
            
            // Get relevant website data from cache (faster)
            const websiteData = getRelevantCachedData(userMessage, selectedProperties);
            
            return `${basePrompt}

CURRENT WEBSITE DATA (UrbanSetu):
${websiteData}

IMPORTANT INSTRUCTIONS:
- Always reference specific properties, articles, or FAQs from the website data when relevant
- Provide exact property details (prices, locations, amenities) from the data
- If user asks about properties, show them the actual listings from our website
- If user asks general real estate questions, provide general advice but also mention relevant content from our website
- Always maintain a professional tone and encourage users to contact us for more details

Tone: ${toneInstructions[tone] || toneInstructions['neutral']}`;
        };

        // Prepare conversation history with security filtering using contextWindow
        const contextWindowSize = parseInt(contextWindow) || 10;
        const filteredHistory = history.slice(-contextWindowSize).map(msg => ({
            role: msg.role,
            content: msg.content?.substring(0, 1000) // Limit history message length
        }));

        const conversationContext = filteredHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        const systemPrompt = await getSystemPrompt(tone, sanitizedMessage);
        const fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${conversationContext}\n\nCurrent user message: ${sanitizedMessage}`;

        console.log('Calling Gemini API with model: gemini-2.0-flash-exp, tone:', tone, 'responseLength:', responseLength, 'creativity:', creativity);
        
        // Dynamic model selection based on complexity
        const messageComplexity = sanitizedMessage.length > 500 ? 'complex' : 'simple';
        
        // Helper functions for AI settings
        const getMaxTokens = (responseLength, complexity) => {
            const baseTokens = complexity === 'complex' ? 4096 : 2048;
            switch (responseLength) {
                case 'short': return Math.min(baseTokens, 1024);
                case 'long': return Math.min(baseTokens * 2, 8192);
                default: return baseTokens; // medium
            }
        };

        const getTemperature = (creativity, tone, customTemp) => {
            // Use custom temperature if provided, otherwise use creativity-based logic
            if (customTemp && !isNaN(parseFloat(customTemp))) {
                return Math.max(0.1, Math.min(1.0, parseFloat(customTemp)));
            }
            
            const baseTemp = tone === 'concise' ? 0.3 : (tone === 'formal' ? 0.5 : 0.7);
            switch (creativity) {
                case 'conservative': return Math.max(baseTemp - 0.2, 0.1);
                case 'creative': return Math.min(baseTemp + 0.2, 1.0);
                default: return baseTemp; // balanced
            }
        };

        const getTopP = (customTopP) => {
            if (customTopP && !isNaN(parseFloat(customTopP))) {
                return Math.max(0.1, Math.min(1.0, parseFloat(customTopP)));
            }
            return 0.8;
        };

        const getTopK = (customTopK) => {
            if (customTopK && !isNaN(parseInt(customTopK))) {
                return Math.max(1, Math.min(100, parseInt(customTopK)));
            }
            return 40;
        };

        const getMaxTokensFromSettings = (responseLength, complexity, customMaxTokens) => {
            if (customMaxTokens && !isNaN(parseInt(customMaxTokens))) {
                return Math.max(1, Math.min(8192, parseInt(customMaxTokens)));
            }
            return getMaxTokens(responseLength, complexity);
        };
        
        // Build parts array with text and media
        const parts = [{ text: fullPrompt }];
        
        // Add media files if provided
        if (imageUrl) {
            parts.push({
                inline_data: {
                    mime_type: "image/jpeg", // Default, could be enhanced to detect actual type
                    data: imageUrl // For now, using URL directly
                }
            });
        }
        
        if (audioUrl) {
            // For audio URLs, we'll include it in the text message for now
            // In a production environment, you'd want to fetch the audio file and convert to base64
            // or use a proper speech-to-text service before sending to Gemini
            console.log('Audio URL provided:', audioUrl);
            // Note: Gemini 2.0 doesn't directly support audio transcription via URL
            // This would require fetching the audio file and converting to base64
        }
        
        if (videoUrl) {
            parts.push({
                inline_data: {
                    mime_type: "video/mp4", // Default
                    data: videoUrl
                }
            });
        }
        
        const modelConfig = {
            model: "gemini-2.0-flash-exp",
            contents: [{
                role: 'user',
                parts: parts
            }],
            config: {
                maxOutputTokens: getMaxTokensFromSettings(responseLength, messageComplexity, maxTokens),
                temperature: getTemperature(creativity, tone, temperature),
                topP: getTopP(topP),
                topK: getTopK(topK),
            }
        };
        
        // Handle streaming vs non-streaming responses
        if (enableStreaming === true || enableStreaming === 'true') {
            console.log('Streaming enabled - setting up streaming response');
            
            // Set up streaming response
            const origin = req.headers.origin || 'https://urbansetu.vercel.app';
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            });

            try {
                // Use generateContentStream for streaming
                const stream = await ai.models.generateContentStream(modelConfig);
                let fullResponse = '';
                
                for await (const chunk of stream) {
                    let chunkText = '';
                    
                    // Handle different chunk formats
                    if (typeof chunk.text === 'function') {
                        chunkText = chunk.text();
                    } else if (chunk.text) {
                        chunkText = chunk.text;
                    } else if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts && chunk.candidates[0].content.parts[0] && chunk.candidates[0].content.parts[0].text) {
                        chunkText = chunk.candidates[0].content.parts[0].text;
                    }
                    
                    if (chunkText) {
                        fullResponse += chunkText;
                        // Send chunk to client
                        res.write(`data: ${JSON.stringify({ 
                            type: 'chunk', 
                            content: chunkText,
                            done: false 
                        })}\n\n`);
                    }
                }
                
                // Send completion signal
                res.write(`data: ${JSON.stringify({ 
                    type: 'done', 
                    content: fullResponse,
                    done: true 
                })}\n\n`);
                
                console.log('Streaming completed, total length:', fullResponse.length);
                
                // Save chat history with full response
                if (userId) {
                    try {
                        const chatHistory = await ChatHistory.findOrCreateSession(userId, currentSessionId);
                        await chatHistory.addMessage('user', message);
                        await chatHistory.addMessage('assistant', fullResponse);
                        // Auto-title logic here (same as non-streaming)
                        await chatHistory.save();
                        const updatedChatHistory = await ChatHistory.findById(chatHistory._id);
                        
                        console.log('Chat history check - Name:', updatedChatHistory.name, 'Message count:', updatedChatHistory.messages?.length);
                        
                        const isFallbackTitle = updatedChatHistory.name && (
                            updatedChatHistory.name.match(/^Chat \d{1,2}\/\d{1,2}\/\d{4}$/) || 
                            updatedChatHistory.name.match(/^New chat \d+$/)
                        );
                        
                        if ((!updatedChatHistory.name || isFallbackTitle) && updatedChatHistory.messages && updatedChatHistory.messages.length >= 2) {
                            try {
                                console.log('Generating auto-title for session:', currentSessionId);
                                const convoForTitle = updatedChatHistory.messages.slice(0, 8).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
                                const titlePrompt = `Create a short, descriptive title (4-7 words) for this real estate conversation. Focus on the main topic or question. Do not include quotes, just return the title.\n\nConversation:\n${convoForTitle}\n\nTitle:`;
                                
                                const titleResult = await ai.models.generateContent({
                                    model: 'gemini-2.0-flash-exp',
                                    contents: [{ role: 'user', parts: [{ text: titlePrompt }] }]
                                });
                                
                                const titleRaw = titleResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                const title = titleRaw.replace(/[\n\r"']+/g, ' ').slice(0, 80).trim();
                                
                                if (title && title.length > 0) {
                                    updatedChatHistory.name = title;
                                    await updatedChatHistory.save();
                                    console.log('Auto-title saved successfully:', title);
                                } else {
                                    console.warn('Generated title is empty or invalid, using fallback');
                                    const firstUserMessage = updatedChatHistory.messages.find(m => m.role === 'user');
                                    if (firstUserMessage) {
                                        const fallbackTitle = firstUserMessage.content.slice(0, 50).trim();
                                        if (fallbackTitle) {
                                            updatedChatHistory.name = fallbackTitle;
                                            await updatedChatHistory.save();
                                            console.log('Fallback title saved:', fallbackTitle);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('Auto-title generation failed:', e?.message || e);
                                const firstUserMessage = updatedChatHistory.messages.find(m => m.role === 'user');
                                if (firstUserMessage) {
                                    const fallbackTitle = firstUserMessage.content.slice(0, 50).trim();
                                    if (fallbackTitle) {
                                        updatedChatHistory.name = fallbackTitle;
                                        await updatedChatHistory.save();
                                        console.log('Fallback title saved:', fallbackTitle);
                                    }
                                }
                            }
                        }
                        
                        console.log('Chat history saved successfully');
                    } catch (historyError) {
                        console.error('Error saving chat history:', historyError);
                    }
                }
                
                res.end();
                return;
                
            } catch (streamError) {
                console.error('Streaming error:', streamError);
                
                // Fallback to non-streaming response
                try {
                    console.log('Falling back to non-streaming response');
                    const fallbackResult = await ai.models.generateContent(modelConfig);
                    const fallbackText = fallbackResult.text;
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: 'done', 
                        content: fallbackText,
                        done: true 
                    })}\n\n`);
                    
                    // Save chat history with fallback response
                    if (userId) {
                        try {
                            const chatHistory = await ChatHistory.findOrCreateSession(userId, currentSessionId);
                            await chatHistory.addMessage('user', message);
                            await chatHistory.addMessage('assistant', fallbackText);
                            await chatHistory.save();
                            console.log('Fallback response saved to chat history');
                        } catch (historyError) {
                            console.error('Error saving fallback chat history:', historyError);
                        }
                    }
                    
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    res.write(`data: ${JSON.stringify({ 
                        type: 'error', 
                        content: 'AI service temporarily unavailable. Please try again.',
                        done: true 
                    })}\n\n`);
                }
                
                res.end();
                return;
            }
        }

        // Non-streaming response (original logic)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout - response taking too long')), 90000);
        });
        
        const apiCallPromise = ai.models.generateContent(modelConfig);
        
        const result = await Promise.race([apiCallPromise, timeoutPromise]);

        const responseText = result.text;
        console.log('Gemini API response received, length:', responseText ? responseText.length : 0);
        console.log('Response preview:', responseText ? responseText.substring(0, 100) + '...' : 'No response');

        // Save chat history if user is authenticated
        if (userId) {
            try {
                const chatHistory = await ChatHistory.findOrCreateSession(userId, currentSessionId);
                await chatHistory.addMessage('user', message);
                await chatHistory.addMessage('assistant', responseText);

                // Auto-title: if no name yet and at least two messages, generate a short title
                // Only generate title once per session to avoid overriding manual names
                // Refresh the chatHistory to get the latest message count
                await chatHistory.save();
                const updatedChatHistory = await ChatHistory.findById(chatHistory._id);
                
                console.log('Chat history check - Name:', updatedChatHistory.name, 'Message count:', updatedChatHistory.messages?.length);
                
                // Check if we should generate auto-title:
                // 1. No name yet, OR
                // 2. Name is a fallback pattern (Chat MM/DD/YYYY or New chat X)
                const isFallbackTitle = updatedChatHistory.name && (
                    updatedChatHistory.name.match(/^Chat \d{1,2}\/\d{1,2}\/\d{4}$/) || // Chat MM/DD/YYYY pattern
                    updatedChatHistory.name.match(/^New chat \d+$/) // New chat X pattern
                );
                
                if ((!updatedChatHistory.name || isFallbackTitle) && updatedChatHistory.messages && updatedChatHistory.messages.length >= 2) {
                    try {
                        console.log('Generating auto-title for session:', currentSessionId);
                        console.log('Current name:', updatedChatHistory.name, 'Is fallback:', isFallbackTitle);
                        const convoForTitle = updatedChatHistory.messages.slice(0, 8).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
                        const titlePrompt = `Create a short, descriptive title (4-7 words) for this real estate conversation. Focus on the main topic or question. Do not include quotes, just return the title.\n\nConversation:\n${convoForTitle}\n\nTitle:`;
                        
                        console.log('Title prompt:', titlePrompt);
                        console.log('AI model call starting...');
                        
                        const titleResult = await ai.models.generateContent({
                            model: 'gemini-2.0-flash-exp',
                            contents: [{ role: 'user', parts: [{ text: titlePrompt }] }]
                        });
                        console.log('AI model call completed');
                        
                        const titleRaw = titleResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        console.log('Raw title response:', titleRaw);
                        
                        const title = titleRaw.replace(/[\n\r"']+/g, ' ').slice(0, 80).trim();
                        console.log('Processed title:', title);
                        if (title && title.length > 0) {
                            updatedChatHistory.name = title;
                            await updatedChatHistory.save();
                            console.log('Auto-title saved successfully:', title);
                        } else {
                            console.warn('Generated title is empty or invalid, using fallback');
                            // Fallback: use first user message as title
                            const firstUserMessage = updatedChatHistory.messages.find(m => m.role === 'user');
                            if (firstUserMessage) {
                                const fallbackTitle = firstUserMessage.content.slice(0, 50).trim();
                                if (fallbackTitle) {
                                    updatedChatHistory.name = fallbackTitle;
                                    await updatedChatHistory.save();
                                    console.log('Fallback title saved:', fallbackTitle);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Auto-title generation failed:', e?.message || e);
                        // Fallback: use first user message as title
                        const firstUserMessage = updatedChatHistory.messages.find(m => m.role === 'user');
                        if (firstUserMessage) {
                            const fallbackTitle = firstUserMessage.content.slice(0, 50).trim();
                            if (fallbackTitle) {
                                updatedChatHistory.name = fallbackTitle;
                                await updatedChatHistory.save();
                                console.log('Fallback title saved:', fallbackTitle);
                            }
                        }
                    }
                }

                console.log('Chat history saved successfully');
            } catch (historyError) {
                console.error('Error saving chat history:', historyError);
                // Don't fail the request if history saving fails
            }
        }

        res.status(200).json({
            success: true,
            response: responseText,
            sessionId: currentSessionId
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        
        // Handle timeout errors first
        if (error.message && error.message.includes('timeout')) {
            return res.status(408).json({
                success: false,
                message: 'Request timed out. The response is taking longer than expected. Please try again.'
            });
        }

        // Handle specific Gemini errors
        if (error.response) {
            const status = error.response.status;
            const errorMessage = error.response.data?.error?.message || 'Gemini API error';
            
            if (status === 401) {
                return res.status(500).json({
                    success: false,
                    message: 'AI service authentication error. Please try again later.'
                });
            } else if (status === 429) {
                return res.status(429).json({
                    success: false,
                    message: 'AI service is currently busy. Please try again in a moment.'
                });
            } else if (status >= 500) {
                return res.status(503).json({
                    success: false,
                    message: 'AI service is temporarily unavailable. Please try again later.'
                });
            }
        }

        res.status(500).json({
            success: false,
            message: 'Sorry, I\'m having trouble processing your request. Please try again later.'
        });
    }
};

// Get user's chat sessions
export const getUserChatSessions = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const sessions = await ChatHistory.getUserSessions(userId);
        
        res.status(200).json({
            success: true,
            sessions: sessions
        });
    } catch (error) {
        console.error('Error getting chat sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chat sessions'
        });
    }
};

// Rate a message
export const rateMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { sessionId, messageIndex, messageTimestamp, rating, messageContent, messageRole, feedback } = req.body;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!sessionId || messageIndex === undefined || !messageTimestamp || !rating || !messageContent || !messageRole) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (!['up', 'down'].includes(rating)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid rating value'
            });
        }

        // Upsert rating (update if exists, create if not)
        const ratingData = await MessageRating.findOneAndUpdate(
            {
                userId,
                sessionId,
                messageIndex,
                messageTimestamp: new Date(messageTimestamp)
            },
            {
                userId,
                sessionId,
                messageIndex,
                messageTimestamp: new Date(messageTimestamp),
                rating,
                messageContent,
                messageRole,
                feedback: typeof feedback === 'string' ? feedback.slice(0, 500) : ''
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Rating saved successfully',
            rating: ratingData
        });
    } catch (error) {
        console.error('Error rating message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save rating'
        });
    }
};

// Get message ratings for a session
export const getMessageRatings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { sessionId } = req.params;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const ratings = await MessageRating.find({
            userId,
            sessionId
        }).select('messageIndex messageTimestamp rating');

        // Convert to object format for frontend
        const ratingsObj = {};
        ratings.forEach(rating => {
            const key = `${rating.messageIndex}_${rating.messageTimestamp.toISOString()}`;
            ratingsObj[key] = rating.rating;
        });

        res.status(200).json({
            success: true,
            ratings: ratingsObj
        });
    } catch (error) {
        console.error('Error getting message ratings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve ratings'
        });
    }
};

// Admin: Get all ratings across users (optionally filterable)
export const getAllMessageRatings = async (req, res) => {
    try {
        // Only admins/rootadmins allowed
        const role = req.user?.role;
        if (role !== 'admin' && role !== 'rootadmin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { limit = 200, days = 30 } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - Math.max(0, parseInt(days)));

        const ratings = await MessageRating.find({
            type: 'rating',
            createdAt: { $gte: since }
        })
            .sort({ createdAt: -1 })
            .limit(Math.min(1000, Math.max(1, parseInt(limit))))
            .populate('userId', 'username email role');

        const results = ratings.map(r => ({
            id: r._id,
            user: {
                id: r.userId?._id,
                username: r.userId?.username || null,
                email: r.userId?.email || null,
                role: r.userId?.role || null
            },
            sessionId: r.sessionId,
            messageIndex: r.messageIndex,
            messageTimestamp: r.messageTimestamp,
            rating: r.rating,
            feedback: r.feedback || '',
            messageContent: r.messageContent,
            messageRole: r.messageRole,
            createdAt: r.createdAt
        }));

        res.status(200).json({ success: true, ratings: results });
    } catch (error) {
        console.error('Error getting all message ratings:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve ratings' });
    }
};

// Create a new chat session
export const createNewSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Generate new session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create new chat history with default welcome message
        const defaultMessage = {
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you with your real estate needs today?',
            timestamp: new Date().toISOString()
        };

        const chatHistory = new ChatHistory({
            userId,
            sessionId: newSessionId,
            messages: [defaultMessage],
            totalMessages: 1
        });

        await chatHistory.save();

        res.status(200).json({
            success: true,
            sessionId: newSessionId,
            message: 'New session created successfully'
        });
    } catch (error) {
        console.error('Error creating new session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create new session'
        });
    }
};

// Delete a chat session
export const deleteSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { sessionId } = req.params;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Delete the chat history
        const result = await ChatHistory.findOneAndDelete({
            userId,
            sessionId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Also delete associated ratings
        await MessageRating.deleteMany({
            userId,
            sessionId
        });

        res.status(200).json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session'
        });
    }
};

// Delete all chat sessions for the authenticated user
export const deleteAllSessions = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Delete all chat histories for the user
        const deleteHistoryResult = await ChatHistory.deleteMany({ userId });

        // Delete all associated ratings
        const deleteRatingsResult = await MessageRating.deleteMany({ userId });

        res.status(200).json({
            success: true,
            message: 'All chats deleted successfully',
            deleted: {
                chats: deleteHistoryResult.deletedCount || 0,
                ratings: deleteRatingsResult.deletedCount || 0
            }
        });
    } catch (error) {
        console.error('Error deleting all sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete all chats'
        });
    }
};

// Bookmark a message
export const bookmarkMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { sessionId, messageIndex, messageTimestamp, messageContent, messageRole } = req.body;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!sessionId || messageIndex === undefined || !messageTimestamp || !messageContent) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Upsert bookmark (update if exists, create if not)
        const bookmark = await MessageRating.findOneAndUpdate(
            {
                userId,
                sessionId,
                messageIndex,
                messageTimestamp: new Date(messageTimestamp),
                type: 'bookmark'
            },
            {
                userId,
                sessionId,
                messageIndex,
                messageTimestamp: new Date(messageTimestamp),
                messageContent,
                messageRole,
                type: 'bookmark',
                rating: 'bookmarked'
            },
            {
                upsert: true,
                new: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Message bookmarked successfully'
        });
    } catch (error) {
        console.error('Error bookmarking message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bookmark message'
        });
    }
};

// Remove bookmark from a message
export const removeBookmark = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { sessionId, messageIndex, messageTimestamp } = req.body;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!sessionId || messageIndex === undefined || !messageTimestamp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Remove bookmark
        const result = await MessageRating.findOneAndDelete({
            userId,
            sessionId,
            messageIndex,
            messageTimestamp: new Date(messageTimestamp),
            type: 'bookmark'
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bookmark removed successfully'
        });
    } catch (error) {
        console.error('Error removing bookmark:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove bookmark'
        });
    }
};

// Get bookmarked messages for a session
export const getBookmarkedMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { sessionId } = req.params;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const bookmarks = await MessageRating.find({
            userId,
            sessionId,
            type: 'bookmark'
        }).sort({ messageTimestamp: -1 });

        res.status(200).json({
            success: true,
            bookmarks: bookmarks
        });
    } catch (error) {
        console.error('Error getting bookmarked messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get bookmarked messages'
        });
    }
};
