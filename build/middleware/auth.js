"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const is_1 = require("../utils/is");
const auth = async (req, res, next) => {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
    if ((0, is_1.isNotEmptyString)(AUTH_SECRET_KEY)) {
        try {
            const Authorization = req.header('Authorization');
            if (!Authorization || Authorization.replace('Bearer ', '').trim() !== AUTH_SECRET_KEY.trim())
                throw new Error('Error: 无访问权限 | No access rights');
            next();
        }
        catch (error) {
            res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null });
        }
    }
    else {
        next();
    }
};
exports.auth = auth;
