interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

export function TextArea({ hasError, className, ...props }: TextAreaProps) {
    return <textarea
        className={`textarea w-full ${hasError ? 'textarea-error' : ''} ${className}`}
        {...props}
    />
}