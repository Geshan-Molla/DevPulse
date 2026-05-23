import { pool } from "../../db";
import type { IJwtPayload } from "../../types/jwtPayload.interface";
import { AllowedSortValues, AllowedStatusValues, AllowedTypeValues, type IIssues, type IssuesResponseType, type QueryType, type Reporter } from "./issues.interface";
import type { DBIssuesType  } from "../../types/DBIssuesType";
import type { DBUserType } from "../../types/DBUserType";

const createIssuesInDatabase = async (user: IJwtPayload, body: IIssues) => {

    if((body && !Object.keys(body).every(key => ["title", "description", "type"].includes(key))) || !body.title || !body.description || !body.type) {
        throw new Error("Invalid input data");
    }

    const { id } = user;
    const { title, description, type } = body;

    if (title.length > 150 || description.length < 20 || !AllowedTypeValues.includes(type)) {
        throw new Error("Invalid input data");
    }

    const result : { rows: DBIssuesType[] } = await pool.query(
        `
            INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
        `, [title, description, type, id]
    )

    if(result.rows.length === 0){
        throw new Error("Failed to create issue");
    }

    const data  = result.rows[0]!;
    return data;
}

const getIssuesFromDatabase = async (query: QueryType) => {


    if (!Object.keys(query).every(key => ["sort", "type", "status"].includes(key)) ||query.sort && !AllowedSortValues.includes(query.sort) || (query.type && !AllowedTypeValues.includes(query.type)) || (query.status && !AllowedStatusValues.includes(query.status))) {
        throw new Error("Invalid query parameters");
    }

    if (query.sort === undefined || query.sort.length === 0) {
        query.sort = "newest";
    }

    const issues : { rows: DBIssuesType[] } = await pool.query(
        `
        SELECT * FROM issues
        `
    )
    const repoerterIds : number[] = issues.rows.map(issue => issue.reporter_id);

    const reporters : { rows: DBUserType[] } = await pool.query(
        `
        SELECT * FROM users WHERE id = ANY($1)
        `, [repoerterIds]
    )

    const result : IssuesResponseType[]  = issues.rows.map((issue) =>{
        const reporter : Pick<DBUserType, 'id' | 'name' | 'role'> = reporters.rows.find((sReporter) => sReporter.id === issue.reporter_id)!;
        return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: { id: reporter.id, name: reporter.name, role: reporter.role },
            created_at: issue.created_at,
            updated_at: issue.updated_at
        }
    })

    const finalResult : IssuesResponseType[] = query.sort === "newest" ? result.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()) : result.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

    const filteredResult : IssuesResponseType[] = finalResult.filter(issue => {
        if (query.type && query.status) {
            return issue.type === query.type && issue.status === query.status;
        } else if (query.type) {
            return issue.type === query.type;
        } else if (query.status) {
            return issue.status === query.status;
        } else {
            return true;
        }
    })

    return filteredResult;

}

const getIssuesByIdFromDatabase = async (id: string) => {

    if(!id || isNaN(Number(id))) {
        throw new Error("Invalid issue id");
    }

    const issue : { rows: DBIssuesType[] } = await pool.query(
        `
        SELECT * FROM issues WHERE id = $1
        `, [id]
    )

    const singleIssue : DBIssuesType | undefined = issue.rows[0];

    if (!singleIssue) {
        throw new Error("Issue not found");
    }

    const reporter : { rows: DBUserType[] } = await pool.query(
        `
        SELECT * FROM users WHERE id = $1
        `, [singleIssue.reporter_id]
    )

    const reporterData : DBUserType  = reporter.rows[0] !;

    const result : IssuesResponseType = {
        id: singleIssue.id,
        title: singleIssue.title,
        description: singleIssue.description,
        type: singleIssue.type,
        status: singleIssue.status,
        reporter: { id: reporterData.id, name: reporterData.name, role: reporterData.role },
        created_at: singleIssue.created_at,
        updated_at: singleIssue.updated_at
    }
    return result;
}


const updateIssuesInDatabase = async (id: string, body: IIssues) => {
    const { title, description, type } = body;

    if ((title && title.length > 150) || (description && description.length < 20) || (type && !AllowedTypeValues.includes(type))) {
        throw new Error("Invalid input data");
    }

    const result : { rows: DBIssuesType[] } = await pool.query(
        `
        UPDATE issues SET title = COALESCE($1, title), description = COALESCE($2, description), type = COALESCE($3, type), updated_at = NOW() WHERE id = $4 RETURNING *
        `, [title, description, type, id]
    )

    if(result.rows.length === 0){
        throw new Error("Issue not found");
    }

    const data  = result.rows[0]!;

    return data;
}

const deleteIssuesFromDatabase = async (id: string) => {

    const result : { rows: DBIssuesType[] } = await pool.query(
        `
        DELETE FROM issues WHERE id = $1 RETURNING *
        `, [id]
    )

    if(result.rows.length === 0){
        throw new Error("Issue not found");
    }

    const data : DBIssuesType = result.rows[0]!;
    return data;
}


export const issuesService = {
    createIssuesInDatabase,
    getIssuesFromDatabase,
    getIssuesByIdFromDatabase,
    updateIssuesInDatabase,
    deleteIssuesFromDatabase
}