import express from "express";
import { userRouter } from "./modules/Authentication/user.route";
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.use('/api/auth', userRouter);


export default app;