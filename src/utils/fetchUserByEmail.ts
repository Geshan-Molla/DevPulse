import { pool } from "../db";

export const fetchUserByEmail = async (email: string) => {
    const fetchUser = await pool.query(
        `
        SELECT * FROM users WHERE email = $1
        `, [email]
    )
    
    return fetchUser;
    
}