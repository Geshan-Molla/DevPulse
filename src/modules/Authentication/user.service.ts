import { pool } from "../../db";
import type { IUser } from "./user.interface";
import bcrypt from "bcrypt";

const createUser = async(payload: IUser) =>{

    const {name, email, password, role} = payload;

    const hashedPassword = bcrypt.hashSync(password, 12);

    const result = await pool.query(
        `
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *
        `,
        [name, email, hashedPassword, role]
    );
    
    delete result.rows[0].password
    return result.rows[0];
}

export const userService = {createUser};