import mongoose from "mongoose";

const LmsSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    instructor: { type: String, required: true },
    price: { type: Number, default: 0 },
    thumbnail: { type: String }, // URL to an image
    duration: { type: String },  // e.g., "10 Hours"
    enrolledStudents: { type: Number, default: 0 },
    category: { type: String },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    createdAt: { type: Date, default: Date.now }
});

const lms = mongoose.model('lms', LmsSchema);
export default lms;