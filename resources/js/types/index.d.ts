import { AxiosInstance } from 'axios';
import ziggyRoute from 'ziggy-js';

export interface Category {
    id: number;
    name: string;
    color?: string;
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

export interface Campaign {
    id: number;
    name: string;
    message_content: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'partially_sent' | 'paused' | 'failed' | 'cancelled';
    scheduled_at: string | null;
    recipients_count: number;
    delivered_count: number;
    failed_count: number;
    created_at: string;
    recipients?: Client[];
}
