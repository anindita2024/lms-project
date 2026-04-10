import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import lms from "./models/lms.js";
import User from "./models/user.js"; // Lowercase 'u' to match your file

const sampleCourses = [
    { courseName: "Web Development Bootcamp", instructor: "Angela Yu", price: 49, thumbnail: "https://via.placeholder.com/300", duration: "45 Hours", category: "Programming", level: "Beginner" },
    { courseName: "Advanced Node.js Patterns", instructor: "Ryan Dahl", price: 89, thumbnail: "https://via.placeholder.com/300", duration: "12 Hours", category: "Backend", level: "Advanced" },
    { courseName: "UI/UX Design Essentials", instructor: "Gary Simon", price: 25, thumbnail: "https://via.placeholder.com/300", duration: "8 Hours", category: "Design", level: "Intermediate" }
];

const seedData = async () => {
    try {
        // Using your direct string since you used it in your snippet
        await mongoose.connect("mongodb://127.0.0.1:27017/lms_database");
        await lms.deleteMany({});
        await User.deleteMany({});

        await lms.insertMany(sampleCourses);

        const hashedPassword = await bcrypt.hash("admin123", 10);
        await User.create({
            username: "Admin",
            email: "admin@test.com",
            password: hashedPassword,
            role: "admin"
        });

        console.log("🌱 Database Seeded!");
        console.log("👑 Admin Account: admin@test.com | password: admin123");

        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Seeding Error:", error);
    }
};

seedData();