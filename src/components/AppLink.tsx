import { LinkComponentProps, Link } from "@tanstack/react-router";

interface AppLinkProps extends LinkComponentProps { }

export default function AppLink({ className, ...props }: AppLinkProps) {
    return <Link className={`text-blue-600 hover:text-blue-800 underline ${className ?? ''}`} {...props} />;
}