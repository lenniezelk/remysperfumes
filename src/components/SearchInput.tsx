import { SearchIcon } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

export function SearchInput({ hasError, className, ...props }: SearchInputProps) {
    return (
        <label className="input">
            <SearchIcon className="w-5 h-5 opacity-50" />
            <input
                type="search"
                className={`w-full ${hasError ? 'input-error' : ''} ${className}`}
                {...props}
            />
        </label>
    )
}