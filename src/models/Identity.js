import mongoose from "mongoose";

const IdentitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    provider: {
        type: String,
        required: true,
    },
    providerId: {
        type: String,
        required: true,
    },
    profile: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    }
}, { timestamps: true });

IdentitySchema.index({ provider: 1, providerId: 1 }, { unique: true });

const Identity = mongoose.model("Identity", IdentitySchema);
export default Identity;
