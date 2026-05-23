
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/Authentication/user.route.ts
import { Router } from "express";

// src/config/env.config.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var env_config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: env_config_default.connection_string
});
var db_init = async () => {
  try {
    await pool.query(
      `
            CREATE TABLE IF NOT EXISTS users(
                id SERIAL,
                name VARCHAR(50) NOT NULL,
                email VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(30) DEFAULT 'contributor',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK (role IN ('contributor', 'maintainer'))
            )
            `
    );
    await pool.query(
      ` 
            CREATE TABLE IF NOT EXISTS issues(
                id SERIAL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                type VARCHAR(30) NOT NULL,
                status VARCHAR(30) DEFAULT 'open',
                reporter_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK (char_length(description) >= 20),
                CHECK (char_length(title) <= 150),
                CHECK (type IN ('bug', 'feature_request')),
                CHECK (status IN ('open', 'in_progress', 'resolved'))
            )
            `
    );
    console.log("Database connected successully ");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

// src/modules/Authentication/user.interface.ts
var AllowedRoles = ["maintainer", "contributor"];

// src/modules/Authentication/user.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/utils/fetchUserByEmail.ts
var fetchUserByEmail = async (email) => {
  const fetchUser = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email]
  );
  return fetchUser;
};

// src/modules/Authentication/user.service.ts
var createUser = async (payload) => {
  const { name, email, password, role } = payload;
  if (!name || !email || !password || !role) {
    throw new Error("Missing required fields");
  }
  if (!name.trim() || !email.trim() || !password.trim()) {
    throw new Error("Fields cannot be empty strings");
  }
  if (role && !AllowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }
  const allowedKeys = ["name", "email", "password", "role"];
  const hasExtraKeys = Object.keys(payload).some((key) => !allowedKeys.includes(key));
  if (hasExtraKeys) {
    throw new Error("Payload contains invalid fields");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  const existingUser = await fetchUserByEmail(email);
  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }
  const hashedPassword = bcrypt.hashSync(password, 12);
  const result = await pool.query(
    `
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *
        `,
    [name, email, hashedPassword, role]
  );
  delete result.rows[0].password;
  return result.rows[0];
};
var loginUser = async (payload) => {
  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length !== 2 || !payloadKeys.includes("email") || !payloadKeys.includes("password")) {
    throw new Error("Invalid input");
  }
  const { email, password } = payload;
  const result = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email]
  );
  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }
  const user = result.rows[0];
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }
  delete user.password;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, env_config_default.jwt_secret, { expiresIn: "1d" });
  return {
    token: accessToken,
    user
  };
};
var userService = { createUser, loginUser };

// src/utils/commonResponse.ts
var commonResponse = (res, data) => {
  res.status(data.status).json(
    {
      success: data.success,
      message: data.message,
      data: data.data
    }
  );
};
var commonResponse_default = commonResponse;

// src/utils/commonError.ts
var commonError = (res, payload) => {
  res.status(payload.status).json(
    {
      success: false,
      message: payload.message,
      errors: payload.error
    }
  );
};
var commonError_default = commonError;

