import { Query } from "pg";
import { pool } from "../../db";
import type { IJwtPayload } from "../../types/jwtPayload.interface";
import {AllowedSortValues, AllowedStatusValues, AllowedTypeValues, IssuesStatus, IssuesTypes, type IIssues , type IssuesResponse, type QueryType } from "./issues.interface";

const createIssuesInDatabase = async (user: IJwtPayload, body: IIssues) => {

    const { id } = user;
    const { title, description, type, status } = body;

     if (title.length > 150 || description.length < 20 || !AllowedTypeValues.includes(type) || (status && !AllowedStatusValues.includes(status))) {
        throw new Error("Invalid input data");
    }

    const result = await pool.query(
        `
            INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
        `, [title, description, type, id]
    )

    const data = result.rows[0];
    return data;
}



const getIssuesFromDatabase = async (query : QueryType) =>{

    if(query.sort && !AllowedSortValues.includes(query.sort) || (query.type && !AllowedTypeValues.includes(query.type)) || (query.status && !AllowedStatusValues.includes(query.status))){
        throw new Error("Invalid query parameters");
    }

    if(query.sort === undefined || query.sort.length === 0){
        query.sort = "newest";
    }

    const issues = await pool.query(
        `
        SELECT * FROM issues
        `
    )
    const repoerterIds = issues.rows.map(issue => issue.reporter_id);

    const reporters = await pool.query(
        `
        SELECT * FROM users WHERE id = ANY($1)
        `, [repoerterIds]
    )

    const result = issues.rows.map(issue =>{
        const reporter = reporters.rows.find((reporter) => reporter.id === issue.reporter_id);
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

    const finalResult = query.sort === "newest" ? result.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()) : result.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

    const filteredResult = finalResult.filter(issue => {
        if(query.type && query.status){
            return issue.type === query.type && issue.status === query.status;
        } else if(query.type){
            return issue.type === query.type;
        } else if(query.status){
            return issue.status === query.status;
        } else {
            return true;
        }
    })

    return filteredResult;

}


const getIssuesByIdFromDatabase = async (id : string) =>{
    
    const issue = await pool.query(
        `
        SELECT * FROM issues WHERE id = $1
        `, [id]
    )

    const singleIssue = issue.rows[0];

    if(!singleIssue){
        throw new Error("Issue not found");
    }

    const reporter = await pool.query(
        `
        SELECT * FROM users WHERE id = $1
        `, [singleIssue.reporter_id]
    )

    const reporterData = reporter.rows[0];
    delete reporterData.password;

    const result = {
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



export const issuesService = {
    createIssuesInDatabase,
    getIssuesFromDatabase,
    getIssuesByIdFromDatabase
}