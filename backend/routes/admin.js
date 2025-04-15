const { Router } = require("express");
const { teacherModel, classModel, attendanceModel, studentModel } = require("../db");
const { adminMiddleware } = require("../middlewares/admin.js");
const { validateRequest } = require("../middlewares/validation");
const { 
    adminSignupSchema, 
    adminSigninSchema, 
    createClassSchema, 
    updateAttendanceSchema, 
    showAttendanceSchema 
} = require("../validations/admin.validation.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminRouter = Router();

adminRouter.post("/signup", validateRequest(adminSignupSchema), (req, res) => {
    const {name, email, password} = req.body;

    bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({
                message: "Error in hashing password"
            });
        }
        
        try {
            const existingTeacher = await teacherModel.findOne({ email });
            if (existingTeacher) {
                return res.status(400).json({
                    message: "Email already exists"
                });
            }
            
            await teacherModel.create({
                name: name,
                email: email,
                password: hashedPassword,
            });
            
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

adminRouter.post("/signin", validateRequest(adminSigninSchema), async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await teacherModel.findOne({
            email: email,
        });

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        bcrypt.compare(password, admin.password, (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Error in comparing password"
                });
            }
            
            if (result) {
                const token = jwt.sign({
                    id: admin._id,
                }, process.env.JWT_ADMIN_PASSWORD);
        
                res.json({
                    token: token,
                    name: admin.name,
                    email: admin.email
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

adminRouter.post("/create-class", adminMiddleware, validateRequest(createClassSchema), async (req, res) => {
    const { name, wifiSSID } = req.body;
    const teacherId = req.userId;
    
    try {
        const newClass = await classModel.create({
            name,
            teacherId,
            wifiSSID,
            students: []
        });
        
        res.status(201).json({
            message: "Class created successfully",
            class: {
                id: newClass._id,
                name: newClass.name,
                wifiSSID: newClass.wifiSSID
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create class",
            error: error.message
        });
    }
});

adminRouter.post("/update-attendance", adminMiddleware, validateRequest(updateAttendanceSchema), async (req, res) => {
    const { classId, date, wifiSSID, students } = req.body;
    const teacherId = req.userId;
    
    try {
        // Verify the teacher owns this class
        const classExists = await classModel.findOne({
            _id: classId,
            teacherId: teacherId
        });
        
        if (!classExists) {
            return res.status(403).json({
                message: "You don't have permission to update attendance for this class"
            });
        }
        
        // Check if the WiFi SSID matches the one set for the class
        if (classExists.wifiSSID && classExists.wifiSSID !== wifiSSID) {
            return res.status(400).json({
                message: "WiFi network doesn't match the one set for this class"
            });
        }
        
        // Format the date string to a Date object
        const attendanceDate = new Date(date);
        
        // Check if attendance record already exists for this date and class
        let attendance = await attendanceModel.findOne({
            classId,
            date: {
                $gte: new Date(attendanceDate.setHours(0, 0, 0)),
                $lt: new Date(attendanceDate.setHours(23, 59, 59))
            }
        });
        
        if (attendance) {
            // Update existing attendance record
            const updatedStudents = students.map(student => ({
                studentId: student.studentId,
                present: student.present,
                timestamp: new Date()
            }));
            
            attendance.students = updatedStudents;
            attendance.wifiSSID = wifiSSID;
            await attendance.save();
        } else {
            // Create new attendance record
            const studentRecords = students.map(student => ({
                studentId: student.studentId,
                present: student.present,
                timestamp: new Date()
            }));
            
            attendance = await attendanceModel.create({
                classId,
                date: attendanceDate,
                wifiSSID,
                students: studentRecords
            });
        }
        
        res.status(200).json({
            message: "Attendance updated successfully",
            date: attendance.date
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update attendance",
            error: error.message
        });
    }
});

adminRouter.get("/show-attendance", adminMiddleware, async (req, res) => {
    const { classId, startDate, endDate } = req.query;
    const teacherId = req.userId;
    
    try {
        // Validate parameters
        try {
            showAttendanceSchema.parse({ classId, startDate, endDate });
        } catch (error) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors
            });
        }
        
        // Verify the teacher owns this class
        const classExists = await classModel.findOne({
            _id: classId,
            teacherId: teacherId
        });
        
        if (!classExists) {
            return res.status(403).json({
                message: "You don't have permission to view attendance for this class"
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
        const query = { classId };
        if (Object.keys(dateFilter).length > 0) {
            query.date = dateFilter;
        }
        
        const attendanceRecords = await attendanceModel.find(query)
            .sort({ date: -1 })
            .populate({
                path: 'students.studentId',
                select: 'name studentId email'
            });
        
        // Transform data for response
        const formattedRecords = attendanceRecords.map(record => ({
            date: record.date,
            wifiSSID: record.wifiSSID,
            students: record.students.map(student => ({
                id: student.studentId._id,
                name: student.studentId.name,
                studentId: student.studentId.studentId,
                email: student.studentId.email,
                present: student.present,
                timestamp: student.timestamp
            }))
        }));
        
        res.status(200).json({
            className: classExists.name,
            attendanceRecords: formattedRecords
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch attendance records",
            error: error.message
        });
    }
});

// Route to add students to a class
adminRouter.post("/add-students-to-class", adminMiddleware, async (req, res) => {
    const { classId, studentIds } = req.body;
    const teacherId = req.userId;
    
    try {
        // Validate input
        if (!classId || !Array.isArray(studentIds)) {
            return res.status(400).json({
                message: "Invalid input. Please provide classId and an array of studentIds"
            });
        }
        
        // Verify the teacher owns this class
        const classExists = await classModel.findOne({
            _id: classId,
            teacherId: teacherId
        });
        
        if (!classExists) {
            return res.status(403).json({
                message: "You don't have permission to modify this class"
            });
        }
        
        // Add students to class
        await classModel.findByIdAndUpdate(
            classId,
            { $addToSet: { students: { $each: studentIds } } }
        );
        
        // Update students' classId
        await studentModel.updateMany(
            { _id: { $in: studentIds } },
            { $set: { classId: classId } }
        );
        
        res.status(200).json({
            message: "Students added to class successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to add students to class",
            error: error.message
        });
    }
});

// Route to get all classes for a teacher
adminRouter.get("/classes", adminMiddleware, async (req, res) => {
    const teacherId = req.userId;
    
    try {
        const classes = await classModel.find({ teacherId })
            .populate({
                path: 'students',
                select: 'name studentId email'
            });
        
        const formattedClasses = classes.map(cls => ({
            id: cls._id,
            name: cls.name,
            wifiSSID: cls.wifiSSID,
            studentCount: cls.students.length,
            students: cls.students.map(student => ({
                id: student._id,
                name: student.name,
                studentId: student.studentId,
                email: student.email
            }))
        }));
        
        res.status(200).json({
            classes: formattedClasses
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch classes",
            error: error.message
        });
    }
});

// Route to get attendance summary statistics
adminRouter.get("/attendance-summary", adminMiddleware, async (req, res) => {
    const teacherId = req.userId;
    
    try {
        // Get all classes for this teacher
        const teacherClasses = await classModel.find({ teacherId });
        const classIds = teacherClasses.map(cls => cls._id);
        
        // If no classes found, return empty summary
        if (classIds.length === 0) {
            return res.status(200).json([]);
        }
        
        // Get attendance records for all classes
        const attendanceRecords = await attendanceModel.find({ 
            classId: { $in: classIds } 
        });
        
        // Process attendance data by class
        const summary = [];
        
        for (const classObj of teacherClasses) {
            // Get records for this class
            const classAttendance = attendanceRecords.filter(
                record => record.classId.toString() === classObj._id.toString()
            );
            
            if (classAttendance.length === 0) {
                summary.push({
                    classId: classObj._id,
                    className: classObj.name,
                    totalSessions: 0,
                    totalCount: 0,
                    presentCount: 0,
                    attendanceRate: 0
                });
                continue;
            }
            
            // Calculate statistics for this class
            let totalStudentEntries = 0;
            let totalPresent = 0;
            
            for (const record of classAttendance) {
                totalStudentEntries += record.students.length;
                totalPresent += record.students.filter(student => student.present).length;
            }
            
            summary.push({
                classId: classObj._id,
                className: classObj.name,
                totalSessions: classAttendance.length,
                totalCount: totalStudentEntries,
                presentCount: totalPresent,
                attendanceRate: totalStudentEntries > 0 ? (totalPresent / totalStudentEntries) * 100 : 0
            });
        }
        
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch attendance summary",
            error: error.message
        });
    }
});

// Route to get total student count
adminRouter.get("/students-count", adminMiddleware, async (req, res) => {
    const teacherId = req.userId;
    
    try {
        // Get all classes for this teacher
        const teacherClasses = await classModel.find({ teacherId });
        const classIds = teacherClasses.map(cls => cls._id);
        
        // Get unique student count (students might be in multiple classes)
        const uniqueStudentCount = await studentModel.countDocuments({
            classId: { $in: classIds }
        });
        
        // Count students by class
        const studentsByClass = [];
        
        for (const classObj of teacherClasses) {
            const count = await studentModel.countDocuments({ classId: classObj._id });
            studentsByClass.push({
                classId: classObj._id,
                className: classObj.name,
                count: count
            });
        }
        
        res.status(200).json({
            total: uniqueStudentCount,
            byClass: studentsByClass
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch student count",
            error: error.message
        });
    }
});

adminRouter.get("/profile", adminMiddleware, async (req, res) => {
    const teacherId = req.userId;
    
    try {
        const teacher = await teacherModel.findById(teacherId)
            .select('-password') // Exclude password from the response
            .lean();

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        // Get teacher's classes information
        const classes = await classModel.find({ teacherId })
            .select('name wifiSSID')
            .lean();

        // Get statistics
        const classIds = classes.map(c => c._id);
        const studentCount = await studentModel.countDocuments({ classId: { $in: classIds } });
        const classCount = classes.length;

        res.status(200).json({
            ...teacher,
            statistics: {
                classCount,
                studentCount,
                averageStudentsPerClass: classCount > 0 ? (studentCount / classCount).toFixed(1) : 0
            },
            classes: classes.map(c => ({
                id: c._id,
                name: c.name,
                wifiSSID: c.wifiSSID
            }))
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch teacher profile",
            error: error.message
        });
    }
});

module.exports = {
    adminRouter
}