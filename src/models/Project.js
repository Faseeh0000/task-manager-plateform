import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        title: { type: String, required: true },
        order: Number
    },
    { _id: false }
);

const memberSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        projectRole: { type: String, default: 'Member', trim: true },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, default: '', maxlength: 2000 },
        manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        members: [memberSchema],
        columns: {
            type: [columnSchema],
            default: [
                { key: 'todo', title: 'To Do', order: 0 },
                { key: 'in_progress', title: 'In Progress', order: 1 },
                { key: 'review', title: 'Review', order: 2 },
                { key: 'done', title: 'Done', order: 3 },
            ],
        },
        chatRoomEnabled: { type: Boolean, default: false },
        status: { type: String, enum: ['active', 'archived'], default: 'active' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

projectSchema.index({ 'members.user': 1 });
projectSchema.index({ name: 'text', description: 'text' });

const Project = mongoose.model('Project', projectSchema);

export default Project;