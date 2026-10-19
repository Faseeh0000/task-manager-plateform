
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: ['task_assigned', 'task_reminder', 'task_overdue', 'task_updated', 'project_added', 'subscription', 'system'],
            default: 'system',
        },
        title: { type: String, required: true },
        body: { type: String, default: '' },
        link: String,
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

