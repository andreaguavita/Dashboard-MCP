import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type AgentCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function AgentCard({ title, description, icon: Icon, children, className }: AgentCardProps) {
  return (
    <Card className={cn("flex flex-col shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {children}
      </CardContent>
    </Card>
  );
}
