import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    /* The 'role' field is what makes your system work.
       It defaults to 'student'. 
       You will manually set one account to 'admin'.
    */
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    /* This allows you to track which courses a student has joined */
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lms'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);
export default User;