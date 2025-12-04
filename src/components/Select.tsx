interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
}

export function Select({ hasError, className, children, ...props }: SelectProps) {
    return <select
        className={`select w-full ${hasError ? 'select-error' : ''} ${className}`}
        {...props}
    >
        {children}
    </select>
}
