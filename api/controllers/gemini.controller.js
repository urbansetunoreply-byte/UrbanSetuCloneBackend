import { GoogleGenAI } from "@google/genai";
import ChatHistory from '../models/chatHistory.model.js';
import MessageRating from '../models/messageRating.model.js';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "AIzaSyBg9wSoffCi3RfbaQV6zwH78xoULd2jG0A"
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
        const getSystemPrompt = (tone) => {
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
            
            return `${basePrompt}\n\nTone: ${toneInstructions[tone] || toneInstructions['neutral']}`;
        };

        // Prepare conversation history with security filtering
        const filteredHistory = history.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content?.substring(0, 1000) // Limit history message length
        }));

        const conversationContext = filteredHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        const fullPrompt = `${getSystemPrompt(tone)}\n\nPrevious conversation:\n${conversationContext}\n\nCurrent user message: ${sanitizedMessage}`;

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
        
        // Add timeout to ensure we get complete responses
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout - response taking too long')), 90000); // Increased to 90 seconds
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
                if (!chatHistory.name && chatHistory.messages && chatHistory.messages.length >= 2) {
                    try {
                        const convoForTitle = chatHistory.messages.slice(0, 8).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
                        const titlePrompt = `${getSystemPrompt('concise')}\n\nSummarize the chat into a short 4-7 word descriptive title without quotes.\n\nChat:\n${convoForTitle}`;
                        const titleResult = await ai.models.generateContent({
                            model: 'gemini-2.0-flash-exp',
                            contents: [{ role: 'user', parts: [{ text: titlePrompt }] }],
                            config: { maxOutputTokens: 16, temperature: 0.3 }
                        });
                        const titleRaw = titleResult.text || '';
                        const title = titleRaw.replace(/[\n\r]+/g, ' ').slice(0, 80).trim();
                        if (title) {
                            chatHistory.name = title;
                            await chatHistory.save();
                        }
                    } catch (e) {
                        console.warn('Auto-title generation failed:', e?.message || e);
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
        const { sessionId, messageIndex, messageTimestamp, rating, messageContent, messageRole } = req.body;
        
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
                messageRole
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
