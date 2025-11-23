import DecorativeElements from "@/components/DecorativeElements";
import Footer from "@/components/Footer";

export default function Container({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-linear-to-br from-neutral-bg-light to-neutral-bg flex flex-col">
            <main className="flex-1 flex flex-col items-center px-4 mb-12">
                {children}
            </main>
            <Footer />
            <DecorativeElements />
        </div>
    );
}