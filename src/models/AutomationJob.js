import mongoose from 'mongoose';

const automationJobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    uploadFile: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending',
    },
}, { timestamps: true });

const AutomationJob = mongoose.model('AutomationJob', automationJobSchema);
export default AutomationJob;
