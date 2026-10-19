import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const ROLES = ['admin', 'manager', 'user'];

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        default: null,
        trim: true,
        minlength: 2,
        maxlength: 60,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        default: null,
        minlength: 8,
    },
    role: {
        type: String,
        enum: ROLES,
        default: "user",
    },
    googleId: {
        type: String,
        default: null,
        unique: true,
        sparse: true,
    },
    githubId: {
        type: String,
        default: null,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    subscriptionPlan: {
        type: String,
        enum: ["Free", "Starter", "Pro", "Enterprise"],
        default: "Free",
    },
    subscriptionStatus: {
        type: String,
        enum: ["Active", "Inactive", "Cancelled", "Suspended"],
        default: "Inactive",
    },
    subscriptionEndDate: {
        type: Date,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    tasks: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Task",
        default: [],
    },
    projects: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Project",
        default: [],
    },
    notifications: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Notification",
        default: [],
    },
}, { timestamps: true });

UserSchema.index({ name: 'text', email: 'text' });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchema.methods.comparePassword = function (plain) {
    if (!this.password) return false;
    return bcrypt.compareSync(plain, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;

