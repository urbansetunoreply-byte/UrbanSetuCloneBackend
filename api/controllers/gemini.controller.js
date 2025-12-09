import { Groq } from 'groq-sdk';
import ChatHistory from '../models/chatHistory.model.js';
import MessageRating from '../models/messageRating.model.js';
import { getRelevantCachedData, needsReindexing, indexAllWebsiteData } from '../services/dataSyncService.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// Using Llama 3.3 70B Versatile as the primary model
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groq = new Groq({
    apiKey: GROQ_API_KEY
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
            maxTokens = '2048',
            enableStreaming = true,
            contextWindow = '10',
            selectedProperties
        } = req.body;
        const userId = req.user?.id;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

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
            const basePrompt = `You are an advanced AI assistant specializing in real estate. You provide comprehensive help with:

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
            const websiteData = getRelevantCachedData(userMessage, selectedProperties || []);

            return `${basePrompt}

CURRENT WEBSITE DATA (UrbanSetu):
${websiteData}

IMPORTANT INSTRUCTIONS:
- Always reference specific properties, articles, or FAQs from the website data when relevant
- Provide exact property details (prices, locations, amenities) from the data
- If user asks about properties, show them the actual listings from our website
- If user asks general real estate questions, provide general advice but also mention relevant content from our website
- Always maintain a professional tone and encourage users to contact us for more details
- IMPORTANT: Return the response in Markdown format. Use bold, italics, lists, and code blocks where appropriate to make the response easy to read.

Tone: ${toneInstructions[tone] || toneInstructions['neutral']}`;
        };

        // Prepare conversation history with security filtering using contextWindow
        const contextWindowSize = parseInt(contextWindow) || 10;
        const filteredHistory = history.slice(-contextWindowSize).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user', // Groq uses 'assistant' not 'model'
            content: msg.content?.substring(0, 1000) // Limit history message length
        }));

        const systemPrompt = await getSystemPrompt(tone, sanitizedMessage);

        console.log('Calling Groq API, tone:', tone, 'responseLength:', responseLength, 'creativity:', creativity);

        // Helper functions for AI settings
        const getMaxTokens = (responseLength) => {
            switch (responseLength) {
                case 'short': return 1024;
                case 'long': return 8192;
                default: return 4096; // medium
            }
        };

        const getTemperature = (creativity, tone, customTemp) => {
            if (customTemp && !isNaN(parseFloat(customTemp))) {
                return Math.max(0.1, Math.min(2.0, parseFloat(customTemp)));
            }
            const baseTemp = tone === 'concise' ? 0.3 : (tone === 'formal' ? 0.5 : 0.7);
            switch (creativity) {
                case 'conservative': return Math.max(baseTemp - 0.2, 0.1);
                case 'creative': return Math.min(baseTemp + 0.3, 1.2); // Groq allows temp > 1
                default: return baseTemp;
            }
        };

        const getTopP = (customTopP) => {
            if (customTopP && !isNaN(parseFloat(customTopP))) {
                return Math.max(0.1, Math.min(1.0, parseFloat(customTopP)));
            }
            return 1.0; // Default for Groq
        };

        // Check if Groq API key is configured
        if (!GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Groq API key is not configured. Please set GROQ_API_KEY in environment variables.'
            });
        }

        // Build messages array for Groq
        const messages = [];

        // Add system prompt
        messages.push({
            role: 'system',
            content: systemPrompt
        });

        // Add history
        filteredHistory.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        // Add current user message
        messages.push({
            role: 'user',
            content: sanitizedMessage
        });

        const requestPayload = {
            messages: messages,
            model: GROQ_MODEL,
            temperature: getTemperature(creativity, tone, temperature),
            max_completion_tokens: getMaxTokens(responseLength),
            top_p: getTopP(topP),
            stream: enableStreaming === true || enableStreaming === 'true',
            stop: null
        };

        // Handle streaming vs non-streaming responses
        if (enableStreaming === true || enableStreaming === 'true') {
            console.log('Streaming enabled - setting up Groq streaming response');

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
                const stream = await groq.chat.completions.create(requestPayload);
                let fullResponse = '';

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        fullResponse += content;
                        res.write(`data: ${JSON.stringify({
                            type: 'chunk',
                            content: content,
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

                // Save chat history
                if (userId) {
                    (async () => {
                        try {
                            const chatHistory = await ChatHistory.findOrCreateSession(userId, currentSessionId);
                            await chatHistory.addMessage('user', message);
                            await chatHistory.addMessage('assistant', fullResponse);
                            await chatHistory.save();

                            // Auto-title generation
                            const updatedChatHistory = await ChatHistory.findById(chatHistory._id);
                            const isFallbackTitle = updatedChatHistory.name && (
                                updatedChatHistory.name.match(/^Chat \d{1,2}\/\d{1,2}\/\d{4}$/) ||
                                updatedChatHistory.name.match(/^New chat \d+$/)
                            );

                            if ((!updatedChatHistory.name || isFallbackTitle) && updatedChatHistory.messages && updatedChatHistory.messages.length >= 2) {
                                try {
                                    const convoForTitle = updatedChatHistory.messages.slice(0, 8).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
                                    const titlePrompt = `Create a short, descriptive title (4-7 words) for this real estate conversation. Focus on the main topic or question. Do not include quotes, just return the title.\n\nConversation:\n${convoForTitle}\n\nTitle:`;

                                    const titleResponse = await groq.chat.completions.create({
                                        messages: [
                                            { role: 'system', content: 'You are a helpful assistant that creates short, descriptive titles.' },
                                            { role: 'user', content: titlePrompt }
                                        ],
                                        model: GROQ_MODEL,
                                        max_completion_tokens: 50,
                                        temperature: 0.5
                                    });

                                    const titleRaw = titleResponse.choices[0]?.message?.content || '';
                                    const title = titleRaw.replace(/[\n\r"']+/g, ' ').slice(0, 80).trim();

                                    if (title && title.length > 0) {
                                        updatedChatHistory.name = title;
                                        await updatedChatHistory.save();
                                    }
                                } catch (e) {
                                    console.error('Auto-title generation failed:', e);
                                }
                            }
                        } catch (historyError) {
                            console.error('Error saving chat history:', historyError);
                        }
                    })();
                }

                res.end();

            } catch (streamError) {
                console.error('Streaming error:', streamError);
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    content: 'AI service temporarily unavailable. Please try again.',
                    done: true
                })}\n\n`);
                res.end();
            }
            return;
        }

        // Non-streaming response
        const completion = await groq.chat.completions.create({ ...requestPayload, stream: false });
        const responseText = completion.choices[0]?.message?.content || '';

        // Save chat history if user is authenticated
        if (userId) {
            try {
                const chatHistory = await ChatHistory.findOrCreateSession(userId, currentSessionId);
                await chatHistory.addMessage('user', message);
                await chatHistory.addMessage('assistant', responseText);
                await chatHistory.save();

                // Auto-title generation (same logic as above)
                const updatedChatHistory = await ChatHistory.findById(chatHistory._id);
                const isFallbackTitle = updatedChatHistory.name && (
                    updatedChatHistory.name.match(/^Chat \d{1,2}\/\d{1,2}\/\d{4}$/) ||
                    updatedChatHistory.name.match(/^New chat \d+$/)
                );

                if ((!updatedChatHistory.name || isFallbackTitle) && updatedChatHistory.messages && updatedChatHistory.messages.length >= 2) {
                    // ... (Auto title logic would go here, simplified for non-streaming to avoid duplication if unnecessary, but can be added if needed)
                }
            } catch (historyError) {
                console.error('Error saving chat history:', historyError);
            }
        }

        res.status(200).json({
            success: true,
            response: responseText,
            sessionId: currentSessionId
        });

    } catch (error) {
        console.error('Groq API Error:', error);
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
            content: 'Hello! I\'m your AI assistant Powered by Groq. How can I help you with your real estate needs today?',
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
