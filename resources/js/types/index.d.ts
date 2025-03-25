import { AxiosInstance } from 'axios';
import ziggyRoute from 'ziggy-js';

export interface Category {
    id: number;
    name: string;
    description: string | null;
    clients_count: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    preferred_language?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    ziggy: {
        url: string;
        port: null;
        defaults: [];
        routes: Record<string, string>;
    };
};
