const { studentModel, attendanceModel, classModel } = require("../db.js");
const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { userMiddleware } = require("../middlewares/user.js");
const { validateRequest } = require("../middlewares/validation");
const { userSignupSchema, userSigninSchema, studentAttendanceSchema } = require("../validations/user.validation.js");

const userRouter = Router();

userRouter.post("/signup", validateRequest(userSignupSchema), (req, res) => {
    const {name, email, password, studentId, classId} = req.body;

    bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({
                message: "Error in hashing password"
            });
        }
        
        try {
            const existingStudent = await studentModel.findOne({ 
                $or: [{ email }, { studentId }]
            });
            
            if (existingStudent) {
                return res.status(400).json({
                    message: existingStudent.email === email 
                        ? "Email already exists" 
                        : "Student ID already exists"
                });
            }
            
            const newStudent = await studentModel.create({
                name,
                email,
                password: hashedPassword,
                studentId,
                classId
            });
            
            // If classId is provided, add student to class
            if (classId) {
                await classModel.findByIdAndUpdate(
                    classId,
                    { $addToSet: { students: newStudent._id } }
                );
            }
            
            res.status(201).json({
                message: "Signup successful"
            });
        } catch (error) {
            res.status(500).json({
                message: "Internal server error",
                error: error.message
            });
        }
    });
});

userRouter.post("/signin", validateRequest(userSigninSchema), async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await studentModel.findOne({
            email: email,
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Error in comparing password"
                });
            }
            
            if (result) {
                const token = jwt.sign({
                    id: user._id,
                }, process.env.JWT_USER_PASSWORD,{ 
                    expiresIn: '24h' 
                });

                res.json({
                    token: token,
                    name: user.name,
                    studentId: user.studentId,
                    email: user.email
                });
            } else {
                res.status(403).json({
                    message: "Incorrect password"
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

userRouter.get("/show-attendance", userMiddleware, async (req, res) => {
    const studentId = req.userId;
    const { startDate, endDate } = req.query;
    
    try {
        // Validate parameters if provided
        if (startDate || endDate) {
            try {
                studentAttendanceSchema.parse({ startDate, endDate });
            } catch (error) {
                return res.status(400).json({
                    message: "Validation error",
                    errors: error.errors
                });
            }
        }
        
        // Get student details
        const student = await studentModel.findById(studentId).populate('classId');
        
        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }
        
        if (!student.classId) {
            return res.status(400).json({
                message: "Student is not enrolled in any class"
            });
        }
        
        // Build date filter
        let dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        } else if (startDate) {
            dateFilter = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0))
            };
        } else if (endDate) {
            dateFilter = {
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }
        
        // Query attendance records
        const query = { 
            classId: student.classId._id,
            'students.studentId': student._id
        };
        
        if (Object.keys(dateFilter).length > 0) {
            query.date = dateFilter;
        }
        
        const attendanceRecords = await attendanceModel.find(query)
            .sort({ date: -1 });
        
        // Extract attendance information for this student
        const formattedRecords = attendanceRecords.map(record => {
            const studentRecord = record.students.find(
                s => s.studentId.toString() === student._id.toString()
            );
            
            return {
                date: record.date,
                present: studentRecord ? studentRecord.present : false,
                wifiSSID: record.wifiSSID,
                timestamp: studentRecord ? studentRecord.timestamp : null
            };
        });
        
        // Calculate attendance statistics
        const totalDays = formattedRecords.length;
        const presentDays = formattedRecords.filter(r => r.present).length;
        const attendancePercentage = totalDays > 0 
            ? ((presentDays / totalDays) * 100).toFixed(2) 
            : 0;
        
        res.status(200).json({
            student: {
                name: student.name,
                studentId: student.studentId,
                email: student.email
            },
            class: {
                id: student.classId._id,
                name: student.classId.name
            },
            attendanceRecords: formattedRecords,
            statistics: {
                totalDays,
                presentDays,
                absentDays: totalDays - presentDays,
                attendancePercentage: parseFloat(attendancePercentage)
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch attendance records",
            error: error.message
        });
    }
});