// src/modules/Authentication/user.controller.ts
var signup = async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    commonResponse_default(res, { status: 201, success: true, message: "User registered successfully", data: result });
  } catch (error) {
    commonError_default(res, { status: 500, success: false, message: "Failed to register user", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var login = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    commonResponse_default(res, { status: 200, success: true, message: "Login successful", data: result });
  } catch (error) {
    commonError_default(res, { status: 500, success: false, message: "Failed to login", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var userController = { signup, login };

// src/modules/Authentication/user.route.ts
var router = Router();
router.post("/signup", userController.signup);
router.post("/login", userController.login);
var userRouter = router;

// src/modules/Issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/Issues/issues.interface.ts
var issuesTypes = {
  bug: "bug",
  feature_request: "feature_request"
};
var IssuesStatus = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved"
};
var AllowedSortValues = ["newest", "oldest", void 0];
var AllowedTypeValues = [issuesTypes.bug, issuesTypes.feature_request, void 0];
var AllowedStatusValues = [IssuesStatus.open, IssuesStatus.in_progress, IssuesStatus.resolved, void 0];

// src/modules/Issues/issues.service.ts
var createIssuesInDatabase = async (user, body) => {
  if (body && !Object.keys(body).every((key) => ["title", "description", "type"].includes(key)) || !body.title || !body.description || !body.type) {
    throw new Error("Invalid input data");
  }
  const { id } = user;
  const { title, description, type } = body;
  if (title.length > 150 || description.length < 20 || !AllowedTypeValues.includes(type)) {
    throw new Error("Invalid input data");
  }
  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
        `,
    [title, description, type, id]
  );
  if (result.rows.length === 0) {
    throw new Error("Failed to create issue");
  }
  const data = result.rows[0];
  return data;
};
var getIssuesFromDatabase = async (query) => {
  if (!Object.keys(query).every((key) => ["sort", "type", "status"].includes(key)) || query.sort && !AllowedSortValues.includes(query.sort) || query.type && !AllowedTypeValues.includes(query.type) || query.status && !AllowedStatusValues.includes(query.status)) {
    throw new Error("Invalid query parameters");
  }
  if (query.sort === void 0 || query.sort.length === 0) {
    query.sort = "newest";
  }
  const issues = await pool.query(
    `
        SELECT * FROM issues
        `
  );
  const repoerterIds = issues.rows.map((issue) => issue.reporter_id);
  const reporters = await pool.query(
    `
        SELECT * FROM users WHERE id = ANY($1)
        `,
    [repoerterIds]
  );
  const result = issues.rows.map((issue) => {
    const reporter = reporters.rows.find((sReporter) => sReporter.id === issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: { id: reporter.id, name: reporter.name, role: reporter.role },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  const finalResult = query.sort === "newest" ? result.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()) : result.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  const filteredResult = finalResult.filter((issue) => {
    if (query.type && query.status) {
      return issue.type === query.type && issue.status === query.status;
    } else if (query.type) {
      return issue.type === query.type;
    } else if (query.status) {
      return issue.status === query.status;
    } else {
      return true;
    }
  });
  return filteredResult;
};
var getIssuesByIdFromDatabase = async (id) => {
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid issue id");
  }
  const issue = await pool.query(
    `
        SELECT * FROM issues WHERE id = $1
        `,
    [id]
  );
  const singleIssue = issue.rows[0];
  if (!singleIssue) {
    throw new Error("Issue not found");
  }
  const reporter = await pool.query(
    `
        SELECT * FROM users WHERE id = $1
        `,
    [singleIssue.reporter_id]
  );
  const reporterData = reporter.rows[0];
  const result = {
    id: singleIssue.id,
    title: singleIssue.title,
    description: singleIssue.description,
    type: singleIssue.type,
    status: singleIssue.status,
    reporter: { id: reporterData.id, name: reporterData.name, role: reporterData.role },
    created_at: singleIssue.created_at,
    updated_at: singleIssue.updated_at
  };
  return result;
};
var updateIssuesInDatabase = async (id, body) => {
  const { title, description, type, status } = body;
  if (title && title.length > 150 || description && description.length < 20 || type && !AllowedTypeValues.includes(type) || status && !AllowedStatusValues.includes(status)) {
    throw new Error("Invalid input data");
  }
  const result = await pool.query(
    `
        UPDATE issues SET title = COALESCE($1, title), description = COALESCE($2, description), type = COALESCE($3, type), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING *
        `,
    [title, description, type, status, id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const data = result.rows[0];
  return data;
};
var deleteIssuesFromDatabase = async (id) => {
  const result = await pool.query(
    `
        DELETE FROM issues WHERE id = $1 RETURNING *
        `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const data = result.rows[0];
  return data;
};
var issuesService = {
  createIssuesInDatabase,
  getIssuesFromDatabase,
  getIssuesByIdFromDatabase,
  updateIssuesInDatabase,
  deleteIssuesFromDatabase
};

// src/modules/Issues/issues.controller.ts
var createIssues = async (req, res) => {
  try {
    const result = await issuesService.createIssuesInDatabase(req.user, req.body);
    commonResponse_default(res, { status: 201, success: true, message: "Issues created successfully", data: result });
  } catch (error) {
    commonError_default(res, { status: 400, success: false, message: "Failed to create issues", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var getIssues = async (req, res) => {
  try {
    const query = req.query;
    const result = await issuesService.getIssuesFromDatabase(query);
    commonResponse_default(res, { status: 200, success: true, data: result });
  } catch (error) {
    commonError_default(res, { status: 400, success: false, message: "Failed to retrieve issues", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var getIssuesById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.getIssuesByIdFromDatabase(id);
    commonResponse_default(res, { status: 200, success: true, data: result });
  } catch (error) {
    commonError_default(res, { status: 400, success: false, message: "Failed to retrieve issue", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var updateIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.updateIssuesInDatabase(id, req.body);
    commonResponse_default(res, { status: 200, success: true, message: "Issue updated successfully", data: result });
  } catch (error) {
    commonError_default(res, { status: 400, success: false, message: "Failed to update issue", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var deleteIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.deleteIssuesFromDatabase(id);
    commonResponse_default(res, { status: 200, success: true, message: "Issue deleted successfully" });
  } catch (error) {
    commonError_default(res, { status: 400, success: false, message: "Failed to delete issue", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};
var issuesController = {
  createIssues,
  getIssues,
  getIssuesById,
  updateIssues,
  deleteIssues
};

// src/utils/jwtValidation.ts
import jwt2 from "jsonwebtoken";
var jwtValidation = (token) => {
  const decoded = jwt2.verify(token, process.env.JWT_SECRET);
  return decoded;
};
var jwtValidation_default = jwtValidation;

// src/middleware/createissues.middleware.ts
var createIssuesMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return commonResponse_default(res, { status: 401, success: false, message: "Unauthorized" });
    }
    const decoded = jwtValidation_default(token);
    if (!decoded || !decoded.email || !Object.keys(decoded).every((key) => ["id", "name", "email", "role", "iat", "exp"].includes(key))) {
      return commonResponse_default(res, { status: 401, success: false, message: "Unauthorized" });
    }
    const fetchUser = await fetchUserByEmail(decoded.email);
    if (fetchUser.rows.length === 0) {
      return commonResponse_default(res, { status: 401, success: false, message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};

// src/utils/fetchIssueById.ts
var fetchIssueById = async (id) => {
  const fetchIssue = await pool.query(
    `
                SELECT * FROM issues WHERE id = $1
                `,
    [id]
  );
  return fetchIssue;
};

// src/middleware/updateIssues.middleware.ts
var updateIssuesMiddleware = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    if (!token) {
      return commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: "No token provided" });
    }
    const decoded = jwtValidation_default(token);
    if (!decoded || !decoded.email || !Object.keys(decoded).every((key) => ["id", "name", "email", "role", "iat", "exp"].includes(key))) {
      return commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: "Invalid token" });
    }
    const fetchUser = await fetchUserByEmail(decoded.email);
    const fetchIssue = await fetchIssueById(id);
    const singleUser = fetchUser.rows[0];
    const singleIssue = fetchIssue.rows[0];
    if (fetchUser.rows.length === 0) {
      return commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: "No user found with the provided email" });
    }
    if (fetchIssue.rows.length === 0) {
      return commonError_default(res, { status: 404, success: false, message: "Issue not found", error: "No issue found with the provided id" });
    }
    if (singleUser.role === "contributor" && (req.body.status && (req.body?.status === "in_progress" || req.body?.status === "resolved"))) {
      return commonError_default(res, { status: 403, success: false, message: "Forbidden", error: "Contributors are not allowed to update the status of an issue" });
    }
    if (singleUser.role === "maintainer" || singleUser.role === "contributor" && singleIssue.reporter_id === singleUser.id && singleIssue.status === "open") {
      next();
    } else {
      return commonError_default(res, { status: 403, success: false, message: "Forbidden", error: "You don't have permission to update this issue" });
    }
  } catch (error) {
    commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};

// src/middleware/deleteIssues.middleware.ts
var deleteIssuesMiddleware = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    if (!token) {
      return commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: "No token provided" });
    }
    const decoded = jwtValidation_default(token);
    if (!decoded || !decoded.email || !Object.keys(decoded).every((key) => ["id", "name", "email", "role", "iat", "exp"].includes(key))) {
      return commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: "Invalid token" });
    }
    const fetchUser = await fetchUserByEmail(decoded.email);
    const fetchIssue = await fetchIssueById(id);
    const singleUser = fetchUser.rows[0];
    const singleIssue = fetchIssue.rows[0];
    if (fetchUser.rows.length === 0) {
      return commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: "No user found with the provided email" });
    }
    if (fetchIssue.rows.length === 0) {
      return commonError_default(res, { status: 404, success: false, message: "Issue not found", error: "No issue found with the provided id" });
    }
    if (singleUser.role === "maintainer") {
      next();
    } else {
      return commonError_default(res, { status: 403, success: false, message: "Forbidden", error: "You don't have permission to delete this issue" });
    }
  } catch (error) {
    commonError_default(res, { status: 401, success: false, message: "Unauthorized", error: error instanceof Error ? error.message : "An unknown error occurred" });
  }
};

// src/modules/Issues/issues.route.ts
var router2 = Router2();
router2.post("/", createIssuesMiddleware, issuesController.createIssues);
router2.get("/", issuesController.getIssues);
router2.get("/:id", issuesController.getIssuesById);
router2.patch("/:id", updateIssuesMiddleware, issuesController.updateIssues);
router2.delete("/:id", deleteIssuesMiddleware, issuesController.deleteIssues);
var issuesRouter = router2;

// src/middleware/globarErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({
    success: false,
    message
  });
};
var globarErrorHandler_default = globalErrorHandler;

// src/middleware/notFoundErrrorHandler.ts
var notFoundErrorHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
};

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/api/auth", userRouter);
app.use("/api/issues", issuesRouter);
app.use(notFoundErrorHandler);
app.use(globarErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  const application = app_default;
  const port = 5e3;
  await db_init();
  application.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};
main();
//# sourceMappingURL=server.js.map