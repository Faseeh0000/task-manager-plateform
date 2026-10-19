import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    userAgent: {
        type: String,
        default: null,
    },
    ip: {
        type: String,
        default: null,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }

}, { timestamps: true });

const Session = mongoose.model("Session", SessionSchema);
export default Session;
