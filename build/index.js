"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatgpt_1 = require("./chatgpt");
const auth_1 = require("./middleware/auth");
const limiter_1 = require("./middleware/limiter");
const is_1 = require("./utils/is");
const app = (0, express_1.default)();
const router = express_1.default.Router();
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
app.all('*', (_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'authorization, Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});
router.post('/chat-process', [auth_1.auth, limiter_1.limiter], async (req, res) => {
    res.setHeader('Content-type', 'application/octet-stream');
    try {
        const { prompt, options = {}, systemMessage, temperature, top_p } = req.body;
        let firstChunk = true;
        await (0, chatgpt_1.chatReplyProcess)({
            message: prompt,
            lastContext: options,
            process: (chat) => {
                res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`);
                firstChunk = false;
            },
            systemMessage,
            temperature,
            top_p,
        });
    }
    catch (error) {
        res.write(JSON.stringify(error));
    }
    finally {
        res.end();
    }
});
router.post('/config', auth_1.auth, async (req, res) => {
    try {
        const response = await (0, chatgpt_1.chatConfig)();
        res.send(response);
    }
    catch (error) {
        res.send(error);
    }
});
router.post('/session', async (req, res) => {
    try {
        const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
        const hasAuth = (0, is_1.isNotEmptyString)(AUTH_SECRET_KEY);
        res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: (0, chatgpt_1.currentModel)() } });
    }
    catch (error) {
        res.send({ status: 'Fail', message: error.message, data: null });
    }
});
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token)
            throw new Error('Secret key is empty');
        if (process.env.AUTH_SECRET_KEY !== token)
            throw new Error('密钥无效 | Secret key is invalid');
        res.send({ status: 'Success', message: 'Verify successfully', data: null });
    }
    catch (error) {
        res.send({ status: 'Fail', message: error.message, data: null });
    }
});
app.use('', router);
app.use('/api', router);
app.set('trust proxy', 1);
app.listen(3002, () => globalThis.console.log('Server is running on port 3002'));
