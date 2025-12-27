"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const is_1 = require("../utils/is");
const MAX_REQUEST_PER_HOUR = process.env.MAX_REQUEST_PER_HOUR;
const maxCount = ((0, is_1.isNotEmptyString)(MAX_REQUEST_PER_HOUR) && !isNaN(Number(MAX_REQUEST_PER_HOUR)))
    ? parseInt(MAX_REQUEST_PER_HOUR)
    : 0; // 0 means unlimited
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60 * 1000,
    max: maxCount,
    statusCode: 200,
    message: async (req, res) => {
        res.send({ status: 'Fail', message: 'Too many request from this IP in 1 hour', data: null });
    },
});
exports.limiter = limiter;
