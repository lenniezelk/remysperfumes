interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'info' | 'error' | 'neutral';
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    return <button
        className={`btn btn-${variant} ${className}`}
        {...props}
    />
}