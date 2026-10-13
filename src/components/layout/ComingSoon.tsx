import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="h-full overflow-y-auto p-6 flex items-center justify-center">
      <Card className="max-w-sm w-full">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={22} />
          </div>
          <h2 className="text-base font-semibold text-[#2C1820]">{title}</h2>
          <p className="text-sm text-[#A87888]">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
