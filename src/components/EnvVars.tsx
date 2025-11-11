import { EnvVars } from "@/lib/types";
import React from "react";

export const EnvVarsContext = React.createContext<EnvVars | undefined>(undefined);

export const useEnvVars = (): EnvVars => {
    const context = React.useContext(EnvVarsContext);
    if (!context) {
        throw new Error("useEnvVars must be used within an EnvVarsProvider");
    }
    return context;
};

export const EnvVarsProvider: React.FC<{ children: React.ReactNode; envVars: EnvVars }> = ({ children, envVars }) => {
    return (
        <EnvVarsContext.Provider value={envVars}>
            {children}
        </EnvVarsContext.Provider>
    );
};
