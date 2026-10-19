
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
    {
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, default: '', maxlength: 5000 },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, default: 'todo' },
        order: { type: Number, default: 0 },
        priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        startDate: Date,
        dueDate: Date,
        reminderAt: Date,
        reminderSent: { type: Boolean, default: false },
        overdueNotified: { type: Boolean, default: false },
        completedAt: Date,
    },
    { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task = mongoose.model('Task', taskSchema);
export default Task;