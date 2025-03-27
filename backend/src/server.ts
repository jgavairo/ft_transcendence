import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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