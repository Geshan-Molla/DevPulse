import type { Request, Response } from "express";
import { userService } from "./user.service";
import commonResponse from "../../utils/commonResponse";


const signup = async (req: Request, res: Response) => {
    try{
        const result = await userService.createUser(req.body);

        commonResponse(res, { status: 201, success: true, message: "User registered successfully", data: result})

    } catch (error : any) {

        commonResponse(res, { status: 500, success: false, message: "Failed to register user", errors: error.message})
        
    }
}

export const userController = {signup};