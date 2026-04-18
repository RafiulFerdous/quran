"use strict";
/** Passes rejected promises to Express error middleware (required for async route handlers). */
export function asyncHandler(fn) {
    return (req, res, next) => {
        void fn(req, res, next).catch(next);
    };
}
