interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    children: React.ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ level, children, className, ...props }) => {
    switch (level) {
        case 1:
            return <h1 className={`text-4xl md:text-6xl font-bold text-primary ${className}`} {...props}>{children}</h1>;
        case 2:
            return <h2 className={`text-3xl md:text-5xl font-bold text-primary ${className}`} {...props}>{children}</h2>;
        case 3:
            return <h3 className={`text-2xl md:text-4xl font-bold text-primary ${className}`} {...props}>{children}</h3>;
        case 4:
            return <h4 className={`text-primary ${className}`} {...props}>{children}</h4>;
        case 5:
            return <h5 className={`text-primary ${className}`} {...props}>{children}</h5>;
        case 6:
            return <h6 className={`text-primary ${className}`} {...props}>{children}</h6>;
        default:
            return <h1 className={`text-primary ${className}`} {...props}>{children}</h1>;
    }
}

export default Heading;