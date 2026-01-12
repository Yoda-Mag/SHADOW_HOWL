module.exports = (roleRequired) => {
    return (req, res, next) => {
        if (req.user && req.user.role === roleRequired) {
            return next();
        }
        return res.status(403).json({ message: "Access Denied: Admin role required." });
    };
};