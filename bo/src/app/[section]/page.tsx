import { ConstructionIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allNavItems } from "@/lib/nav";

// Trang tạm cho các mục menu chưa làm
export function generateStaticParams() {
  return allNavItems.filter((i) => i.href !== "/").map((i) => ({ section: i.href.slice(1) }));
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const item = allNavItems.find((i) => i.href === `/${section}`);
  if (!item) notFound();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <ConstructionIcon className="size-6 text-ember" />
      </span>
      <h2 className="font-heading text-2xl font-semibold">{item.label}</h2>
      <p className="text-muted-foreground">Trang này đang được xây dựng.</p>
      <Link href="/" className="text-sm font-medium text-ember underline-offset-4 hover:underline">
        Về Dashboard
      </Link>
    </div>
  );
}