// Route for marking attendance with WiFi validation
userRouter.post("/mark-attendance", userMiddleware, async (req, res) => {
    const studentId = req.userId;
    const { wifiSSID } = req.body;
    
    try {
        // Validate WiFi SSID
        if (!wifiSSID) {
            return res.status(400).json({
                message: "WiFi SSID is required"
            });
        }
        
        // Get student details with class
        const student = await studentModel.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }
        
        if (!student.classId) {
            return res.status(400).json({
                message: "Student is not enrolled in any class"
            });
        }
        
        // Get class details to verify WiFi SSID
        const classDetails = await classModel.findById(student.classId);
        
        if (!classDetails) {
            return res.status(404).json({
                message: "Class not found"
            });
        }
        
        // Verify WiFi SSID matches the class's configured SSID
        if (classDetails.wifiSSID !== wifiSSID) {
            return res.status(403).json({
                message: "You are not connected to the correct WiFi network for attendance"
            });
        }
        
        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Check if there's an active attendance record for today
        let attendance = await attendanceModel.findOne({
            classId: student.classId,
            date: {
                $gte: today,
                $lte: endOfDay
            }
        });
        
        if (!attendance) {
            return res.status(404).json({
                message: "No active attendance session for today"
            });
        }
        
        // Check if student has already been marked
        const existingRecord = attendance.students.find(
            s => s.studentId.toString() === student._id.toString()
        );
        
        if (existingRecord && existingRecord.present) {
            return res.status(400).json({
                message: "Attendance already marked for today"
            });
        }
        
        // Mark attendance
        if (existingRecord) {
            // Update existing record
            attendance.students = attendance.students.map(s => {
                if (s.studentId.toString() === student._id.toString()) {
                    return {
                        ...s,
                        present: true,
                        timestamp: new Date()
                    };
                }
                return s;
            });
        } else {
            // Add new record
            attendance.students.push({
                studentId: student._id,
                present: true,
                timestamp: new Date()
            });
        }
        
        await attendance.save();
        
        res.status(200).json({
            message: "Attendance marked successfully",
            date: attendance.date,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to mark attendance",
            error: error.message
        });
    }
});

// New endpoint: Get user profile
userRouter.get("/profile", userMiddleware, async (req, res) => {
    const studentId = req.userId;
    
    try {
        const student = await studentModel.findById(studentId)
            .populate('classId')
            .select('-password'); // Exclude password from the response
        
        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }
        
        // Get attendance statistics for the student
        const attendanceStats = await attendanceModel.aggregate([
            {
                $match: {
                    'students.studentId': student._id
                }
            },
            {
                $unwind: '$students'
            },
            {
                $match: {
                    'students.studentId': student._id
                }
            },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: 1 },
                    presentDays: {
                        $sum: {
                            $cond: [{ $eq: ['$students.present', true] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        
        // Calculate attendance percentage
        const stats = attendanceStats.length > 0 ? attendanceStats[0] : { totalDays: 0, presentDays: 0 };
        const attendancePercentage = stats.totalDays > 0 
            ? ((stats.presentDays / stats.totalDays) * 100).toFixed(2) 
            : 0;
        
        res.status(200).json({
            _id: student._id,
            name: student.name,
            email: student.email,
            studentId: student.studentId,
            enrolledClass: student.classId ? {
                _id: student.classId._id,
                name: student.classId.name
            } : null,
            statistics: {
                totalDays: stats.totalDays,
                presentDays: stats.presentDays,
                absentDays: stats.totalDays - stats.presentDays,
                attendancePercentage: parseFloat(attendancePercentage)
            },
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user profile",
            error: error.message
        });
    }
});

// New endpoint: Get student's classes for today
userRouter.get("/classes", userMiddleware, async (req, res) => {
    const studentId = req.userId;
    
    try {
        // Get the student with their enrolled class
        const student = await studentModel.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }
        
        if (!student.classId) {
            return res.status(200).json({
                classes: []
            });
        }
        
        // Get today's date
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Convert day number to day name
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[dayOfWeek];
        
        // Find the student's class with schedule details
        const studentClass = await classModel.findById(student.classId);
        
        if (!studentClass) {
            return res.status(200).json({
                classes: []
            });
        }
        
        // Check if today's attendance is already marked
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        // Find today's attendance record
        const todayAttendance = await attendanceModel.findOne({
            classId: studentClass._id,
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });
        
        // Check if student has marked attendance
        let attendanceMarked = false;
        
        if (todayAttendance) {
            const studentAttendance = todayAttendance.students.find(
                s => s.studentId.toString() === student._id.toString()
            );
            
            attendanceMarked = studentAttendance && studentAttendance.present;
        }
        
        // Filter for classes scheduled for today
        // Note: This assumes classes have a schedule field with day information
        // You may need to adjust this based on your actual class model structure
        const todayClasses = studentClass.schedule && studentClass.schedule.includes(todayName)
            ? [{
                _id: studentClass._id,
                name: studentClass.name,
                subject: studentClass.subject,
                time: studentClass.time,
                room: studentClass.room,
                teacher: studentClass.teacher,
                wifiSSID: studentClass.wifiSSID,
                attendanceMarked: attendanceMarked,
                attendanceActive: !!todayAttendance
            }]
            : [];
        
        res.status(200).json({
            classes: todayClasses,
            today: todayName
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch classes",
            error: error.message
        });
    }
});

module.exports = {
    userRouter
}