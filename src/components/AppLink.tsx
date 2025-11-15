import { LinkComponentProps, Link } from "@tanstack/react-router";

interface AppLinkProps extends LinkComponentProps { }

export default function AppLink({ className, ...props }: AppLinkProps) {
    return <Link className={`link ${className ?? ''}`} {...props} />;
}