"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentModel = exports.chatConfig = exports.chatReplyProcess = void 0;
const dotenv = __importStar(require("dotenv"));
require("isomorphic-fetch");
const chatgpt_1 = require("chatgpt");
const socks_proxy_agent_1 = require("socks-proxy-agent");
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const utils_1 = require("../utils");
const is_1 = require("../utils/is");
const { HttpsProxyAgent } = https_proxy_agent_1.default;
dotenv.config();
const ErrorCodeMessage = {
    401: '[OpenAI] 提供错误的API密钥 | Incorrect API key provided',
    403: '[OpenAI] 服务器拒绝访问，请稍后再试 | Server refused to access, please try again later',
    502: '[OpenAI] 错误的网关 |  Bad Gateway',
    503: '[OpenAI] 服务器繁忙，请稍后再试 | Server is busy, please try again later',
    504: '[OpenAI] 网关超时 | Gateway Time-out',
    500: '[OpenAI] 服务器繁忙，请稍后再试 | Internal Server Error',
};
const timeoutMs = !isNaN(+process.env.TIMEOUT_MS) ? +process.env.TIMEOUT_MS : 100 * 1000;
const disableDebug = process.env.OPENAI_API_DISABLE_DEBUG === 'true';
let apiModel;
const model = (0, is_1.isNotEmptyString)(process.env.OPENAI_API_MODEL) ? process.env.OPENAI_API_MODEL : 'gpt-3.5-turbo';
if (!(0, is_1.isNotEmptyString)(process.env.OPENAI_API_KEY) && !(0, is_1.isNotEmptyString)(process.env.OPENAI_ACCESS_TOKEN))
    throw new Error('Missing OPENAI_API_KEY or OPENAI_ACCESS_TOKEN environment variable');
