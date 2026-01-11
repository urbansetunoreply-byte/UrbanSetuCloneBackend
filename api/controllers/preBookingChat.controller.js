import PreBookingChat from '../models/preBookingChat.model.js';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { sendPreBookingMessageNotification } from '../utils/emailService.js';

export const initiateOrGetChat = async (req, res, next) => {
    try {
        const { listingId, ownerId } = req.body;
        const userId = req.user.id; // From verifyToken middleware

        if (!listingId || !ownerId) {
            return res.status(400).json({ success: false, message: 'Missing listingId or ownerId' });
        }

        if (userId === ownerId) {
            return res.status(400).json({ success: false, message: 'You cannot chat with yourself' });
        }

        // Check if chat exists
        let chat = await PreBookingChat.findOne({
            listingId,
            participants: { $all: [userId, ownerId] }
        })
            .populate('participants', 'username avatar email')
            .populate('listingId', 'name address imageSqft');

        if (!chat) {
            // Create new chat
            chat = new PreBookingChat({
                participants: [userId, ownerId],
                listingId,
                ownerId,
                messages: []
            });
            await chat.save();
            // Populate after save
            chat = await PreBookingChat.findById(chat._id)
                .populate('participants', 'username avatar email')
                .populate('listingId', 'name address imageSqft');
        }

        res.status(200).json({ success: true, chat });
    } catch (error) {
        next(error);
    }
};

export const sendMessage = async (req, res, next) => {
    try {
        const { chatId, content } = req.body;
        const senderId = req.user.id;

        if (!chatId || !content) {
            return res.status(400).json({ success: false, message: 'Missing chatId or content' });
        }

        const chat = await PreBookingChat.findById(chatId)
            .populate('participants', 'username email')
            .populate('listingId', 'name _id');

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        // Verify participant
        if (!chat.participants.some(p => p._id.toString() === senderId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const newMessage = {
            sender: senderId,
            content,
            timestamp: new Date(),
            read: false
        };

        chat.messages.push(newMessage);
        chat.lastMessage = {
            content,
            timestamp: newMessage.timestamp,
            sender: senderId,
            read: false
        };

        await chat.save();

        // Socket Emission
        const io = req.app.get('io');
        const recipientId = chat.participants.find(p => p._id.toString() !== senderId)._id.toString();

        // Emit to recipient's room
        io.to(recipientId).emit('pre_booking_message', {
            chatId: chat._id,
            message: newMessage,
            listingId: chat.listingId._id,
            senderId
        });

        // Also emit to sender (for multi-device sync)
        io.to(senderId).emit('pre_booking_message', {
            chatId: chat._id,
            message: newMessage,
            listingId: chat.listingId._id,
            senderId
        });

        // Email Notification
        const recipient = chat.participants.find(p => p._id.toString() === recipientId);
        const sender = chat.participants.find(p => p._id.toString() === senderId);

        if (recipient && sender) {
            // Check if recipient is online
            // We use the same room ID ('recipientId') that we emitted to above
            const recipientSocketRoom = io.sockets.adapter.rooms.get(recipientId);
            const isRecipientOnline = recipientSocketRoom && recipientSocketRoom.size > 0;

            // Only send email if recipient is OFFLINE
            if (!isRecipientOnline) {
                // Construct property link (assuming client structure)
                const propertyLink = `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${chat.listingId._id}`;

                // We don't await email to avoid delaying response
                sendPreBookingMessageNotification(
                    recipient.email,
                    recipient.username,
                    sender.username,
                    chat.listingId.name,
                    content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    propertyLink
                ).catch(err => console.error('Email sending failed:', err));
            }
        }

        res.status(200).json({ success: true, message: newMessage });
    } catch (error) {
        next(error);
    }
};

export const getUserChats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Get all chats where user is a participant
        const chats = await PreBookingChat.find({ participants: userId })
            .populate('participants', 'username avatar email')
            .populate('listingId', 'name address imageSqft')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, chats });
    } catch (error) {
        next(error);
    }
};

export const getChatDetails = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await PreBookingChat.findById(chatId)
            .populate('participants', 'username avatar email')
            .populate('listingId', 'name address imageSqft');

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        if (!chat.participants.some(p => p._id.toString() === userId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Mark messages as read if receiver is viewing
        let updated = false;
        chat.messages.forEach(msg => {
            if (msg.sender.toString() !== userId && !msg.read) {
                msg.read = true;
                updated = true;
            }
        });

        if (updated) {
            // If we modified messages array directly, we can save. 
            // Mongoose detects subdocument changes.
            if (chat.lastMessage && chat.lastMessage.sender.toString() !== userId) {
                chat.lastMessage.read = true;
            }
            await chat.save();
        }

        res.status(200).json({ success: true, chat });
    } catch (error) {
        next(error);
    }
};

export const clearChat = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const chat = await PreBookingChat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        if (!chat.participants.some(p => p._id.toString() === userId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        chat.messages = [];
        chat.lastMessage = null;
        await chat.save();

        // Notify via socket
        const io = req.app.get('io');
        chat.participants.forEach(p => {
            io.to(p._id.toString()).emit('chat_cleared', { chatId });
        });

        res.status(200).json({ success: true, message: 'Chat cleared' });

    } catch (error) {
        next(error);
    }
}
