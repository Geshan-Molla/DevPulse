import jwt from 'jsonwebtoken';
import type { IJwtPayload } from '../types/jwtPayload.interface';


const jwtValidation = (token: string): IJwtPayload => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as IJwtPayload;
    return decoded
}

export default jwtValidation;