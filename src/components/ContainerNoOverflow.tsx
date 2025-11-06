import DecorativeElements from "@/components/DecorativeElements";
import Footer from "@/components/Footer";

export default function ContainerNoOverflow({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-linear-to-br from-neutral-bg-light to-neutral-bg flex flex-col overflow-hidden">
            <main className="flex-1 flex items-center justify-center px-4">
                {children}
            </main>
            <Footer />
            <DecorativeElements />
        </div>
    );
}