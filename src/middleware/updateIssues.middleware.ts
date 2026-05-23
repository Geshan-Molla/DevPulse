import type { NextFunction, Request, Response } from "express";
import commonResponse from "../utils/commonResponse";
import jwtValidation from "../utils/jwtValidation";
import { fetchUserByEmail } from "../utils/fetchUserByEmail";
import { fetchIssueById } from "../utils/fetchIssueById";


export const updateIssuesMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const {id} = req.params;

        //get token from headers
        const token = req.headers.authorization;

        // if token available 
        if (!token) {
            return commonResponse(res, { status: 401, success: false, message: "Unauthorized" })
        }

        // if available then verify
        const decoded = jwtValidation(token);

        // query for user by decoded.email
        const fetchUser = await fetchUserByEmail(decoded.email as string);

        // query for issue by id
        const fetchIssue = await fetchIssueById(id as string);

        const singleUser = fetchUser.rows[0];
        const singleIssue = fetchIssue.rows[0];

        if(fetchUser.rows.length === 0){
            return commonResponse(res, { status: 401, success: false, message: "Unauthorized" })
        }

        if(fetchIssue.rows.length === 0){
            return commonResponse(res, { status: 404, success: false, message: "Issue not found" })
        }

        //Maintainer (any issue) OR Contributor (own issue, only if status is open)
        if(singleUser.role === "maintainer" || (singleUser.role === "contributor" && singleIssue.reporter_id === singleUser.id && singleIssue.status === "open")){
            next();
        }
        else{
            return commonResponse(res, { status: 403, success: false, message: "Forbidden" , errors: "You don't have permission to update this issue"})
        }

    } catch (error: any) {
        commonResponse(res, { status: 401, success: false, message: "Unauthorized", errors: error.message })
    }
}