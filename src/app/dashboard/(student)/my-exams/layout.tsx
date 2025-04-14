export default function MyExamsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* <header className="sticky top-0 z-10 border-b bg-background"></header> */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
