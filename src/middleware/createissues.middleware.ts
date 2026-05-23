import type { NextFunction, Request, Response } from "express";
import commonResponse from "../utils/commonResponse";
import jwtValidation from "../utils/jwtValidation";
import { fetchUserByEmail } from "../utils/fetchUserByEmail";

export const createIssuesMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    try {
        //get token from headers
        const token = req.headers.authorization;

        // if token available 
        if (!token) {
            return commonResponse(res, { status: 401, success: false, message: "Unauthorized" })
        }

        // if available then verify
        const decoded = jwtValidation(token);

        // query for user by decoded.email
        const fetchUser = await fetchUserByEmail(decoded.email);

        if(fetchUser.rows.length === 0){
            return commonResponse(res, { status: 401, success: false, message: "Unauthorized" })
        }

        req.user = decoded

        next();

    } catch (error: any) {
        commonResponse(res, { status: 401, success: false, message: "Unauthorized", errors: error.message })
    }
}
