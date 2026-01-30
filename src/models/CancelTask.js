import mongoose from 'mongoose';

const cancelTaskSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AutomationJob',
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    reasonvalue: {
        type: String,
    },
    reasontext: {
        type: String,
    },
    seller: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    reason: {
        type: String,
    },
}, { timestamps: true });

const CancelTask = mongoose.model('CancelTask', cancelTaskSchema);
export default CancelTask;