let api;
(async () => {
    // More Info: https://github.com/transitive-bullshit/chatgpt-api
    if ((0, is_1.isNotEmptyString)(process.env.OPENAI_API_KEY)) {
        const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL;
        const options = {
            apiKey: process.env.OPENAI_API_KEY,
            completionParams: { model },
            debug: !disableDebug,
        };
        // increase max token limit if use gpt-4
        if (model.toLowerCase().includes('gpt-4')) {
            // if use 32k model
            if (model.toLowerCase().includes('32k')) {
                options.maxModelTokens = 32768;
                options.maxResponseTokens = 8192;
            }
            // if use GPT-4 Turbo or GPT-4o
            else if (/-preview|-turbo|o/.test(model.toLowerCase())) {
                options.maxModelTokens = 128000;
                options.maxResponseTokens = 4096;
            }
            else {
                options.maxModelTokens = 8192;
                options.maxResponseTokens = 2048;
            }
        }
        else if (model.toLowerCase().includes('gpt-3.5')) {
            if (/16k|1106|0125/.test(model.toLowerCase())) {
                options.maxModelTokens = 16384;
                options.maxResponseTokens = 4096;
            }
        }
        if ((0, is_1.isNotEmptyString)(OPENAI_API_BASE_URL)) {
            // if find /v1 in OPENAI_API_BASE_URL then use it
            if (OPENAI_API_BASE_URL.includes('/v1'))
                options.apiBaseUrl = `${OPENAI_API_BASE_URL}`;
            else
                options.apiBaseUrl = `${OPENAI_API_BASE_URL}/v1`;
        }
        setupProxy(options);
        api = new chatgpt_1.ChatGPTAPI({ ...options });
        apiModel = 'ChatGPTAPI';
    }
    else {
        const options = {
            accessToken: process.env.OPENAI_ACCESS_TOKEN,
            apiReverseProxyUrl: (0, is_1.isNotEmptyString)(process.env.API_REVERSE_PROXY) ? process.env.API_REVERSE_PROXY : 'https://ai.fakeopen.com/api/conversation',
            model,
            debug: !disableDebug,
        };
        setupProxy(options);
        api = new chatgpt_1.ChatGPTUnofficialProxyAPI({ ...options });
        apiModel = 'ChatGPTUnofficialProxyAPI';
    }
})();
async function chatReplyProcess(options) {
    const { message, lastContext, process, systemMessage, temperature, top_p } = options;
    try {
        let options = { timeoutMs };
        if (apiModel === 'ChatGPTAPI') {
            if ((0, is_1.isNotEmptyString)(systemMessage))
                options.systemMessage = systemMessage;
            options.completionParams = { model, temperature, top_p };
        }
        if (lastContext != null) {
            if (apiModel === 'ChatGPTAPI')
                options.parentMessageId = lastContext.parentMessageId;
            else
                options = { ...lastContext };
        }
        const response = await api.sendMessage(message, {
            ...options,
            onProgress: (partialResponse) => {
                process?.(partialResponse);
            },
        });
        return (0, utils_1.sendResponse)({ type: 'Success', data: response });
    }
    catch (error) {
        const code = error.statusCode;
        global.console.log(error);
        if (Reflect.has(ErrorCodeMessage, code))
            return (0, utils_1.sendResponse)({ type: 'Fail', message: ErrorCodeMessage[code] });
        return (0, utils_1.sendResponse)({ type: 'Fail', message: error.message ?? 'Please check the back-end console' });
    }
}
exports.chatReplyProcess = chatReplyProcess;
async function fetchUsage() {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL;
    if (!(0, is_1.isNotEmptyString)(OPENAI_API_KEY))
        return Promise.resolve('-');
    const API_BASE_URL = (0, is_1.isNotEmptyString)(OPENAI_API_BASE_URL)
        ? OPENAI_API_BASE_URL
        : 'https://api.openai.com';
    const [startDate, endDate] = formatDate();
    // 每月使用量
    const urlUsage = `${API_BASE_URL}/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`;
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };
    const options = {};
    setupProxy(options);
    try {
        // 获取已使用量
        const useResponse = await options.fetch(urlUsage, { headers });
        if (!useResponse.ok)
            throw new Error('获取使用量失败');
        const usageData = await useResponse.json();
        const usage = Math.round(usageData.total_usage) / 100;
        return Promise.resolve(usage ? `$${usage}` : '-');
    }
    catch (error) {
        global.console.log(error);
        return Promise.resolve('-');
    }
}
function formatDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const lastDay = new Date(year, month, 0);
    const formattedFirstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const formattedLastDay = `${year}-${month.toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;
    return [formattedFirstDay, formattedLastDay];
}
async function chatConfig() {
    const usage = await fetchUsage();
    const reverseProxy = process.env.API_REVERSE_PROXY ?? '-';
    const httpsProxy = (process.env.HTTPS_PROXY || process.env.ALL_PROXY) ?? '-';
    const socksProxy = (process.env.SOCKS_PROXY_HOST && process.env.SOCKS_PROXY_PORT)
        ? (`${process.env.SOCKS_PROXY_HOST}:${process.env.SOCKS_PROXY_PORT}`)
        : '-';
    return (0, utils_1.sendResponse)({
        type: 'Success',
        data: { apiModel, reverseProxy, timeoutMs, socksProxy, httpsProxy, usage },
    });
}
exports.chatConfig = chatConfig;
function setupProxy(options) {
    if ((0, is_1.isNotEmptyString)(process.env.SOCKS_PROXY_HOST) && (0, is_1.isNotEmptyString)(process.env.SOCKS_PROXY_PORT)) {
        const agent = new socks_proxy_agent_1.SocksProxyAgent({
            hostname: process.env.SOCKS_PROXY_HOST,
            port: process.env.SOCKS_PROXY_PORT,
            userId: (0, is_1.isNotEmptyString)(process.env.SOCKS_PROXY_USERNAME) ? process.env.SOCKS_PROXY_USERNAME : undefined,
            password: (0, is_1.isNotEmptyString)(process.env.SOCKS_PROXY_PASSWORD) ? process.env.SOCKS_PROXY_PASSWORD : undefined,
        });
        options.fetch = (url, options) => {
            return fetch(url, { agent, ...options });
        };
    }
    else if ((0, is_1.isNotEmptyString)(process.env.HTTPS_PROXY) || (0, is_1.isNotEmptyString)(process.env.ALL_PROXY)) {
        const httpsProxy = process.env.HTTPS_PROXY || process.env.ALL_PROXY;
        if (httpsProxy) {
            const agent = new HttpsProxyAgent(httpsProxy);
            options.fetch = (url, options) => {
                return fetch(url, { agent, ...options });
            };
        }
    }
    else {
        options.fetch = (url, options) => {
            return fetch(url, { ...options });
        };
    }
}
function currentModel() {
    return apiModel;
}
exports.currentModel = currentModel;
