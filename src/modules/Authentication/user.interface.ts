

export const AllowedRoles = ['maintainer', 'contributor'] as const;

export interface IUser {
    name: string;
    email: string;
    password: string;
    role?: typeof AllowedRoles[number];
}

export interface ILoginUser {
    email: string;
    password: string;
}
