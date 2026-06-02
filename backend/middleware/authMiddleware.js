const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    try {
        // 1. Token nikalna 
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; 
        
        // Do not log token value in production

        // 2. Agar token nahi hai toh 401 (Unauthorized) JSON 
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Access Denied. No token provided." 
            }); 
        }

        // 3. Token verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // JWT payload uses _id (set in generateToken), normalise to both
        req.user = { ...decoded, id: decoded._id };
        
        // 4. Sab theek hai move next 
        return next(); 

    } catch (error) {
        console.log("Token error:", error.message);
        // Token expire ya galat hone par 403 (Forbidden)
        return res.status(403).json({ 
            success: false, 
            message: "Invalid or Expired Token." 
        }); 
    }
};

module.exports = { authenticateJWT };