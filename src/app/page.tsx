import { Header } from "@/components/Header";
import { ImageAgentCard } from "@/components/ImageAgentCard";
import { ScrapeAgentCard } from "@/components/ScrapeAgentCard";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ImageAgentCard />
          <ScrapeAgentCard />
        </div>
      </main>
    </div>
  );
}
