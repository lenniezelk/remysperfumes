interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

export function Input({ hasError, className, ...props }: InputProps) {
    return <input
        className={`input w-full ${hasError ? 'input-error' : ''} ${className}`}
        {...props}
    />
}