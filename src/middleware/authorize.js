import { ApiError } from '../utils.js';

export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
        return next(ApiError.forbidden('You do not have permission'));
    }
    next();
};
