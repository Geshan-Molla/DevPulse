import type { Response } from "express";

type CommonError<T> = {
    status: number;
    success: false;
    message?: string;
    error?: T;
}

const commonError = <T>(res: Response, payload: CommonError<T>) => {
    res.status(payload.status).json(
        {
            success: false,
            message: payload.message,
            errors: payload.error,
        }
    )

}

export default commonError;