import type { Request, Response } from "express";
import { userService } from "./user.service";
import commonResponse from "../../utils/commonResponse";
import type { ILoginUser, IUser } from "./user.interface";


const signup = async (req: Request, res: Response) => {
    try {

        const result = await userService.createUser(req.body as IUser);

        commonResponse(res, { status: 201, success: true, message: "User registered successfully", data: result })

    } catch (error: any) {

        commonResponse(res, { status: 500, success: false, message: "Failed to register user", errors: error.message })

    }
}


const login = async (req: Request, res: Response) => {
    try {
        const result = await userService.loginUser(req.body as ILoginUser);

        commonResponse(res, { status: 200, success: true, message: "Login successful", data: result });

    } catch (error: any) {
        
        commonResponse(res, { status: 500, success: false, message: "Failed to login", errors: error.message });
    }
};

export const userController = { signup, login };