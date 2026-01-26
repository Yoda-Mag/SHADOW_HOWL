// backend/Middleware/Rolemiddleware.js
module.exports = (roleRequired) => {
    return (req, res, next) => {
        if (req.user && req.user.role === roleRequired) {
            return next();
        }
        return res.status(403).json({ 
            message: `Access Denied: ${roleRequired} role required.` 
        });
    };
};