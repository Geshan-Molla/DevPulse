import type { Response } from "express";


type CommonResponse<T> = {
    status: number;
    success: boolean;
    message?: string;
    data?: T;
}

const commonResponse = <T>(res: Response, data: CommonResponse<T>) => {
    res.status(data.status).json(
        {
            success: data.success,
            message: data.message,
            data: data.data,
        }
    )

}

export default commonResponse;