"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTempFile = cleanupTempFile;
const promises_1 = __importDefault(require("fs/promises"));
async function cleanupTempFile(filePath) {
    try {
        await promises_1.default.unlink(filePath);
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}
//# sourceMappingURL=fileUtils.js.map