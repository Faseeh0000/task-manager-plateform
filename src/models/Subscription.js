
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
    {
        manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        stripeSubscriptionId: { type: String, index: true },
        stripeCustomerId: String,
        status: {
            type: String,
            enum: ['active', 'past_due', 'canceled', 'expired', 'none'],
            default: 'none',
        },
        plan: { type: String, default: 'manager_pro' },
        currentPeriodStart: Date,
        currentPeriodEnd: Date,
        expiryWarningSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// A subscription only counts if status is active AND the period hasn't ended.
subscriptionSchema.methods.isValid = function () {
    return this.status === 'active' && this.currentPeriodEnd && this.currentPeriodEnd > new Date();
};


const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;

