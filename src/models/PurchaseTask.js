import mongoose from 'mongoose';

const purchaseTaskSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AutomationJob',
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    productLink: {
        type: String,
        required: true,
    },
    name: {
        type: String,
    },
    phone: {
        type: String,
    },
    pincode: {
        type: String,
    },
    city: {
        type: String,
    },
    address: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    landmark: {
        type: String,
    },
    altPhone: {
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

const PurchaseTask = mongoose.model('PurchaseTask', purchaseTaskSchema);
export default PurchaseTask;
