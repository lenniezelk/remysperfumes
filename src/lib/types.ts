export interface Role {
    id: string;
    name: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface AppSession {
    user: User | null;
}

export interface Result<T> {
    success: "SUCCESS" | "ERROR";
    data?: T;
    error?: string;
}