// middlewares/validation.js
function validateRequest(schema) {
    return (req, res, next) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
    };
  }
  
  module.exports = {
    validateRequest
  };