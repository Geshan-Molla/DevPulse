import { pool } from "../db"

export const fetchIssueById = async (id: string) => {
    const fetchIssue = await pool.query(
                `
                SELECT * FROM issues WHERE id = $1
                `, [id]
            )
    return fetchIssue;
}