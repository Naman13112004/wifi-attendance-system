const jwt = require("jsonwebtoken");

function adminMiddleware(req, res, next){
    const token = req.headers.token;
    
    if (!token) {
        return res.status(401).json({
            message: "No token provided"
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_ADMIN_PASSWORD);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = {
    adminMiddleware
}