import { ZodError } from "zod";
import { ApiError } from "../utils.js";

export const validate = (schemas) => (req, res, next) => {
    try {
        for (const key of ['body', 'query', 'params']) {
            if (schemas[key]) {
                const parsed = schemas[key].parse(req[key]);
                if (key === 'query') Object.assign(req.query, parsed);
                else req[key] = parsed;
            }

        } next();

    } catch (error) {
        {
            if (error instanceof ZodError) {
                const details = error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
                return next(ApiError.badRequest('Validation Failed', details));
            }
        }
        next(error);
    }
};

