export default function Footer() {
    return (
        <footer className="px-4 pb-6 text-center text-sm text-neutral-text-secondary">
            © {new Date().getFullYear()} Remi's Perfumes • Website by{' '}
            <a
                href="https://lennyk.dev/"
                className="text-accent hover:text-accent-dark transition-colors"
                target="_blank"
                rel="noreferrer"
            >
                LennyK
            </a>
        </footer>
    )
}