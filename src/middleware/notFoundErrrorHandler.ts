import type { NextFunction, Request, Response } from "express";


export const notFoundErrorHandler = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        error: `Cannot ${req.method} ${req.originalUrl}`
    });
}