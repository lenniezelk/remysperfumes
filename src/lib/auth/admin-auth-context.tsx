import { User } from "@/lib/types";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext } from "react";
import { getCurrentAdminUser } from "@/lib/auth/auth";
import { useQuery } from '@tanstack/react-query'

interface AdminAuthContext {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
};

const AdminUserAuthContext = createContext<AdminAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const getUser = useServerFn(getCurrentAdminUser);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['currentAdminUser'],
        queryFn: () => getUser()
    })

    const value = {
        user: data?.data || null,
        isLoading,
        error,
        refetch
    };

    return (
        <AdminUserAuthContext.Provider value={value}>
            {children}
        </AdminUserAuthContext.Provider>
    );
};

export function useAdminAuth() {
    const context = useContext(AdminUserAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AuthProvider');
    }
    return context;
}