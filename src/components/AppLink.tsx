import { Link } from "@tanstack/react-router";
import type { LinkComponentProps} from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AppLinkProps extends LinkComponentProps {
    disabled?: boolean;
    title?: string;
    children?: ReactNode;
}

export default function AppLink({ className, disabled, title, children, ...props }: AppLinkProps) {
    if (disabled) {
        return (
            <span
                className={`link cursor-not-allowed ${className ?? ''}`}
                title={title || 'This action is not available'}
            >
                {children}
            </span>
        );
    }
    return <Link className={`link ${className ?? ''}`} {...props}>{children}</Link>;
}