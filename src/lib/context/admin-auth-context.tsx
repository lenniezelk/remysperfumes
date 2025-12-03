import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext } from "react";
import { useQuery } from '@tanstack/react-query'
import type { User } from "@/lib/types";
import { getCurrentAdminUser } from "@/lib/server/auth/auth";

interface AdminAuthContext {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
};

const AdminUserAuthContext = createContext<AdminAuthContext | undefined>(undefined);

export function AdminAuthenticationProvider({ children }: { children: React.ReactNode }) {
    const getUser = useServerFn(getCurrentAdminUser);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['currentAdminUser'],
        queryFn: () => getUser()
    })

    const value = {
        user: data?.status === "SUCCESS" ? data.data : null,
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