import { Pool } from "pg";
import config from "../config/env.config";

export const pool = new Pool({
    connectionString: config.connection_string,
})

export const db_init = async () => {
    try {
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS users(
                id SERIAL,
                name VARCHAR(50) NOT NULL,
                email VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(30) DEFAULT 'contributor',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK (role IN ('contributor', 'maintainer'))
            )
            `
        );

        await pool.query(
            ` 
            CREATE TABLE IF NOT EXISTS issues(
                id SERIAL,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                type VARCHAR(30) NOT NULL,
                status VARCHAR(30) DEFAULT 'open',
                reporter_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK(char_length(description) >= 20)
            )
            `
        )

        console.log("Database connected successully ")

    } catch (error) {
        
        console.error("Error connecting to database:", error);
    }
}
