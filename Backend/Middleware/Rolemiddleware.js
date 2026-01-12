//RoleMiddleware
module.exports = (roleRequired) => {
    return (req, res, next) => {
        // req.user was populated by AuthMiddleware.js
        if (req.user && req.user.role === roleRequired) {
            next();
        } else {
            res.status(403).json({ message: "Access Denied: Only admins can post trading signals" });
        }
    };
};