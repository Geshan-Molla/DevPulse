import type { NextFunction, Request, Response } from "express";
import commonResponse from "../utils/commonResponse";
import jwtValidation from "../utils/jwtValidation";
import { fetchUserByEmail } from "../utils/fetchUserByEmail";
import { fetchIssueById } from "../utils/fetchIssueById";
import commonError from "../utils/commonError";


export const updateIssuesMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const {id} = req.params;

        //get token from headers
        const token = req.headers.authorization;

        // if token available 
        if (!token) {
            return commonError(res, { status: 401, success: false, message: "Unauthorized" , error: "No token provided" })
        }

        // if available then verify
        const decoded = jwtValidation(token);

        if (!decoded || !decoded.email || !Object.keys(decoded).every(key => ["id", "name", "email", "role", "iat", "exp"].includes(key))) {
            return commonError(res, { status: 401, success: false, message: "Unauthorized" , error: "Invalid token" })
        }

        // query for user by decoded.email
        const fetchUser = await fetchUserByEmail(decoded.email as string);

        // query for issue by id
        const fetchIssue = await fetchIssueById(id as string);

        const singleUser = fetchUser.rows[0];
        const singleIssue = fetchIssue.rows[0];

        if(fetchUser.rows.length === 0){
            return commonError(res, { status: 401, success: false, message: "Unauthorized" , error: "No user found with the provided email" })
        }

        if(fetchIssue.rows.length === 0){
            return commonError(res, { status: 404, success: false, message: "Issue not found", error: "No issue found with the provided id" })
        }

        //Maintainer (unknown issue) OR Contributor (own issue, only if status is open)
        if(singleUser.role === "maintainer" || (singleUser.role === "contributor" && singleIssue.reporter_id === singleUser.id && singleIssue.status === "open")){
            next();
        }
        else{
            return commonError(res, { status: 403, success: false, message: "Forbidden" , error: "You don't have permission to update this issue"})
        }

    } catch (error: unknown) {
        commonError(res, { status: 401, success: false, message: "Unauthorized", error: error instanceof Error ? error.message : "An unknown error occurred"})
    }
}