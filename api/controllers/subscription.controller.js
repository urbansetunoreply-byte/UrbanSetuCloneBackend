import Subscription from '../models/subscription.model.js';
import { errorHandler } from '../utils/error.js';

export const subscribeToNewsletter = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(errorHandler(400, 'Email is required'));
    }

    try {
        const existingSubscription = await Subscription.findOne({ email });

        if (existingSubscription) {
            if (!existingSubscription.isActive) {
                existingSubscription.isActive = true;
                await existingSubscription.save();
                return res.status(200).json({ success: true, message: 'Welcome back! You have successfully resubscribed.' });
            }
            return res.status(200).json({ success: true, message: 'You are already subscribed!' });
        }

        const newSubscription = new Subscription({ email });
        await newSubscription.save();

        res.status(201).json({ success: true, message: 'Successfully subscribed to Real Estate Insights!' });
    } catch (error) {
        next(error);
    }
};

export const getAllSubscribers = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
        return next(errorHandler(403, 'Forbidden'));
    }

    try {
        const subscribers = await Subscription.find().sort({ subscribedAt: -1 });
        res.status(200).json({ success: true, data: subscribers });
    } catch (error) {
        next(error);
    }
};
