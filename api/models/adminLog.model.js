import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    targetModel: {
        type: String, // 'User', 'Listing', etc.
        required: false
    },
    details: {
        type: String,
        required: false
    },
    ip: String,
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

const AdminLog = mongoose.model("AdminLog", adminLogSchema);
export default AdminLog;
