import type { Request, Response } from "express";
import { userService } from "./user.service";
import commonResponse from "../../utils/commonResponse";
import type { ILoginUser, IUser } from "./user.interface";
import commonError from "../../utils/commonError";


const signup = async (req: Request, res: Response) => {
    try {

        const result = await userService.createUser(req.body as IUser);

        commonResponse(res, { status: 201, success: true, message: "User registered successfully", data: result })

    } catch (error: unknown) {
        // console.log(error);
        commonError(res, { status: 500, success: false, message: "Failed to register user", error: error instanceof Error ? error.message : "An unknown error occurred" })

    }
}


const login = async (req: Request, res: Response) => {
    try {
        const result = await userService.loginUser(req.body as ILoginUser);

        commonResponse(res, { status: 200, success: true, message: "Login successful", data: result });

    } catch (error: unknown) {
        commonError(res, { status: 500, success: false, message: "Failed to login", error: error instanceof Error ? error.message : "An unknown error occurred" });
    }
};

export const userController = { signup, login };