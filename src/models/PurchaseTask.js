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
    productlink: {
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
    addressline2: {
        type: String,
    },
    addressline1: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    landmark: {
        type: String,
    },
    alternatephone: {
        type: String,
    },
    accountid: {
        type: String,
    },
    orderId: {
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
