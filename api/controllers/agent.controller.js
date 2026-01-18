import Agent from "../models/agent.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import { sendAgentApprovalEmail, sendAgentRejectionEmail, sendAgentRevokedEmail } from "../utils/emailService.js";

// --- Public Endpoints ---

// Get all agents (Public) - supports search & filtering
export const getAgents = async (req, res, next) => {
    try {
        const { city, search, sort, limit = 20, page = 1 } = req.query;

        // Base query: Only approved agents
        const query = { status: "approved" };

        if (city) {
            query.city = { $regex: city, $options: "i" };
        }

        if (search) {
            // Regex search for Partial Matches on Name, Areas, Agency, etc.
            const searchRegex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'i');
            query.$or = [
                { name: searchRegex },
                { areas: searchRegex },
                { agencyName: searchRegex },
                { about: searchRegex }
            ];
        }

        // Pagination
        const limitNum = parseInt(limit);
        const start = (parseInt(page) - 1) * limitNum;

        // Sorting
        let sortOptions = { createdAt: -1 }; // Default new
        if (sort === 'rating') sortOptions = { rating: -1 };
        if (sort === 'experience') sortOptions = { experience: -1 };

        const agents = await Agent.find(query)
            .sort(sortOptions)
            .limit(limitNum)
            .skip(start);

        const total = await Agent.countDocuments(query);

        res.status(200).json({
            agents,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        next(error);
    }
};

// Get single agent profile (Public)
export const getAgent = async (req, res, next) => {
    try {
        const { id } = req.params;
        // We might accept ID or UserID, but usually _id of Agent doc
        const agent = await Agent.findById(id).populate('userId', 'username email avatar');

        if (!agent) return next(errorHandler(404, "Agent not found"));

        // Only show if approved or if the requester is the agent themselves or admin
        // (For public view, strictly approved)
        const isOwner = req.user && req.user.id === agent.userId._id.toString();
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'rootadmin');

        if (agent.status !== 'approved' && !isOwner && !isAdmin) {
            return next(errorHandler(403, "Agent profile is not currently active"));
        }

        res.status(200).json(agent);
    } catch (error) {
        next(error);
    }
};

// --- User Actions ---

// Apply to become an agent
export const applyAgent = async (req, res, next) => {
    try {
        const { name, mobileNumber, city, areas, experience, about, reraId, agencyName, photo, idProof } = req.body;

        // Check if user already has an application
        const existing = await Agent.findOne({ userId: req.user.id });
        if (existing) {
            if (existing.status === 'pending') return next(errorHandler(400, "You already have a pending application"));
            if (existing.status === 'approved') return next(errorHandler(400, "You are already a registered agent"));
            // if rejected, they might re-apply. For simplicity, let's allow updating rejected applications via update endpoint or basic Re-apply here
            // But for now, returning status
            return next(errorHandler(400, "You have an existing agent profile. Please check status."));
        }

        const newAgent = new Agent({
            userId: req.user.id,
            email: req.user.email, // Auto-fill email from account
            name,
            mobileNumber,
            city,
            areas: areas || [],
            experience: parseInt(experience) || 0,
            about,
            reraId,
            agencyName,
            photo,
            idProof,
            status: 'pending'
        });

        await newAgent.save();
        res.status(201).json(newAgent);
    } catch (error) {
        next(error);
    }
};

// Check current user's agent status
export const checkMyAgentStatus = async (req, res, next) => {
    try {
        const agent = await Agent.findOne({ userId: req.user.id });
        if (!agent) {
            return res.status(200).json({ isAgent: false, status: null });
        }
        res.status(200).json({ isAgent: true, status: agent.status, agentId: agent._id });
    } catch (error) {
        next(error);
    }
}

// --- Admin Actions ---

// Get all agents (Admin)
export const getAllAgentsAdmin = async (req, res, next) => {
    try {
        // Admin wants to see all: pending, approved, rejected
        const agents = await Agent.find().populate('userId', 'username email').sort({ createdAt: -1 });
        res.status(200).json(agents);
    } catch (error) {
        next(error);
    }
};

// Update status (Approve/Reject)
export const updateAgentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return next(errorHandler(400, "Invalid status"));
        }

        const agent = await Agent.findById(id);
        if (!agent) return next(errorHandler(404, "Agent not found"));

        const previousStatus = agent.status;

        agent.status = status;
        if (status === 'rejected' && rejectionReason) {
            agent.rejectionReason = rejectionReason;
        }
        if (status === 'approved') {
            agent.isVerified = true;
        }

        await agent.save();

        // Send automated emails
        try {
            if (status === 'approved') {
                await sendAgentApprovalEmail(agent.email, agent.name);
            } else if (status === 'rejected') {
                if (previousStatus === 'approved') {
                    // Revocation
                    await sendAgentRevokedEmail(agent.email, agent.name, rejectionReason);
                } else {
                    // Application Rejection
                    await sendAgentRejectionEmail(agent.email, agent.name, rejectionReason);
                }
            }
        } catch (emailError) {
            console.error('Failed to send agent status email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(200).json(agent);
    } catch (error) {
        next(error);
    }
};

// Delete agent (Admin)
export const deleteAgent = async (req, res, next) => {
    try {
        await Agent.findByIdAndDelete(req.params.id);
        res.status(200).json("Agent deleted successfully");
    } catch (error) {
        next(error);
    }
}
