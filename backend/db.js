const { mongoose } = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = Schema;

const studentSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    studentId: {type: String, required: true, unique: true},
    classId: {type: ObjectId, ref: "Class"}
}, {timestamps: true});

const teacherSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
}, {timestamps: true});

const classSchema = new Schema({
    name: {type: String, required: true},
    teacherId: {type: ObjectId, ref: "Teacher", required: true},
    students: [{type: ObjectId, ref: "Student"}],
    wifiSSID: {type: String} // Added WiFi SSID for attendance tracking
}, {timestamps: true});

// New schema for attendance
const attendanceSchema = new Schema({
    classId: {type: ObjectId, ref: "Class", required: true},
    date: {type: Date, required: true},
    wifiSSID: {type: String, required: true}, // WiFi network used for tracking
    students: [{
        studentId: {type: ObjectId, ref: "Student", required: true},
        present: {type: Boolean, default: false},
        timestamp: {type: Date}
    }]
}, {timestamps: true});

// Create index for efficient queries
attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

const studentModel = mongoose.model("Student", studentSchema);
const teacherModel = mongoose.model("Teacher", teacherSchema);
const classModel = mongoose.model("Class", classSchema);
const attendanceModel = mongoose.model("Attendance", attendanceSchema);

module.exports = {
    studentModel,
    teacherModel,
    classModel,
    attendanceModel
}