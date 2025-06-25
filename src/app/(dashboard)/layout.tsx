import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/modules/dashboard/ui/components/dashboard-sidebar";

interface Props {
    children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto bg-muted p-4 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}