
import config from "../../config/env.config";
import { pool } from "../../db";
import type { IJwtPayload } from "../../types/jwtPayload.interface";
import { AllowedRoles, type ILoginUser, type IUser } from "./user.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { fetchUserByEmail } from "../../utils/fetchUserByEmail";

const createUser = async (payload: IUser) => {

    const { name, email, password, role } = payload;

    // 1. Check for required fields
    if (!name || !email || !password || !role) {
        throw new Error("Missing required fields");
    }

    // 2. Validate formats
    if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error("Fields cannot be empty strings");
    }

    // 3. Validate Role
    if (role && !AllowedRoles.includes(role)) {
        throw new Error("Invalid role");
    }

    // 4. Check for extra keys
    const allowedKeys = ["name", "email", "password", "role"];
    const hasExtraKeys = Object.keys(payload).some(key => !allowedKeys.includes(key));
    if (hasExtraKeys) {
        throw new Error("Payload contains invalid fields");
    }

    // valid email regx
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }

    //check existing user by email
    const existingUser = await fetchUserByEmail(email);
    if (existingUser.rows.length > 0) {
        throw new Error("Email already exists");
    }

    // hashed password
    const hashedPassword = bcrypt.hashSync(password, 12);

    // insert user to database
    const result = await pool.query(
        `
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *
        `,
        [name, email, hashedPassword, role]
    );

    delete result.rows[0].password
    return result.rows[0];
}

const loginUser = async (payload: ILoginUser) => {

    // check if payload only has the email and password properties
    const payloadKeys = Object.keys(payload);
    if (payloadKeys.length !== 2 || !payloadKeys.includes("email") || !payloadKeys.includes("password")) {
        throw new Error("Invalid input");
    }

    const { email, password } = payload;

    const result = await pool.query(
        `
        SELECT * FROM users WHERE email = $1
        `, [email]
    )

    if (result.rows.length === 0) {
        throw new Error("Invalid email or password")
    }

    const user = result.rows[0];

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid email or password")
    }

    delete user.password;

    const jwtPayload: IJwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, { expiresIn: "1d" })

    return {
        token: accessToken,
        user: user
    }
}

export const userService = { createUser, loginUser };