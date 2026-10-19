import mongoose from "mongoose";

const VerificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
        trim: true,
    },
    codeHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // auto deleted from mongodb when expires
    }
}, { timestamps: true });

const VerificationCode = mongoose.model("VerificationCode", VerificationCodeSchema);
export default VerificationCode;
