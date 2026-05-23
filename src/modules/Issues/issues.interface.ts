export interface IIssues {
    title: string;
    description: string;
    type: string;
    status?: string;
}

export const IssuesTypes = {
    bug: "bug",
    feature_request: "feature_request",
} 

export type IssuesType = typeof IssuesTypes[keyof typeof IssuesTypes];

export const IssuesStatus = {
    open: "open",
    in_progress: "in_progress",
    resolved: "resolved"
}
export type IssuesStatusType = typeof IssuesStatus[keyof typeof IssuesStatus];


export type QueryType ={
    sort: "newest" | "oldest" | undefined;
    type : IssuesType | undefined;
    status : IssuesStatusType | undefined;
}

export const AllowedSortValues = ['newest', 'oldest', undefined] as const;
export const AllowedTypeValues = [IssuesTypes.bug, IssuesTypes.feature_request, undefined] as const;
export const AllowedStatusValues = [IssuesStatus.open, IssuesStatus.in_progress, IssuesStatus.resolved, undefined] as const;

export type Reporter = {
    id: number;
    name: string;
    role: string;
}

export type IssuesResponse = {
    id: number;
    title: string;
    description: string;
    type: IssuesType;
    status: IssuesStatusType;
    reporter: Reporter;
    created_at: Date;
    updated_at: Date;
}