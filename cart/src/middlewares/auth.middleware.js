const jwt = require('jsonwebtoken');

/**
 * Factory to create authentication + authorization middleware.
 * @param {string[]} allowedRoles Roles permitted to access the route
 * @returns Express middleware
 */
function createAuthMiddleware(allowedRoles = []) {
    return function authMiddleware(req, res, next) {
        // Prefer Authorization header (Bearer token) used in tests; fallback to cookie token.
        let token;
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Normalise id field (tests sometimes use id, sometimes _id)
            const userId = decoded.id || decoded._id;
            const role = decoded.role;

            if (allowedRoles.length && !allowedRoles.includes(role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            req.user = { ...decoded, id: userId }; // ensure req.user.id always present
            return next();
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    };
}

module.exports = createAuthMiddleware;
