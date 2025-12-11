import ReportMessage from '../models/reportMessage.model.js';
import { errorHandler } from '../utils/error.js';

export const createReport = async (req, res, next) => {
    try {
        const { messageId, messageContent, prompt, category, subCategory, description, priority } = req.body;

        if (!messageId || !messageContent || !category || !subCategory || !description) {
            return next(errorHandler(400, 'All fields are required'));
        }

        //     if (!messageId || !messageContent || !category || !subCategory || !description) {
        //         return next(errorHandler(400, 'All fields are required'));
        //     }

        const newReport = new ReportMessage({
            messageId,
            messageContent,
            prompt,
            reportedBy: req.user ? req.user.id : null,
            category,
            subCategory,
            description,
            priority: priority || 'medium',
        });

        await newReport.save();
        res.status(201).json(newReport);
    } catch (error) {
        next(error);
    }
};

export const getReports = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to view reports'));
        }

        const start = parseInt(req.query.start) || 0;
        const limit = parseInt(req.query.limit) || 9;
        const sortDirection = req.query.sort === 'asc' ? 1 : -1;

        const query = {};
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        const reports = await ReportMessage.find(query)
            .populate('reportedBy', 'username email profilePicture')
            .sort({ updatedAt: sortDirection })
            .skip(start)
            .limit(limit);

        const totalReports = await ReportMessage.countDocuments(query);

        const now = new Date();
        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
        );

        const lastMonthReports = await ReportMessage.countDocuments({
            createdAt: { $gte: oneMonthAgo },
        });

        res.status(200).json({
            reports,
            totalReports,
            lastMonthReports,
        });
    } catch (error) {
        next(error);
    }
};

export const updateReportStatus = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to update reports'));
        }

        const { status, adminNotes } = req.body;

        const updatedReport = await ReportMessage.findByIdAndUpdate(
            req.params.reportId,
            {
                $set: {
                    status,
                    adminNotes,
                },
            },
            { new: true }
        );

        res.status(200).json(updatedReport);
    } catch (error) {
        next(error);
    }
};

export const deleteReport = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to delete reports'));
        }
        await ReportMessage.findByIdAndDelete(req.params.reportId);
        res.status(200).json({ success: true, message: 'The report has been deleted' });
    } catch (error) {
        next(error);
    }
};
