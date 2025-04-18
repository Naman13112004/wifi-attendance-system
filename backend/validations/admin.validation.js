// validations/admin.validation.js
const { z } = require("zod");
const { ObjectId } = require("mongoose").Types;

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  try {
    return ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

// Admin signup validation
const adminSignupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Admin signin validation
const adminSigninSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

// Class creation validation
const createClassSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  wifiSSID: z.string().min(1, "WiFi SSID is required"), // Added this line
  teacherId: z.string().refine(isValidObjectId, {
    message: "Invalid teacher ID format"
  }).optional() // Made optional since it comes from middleware
});

// Attendance update validation
const updateAttendanceSchema = z.object({
  classId: z.string().refine(isValidObjectId, {
    message: "Invalid class ID format"
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  wifiSSID: z.string().min(1, "WiFi SSID is required"),
  students: z.array(z.object({
    studentId: z.string().refine(isValidObjectId, {
      message: "Invalid student ID format"
    }),
    present: z.boolean()
  }))
});

// Attendance query validation
const showAttendanceSchema = z.object({
  classId: z.string().refine(isValidObjectId, {
    message: "Invalid class ID format"
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional()
});

const addStudentsSchema = z.object({
  classId: z.string().refine(isValidObjectId, {
    message: "Invalid class ID format"
  }),
  studentIds: z.array(
    z.string().refine(isValidObjectId, {
      message: "Invalid student ID format"
    })
  ).min(1, "At least one student ID is required")
    .refine(
      async (studentIds) => {
        const existingCount = await studentModel.countDocuments({
          _id: { $in: studentIds }
        });
        return existingCount === studentIds.length;
      },
      {
        message: "One or more student IDs don't exist",
        path: ["studentIds"]
      }
    )
});

module.exports = {
  adminSignupSchema,
  adminSigninSchema,
  createClassSchema,
  updateAttendanceSchema,
  showAttendanceSchema,
  addStudentsSchema
};