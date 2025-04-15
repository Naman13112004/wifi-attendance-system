// validations/user.validation.js
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

// User signup validation
const userSignupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  studentId: z.string()
    .min(5, "Student ID must be at least 5 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Student ID must be alphanumeric"),
  classId: z.string()
    .refine(isValidObjectId, { message: "Invalid class ID format" })
    .optional()
    .or(z.literal('')) // Allow empty string for unenrolled students
});

// User signin validation
const userSigninSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

// Student attendance query validation
const studentAttendanceSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional()
});

module.exports = {
  userSignupSchema,
  userSigninSchema,
  studentAttendanceSchema
};