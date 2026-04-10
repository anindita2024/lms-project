import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    fileType: {
        type: String,
        enum: ['lecture', 'note', 'book'],
        required: true
    },
    /* filePath stores the location of the file in your public/uploads folder */
    filePath: {
        type: String,
        required: true
    },
    /* This links the file to a specific Course from your lms.js model */
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lms',
        required: true
    },
    /* This tracks which Admin performed the upload */
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Resource = mongoose.model('Resource', ResourceSchema);
export default Resource;