import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';

// Internal Imports
import connectDB from './db.js';
import User from './models/user.js';
import Lms from './models/lms.js';
import Resource from './models/resource.js';
import { isAuthenticated, isAdmin } from './middleware/auth.js';

const app = express();

// Database & View Engine
connectDB();
app.set('view engine', 'ejs');

// Robust Static File Handling
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));
// ADD THIS LINE - It is required for the Chatbot
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Logic
app.use(session({
    secret: process.env.SESSION_SECRET || 'lms_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Share user status with all EJS files
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Multer Storage for Uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- ROUTES ---

// 1. Home Page
app.get('/', async (req, res) => {
    try {
        const courses = await Lms.find();
        res.render('home', { courses });
    } catch (err) {
        res.status(500).send("Error loading home page");
    }
});

// 2. Authentication
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'student'
        });
        res.redirect('/login');
    } catch (err) {
        res.send("Registration Error: Email might already exist.");
    }
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.user = {
                    id: user._id,
                    username: user.username,
                    role: user.role
                };
                return res.redirect('/');
            }
        }
        res.send("Invalid Credentials");
    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 3. Admin Upload (Updated Logic)
app.get('/upload', isAdmin, async (req, res) => {
    const courses = await Lms.find();
    res.render('upload', { courses });
});

app.post('/upload', isAdmin, upload.single('resourceFile'), async (req, res) => {
    try {
        let targetCourseId = req.body.courseId;

        // 1. Create Course if it's a new one
        if (req.body.newCourseName) {
            const newCourse = await Lms.create({
                courseName: req.body.newCourseName,
                instructor: req.body.newInstructor || 'Staff',
                price: req.body.newPrice || 29.99,
                enrolledStudents: 0
            });
            targetCourseId = newCourse._id;
        }

        // 2. Only save a resource if a file was actually uploaded
        if (req.file) {
            await Resource.create({
                title: req.body.title || 'Untitled Resource',
                fileType: req.body.fileType,
                filePath: `/uploads/${req.file.filename}`,
                course: targetCourseId,
                uploadedBy: req.session.user.id
            });
            console.log("✅ Resource attached to course.");
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).send("Processing Error");
    }
});

// 4. Delete Course Route
app.post('/delete-course/:id', isAdmin, async (req, res) => {
    try {
        const courseId = req.params.id;
        // Delete the course
        await Lms.findByIdAndDelete(courseId);
        // Delete all resources associated with this course
        await Resource.deleteMany({ course: courseId });

        console.log("🗑️ Course and resources deleted.");
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).send("Error deleting course");
    }
});

// 5. Dashboard Page
// 5. Dashboard Page (Updated with Enrollment Check)
app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const courses = await Lms.find();
        
        // Fetch full user data from DB to get the enrolledCourses array
        const currentUserData = await User.findById(req.session.user.id);

        res.render('dashboard', {
            courses: courses,
            currentUser: currentUserData, // Matches the variable in your EJS
            userRole: req.session.user.role
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
});

// 5.1 Payment Gatekeeper (Logic for "Continue Learning" vs "Enroll")

app.get('/dashboard/course/:id', isAuthenticated, async (req, res) => {
    try {
        const course = await Lms.findById(req.params.id);
        const user = await User.findById(req.session.user.id);

        if (!course) return res.redirect('/dashboard');

        const isFree = course.price == 0 || course.price == "0";
        
        // Safety check: ensure enrolledCourses exists before calling .some()
        const enrolledCourses = user.enrolledCourses || [];
        const isEnrolled = enrolledCourses.some(id => id.toString() === course._id.toString());

        if (isFree || isEnrolled) {
            res.redirect(`/library?courseId=${course._id}&viewMode=player`);
        } else {
            // This renders views/enroll.ejs - MAKE SURE THIS FILE EXISTS
            res.render('enroll', { course });
        }
    } catch (err) {
        console.error("Gatekeeper Error:", err);
        res.redirect('/dashboard');
    }
});
// 5.2 Payment/Enrollment Processor
app.post('/enroll/pay/:id', isAuthenticated, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.session.user.id;

        // 1. Get the User and Course
        const user = await User.findById(userId);
        const course = await Lms.findById(courseId);

        if (!course) return res.redirect('/dashboard');

        // 2. Initialize enrolledCourses if it doesn't exist, then check enrollment
        const userEnrolledList = user.enrolledCourses || [];
        const isAlreadyEnrolled = userEnrolledList.some(id => id.toString() === courseId.toString());

        if (!isAlreadyEnrolled) {
            // Update User: Add course to their list
            await User.findByIdAndUpdate(userId, {
                $addToSet: { enrolledCourses: courseId }
            });

            // Update Course: Atomic Increment
            // We use { new: true } to get the updated document back for the console log
            const updatedCourse = await Lms.findByIdAndUpdate(
                courseId, 
                { $inc: { enrolledStudents: 1 } },
                { new: true } 
            );
            
            console.log(`✅ Success! ${course.courseName} count is now: ${updatedCourse.enrolledStudents}`);
        } else {
            console.log("ℹ️ User already enrolled. No increase applied.");
        }

        // 3. Render receipt
        res.render('receipt', {
            userName: req.session.user.username,
            courseName: course.courseName,
            amount: course.price,
            courseId: course._id,
            date: new Date().toLocaleDateString(),
            receiptId: 'LMS-' + Math.floor(Math.random() * 1000000)
        });
    } catch (err) {
        console.error("Enrollment Error:", err);
        res.redirect('/dashboard');
    }
});
// 6. Library Page
app.get('/library', async (req, res) => {
    try {
        const { courseId, viewMode } = req.query;
        let query = {};

        // If coming from "Continue Learning", filter by course and exclude books
        if (courseId && viewMode === 'player') {
            query = {
                course: courseId,
                fileType: { $ne: 'Book' } // Exclude books
            };
        }

        const resources = await Resource.find(query).populate('course');
        const courses = await Lms.find();

        res.render('library', {
            resources,
            courses,
            viewMode: viewMode || 'full' // default to full library view
        });
    } catch (err) {
        res.status(500).send("Error loading library");
    }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 LMS Server running: http://localhost:${PORT}`);
});