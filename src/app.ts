import express from "express";
import { userRouter } from "./modules/Authentication/user.route";
import { issuesRouter } from "./modules/Issues/issues.route";
import globalErrorHandler from "./middleware/globarErrorHandler";
import { notFoundErrorHandler } from "./middleware/notFoundErrrorHandler";
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.use('/api/auth', userRouter);
app.use('/api/issues', issuesRouter);

// Not Found (404) route handler
app.use(notFoundErrorHandler);

app.use(globalErrorHandler);

export default app;