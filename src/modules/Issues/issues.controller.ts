import type { Request, Response } from "express";
import commonResponse from "../../utils/commonResponse";
import { issuesService } from "./issues.service";
import type { IJwtPayload } from "../../types/jwtPayload.interface";
import type { IIssues, QueryType } from "./issues.interface";

const createIssues = async (req: Request, res: Response) => {
    try {

        const result = await issuesService.createIssuesInDatabase(req.user as IJwtPayload, req.body as IIssues);
        commonResponse(res, { status: 201, success: true, message: "Issues created successfully", data: result })
    } catch (error: any) {
        commonResponse(res, { status: 400, success: false, message: "Failed to create issues", errors: error.message })
    }
}

const getIssues = async (req: Request, res: Response) => {
    try {
        const query = req.query as QueryType ;

        const result = await issuesService.getIssuesFromDatabase(query);
        commonResponse(res, { status: 200, success: true, data: result })
        
    } catch (error : any) {
        commonResponse(res, { status: 400, success: false, message: "Failed to retrieve issues", errors: error.message })
    }
}
    
const getIssuesById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await issuesService.getIssuesByIdFromDatabase(id as string);
        commonResponse(res, { status: 200, success: true, data: result })
    } catch (error : any) {
        commonResponse(res, { status: 400, success: false, message: "Failed to retrieve issue", errors: error.message })
    }
}

const updateIssues = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await issuesService.updateIssuesInDatabase(id as string, req.body as IIssues);
        commonResponse(res, { status: 200, success: true, message: "Issue updated successfully", data: result })
        
    } catch (error : any) {
        commonResponse(res, { status: 400, success: false, message: "Failed to update issue", errors: error.message })
    }
}

const deleteIssues = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await issuesService.deleteIssuesFromDatabase(id as string);
        commonResponse(res, { status: 204, success: true, message: "Issue deleted successfully" })
    } catch (error : any) {
        commonResponse(res, { status: 400, success: false, message: "Failed to delete issue", errors: error.message })
    }
}

export const issuesController = {
    createIssues,
    getIssues,
    getIssuesById,
    updateIssues,
    deleteIssues
}