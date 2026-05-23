export interface IIssues {
    title: string;
    description: string;
    type: IssuesType;
}

export const issuesTypes = {
    bug: "bug",
    feature_request: "feature_request",
} as const;

export type IssuesType = typeof issuesTypes[keyof typeof issuesTypes];

export const IssuesStatus = {
    open: "open",
    in_progress: "in_progress",
    resolved: "resolved"
} as const;
export type IssuesStatusType = typeof IssuesStatus[keyof typeof IssuesStatus];


export type QueryType ={
    sort: "newest" | "oldest" | undefined;
    type : IssuesType | undefined;
    status : IssuesStatusType | undefined;
}

export const AllowedSortValues = ['newest', 'oldest', undefined] as const;
export const AllowedTypeValues = [issuesTypes.bug, issuesTypes.feature_request, undefined] as const;
export const AllowedStatusValues = [IssuesStatus.open, IssuesStatus.in_progress, IssuesStatus.resolved, undefined] as const;

export type Reporter = {
    id: number;
    name: string;
    role: string;
}

export type IssuesResponseType = {
    id: number;
    title: string;
    description: string;
    type: IssuesType;
    status: IssuesStatusType;
    reporter: Reporter;
    created_at: Date;
    updated_at: Date;
}