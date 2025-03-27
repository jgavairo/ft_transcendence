"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    console.log("username: " + username, "password: " + password);
    res.json({
        success: true,
        message: "Login successful",
        user: {
            username: username,
            email: username + "@gmail.com"
        }
    });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//npx ts-node src/server.ts
