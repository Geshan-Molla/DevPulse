import express from "express";
import { userRouter } from "./modules/Authentication/user.route";
import { issuesRouter } from "./modules/Issues/issues.route";
import globalErrorHandler from "./middleware/globarErrorHandler";
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.use('/api/auth', userRouter);
app.use('/api/issues', issuesRouter);

app.use(globalErrorHandler);

export default app;