import { DataOrbitZoneManager } from "@/components/admin/DataOrbitZoneManager";
import { SearchProjectManager } from "@/components/admin/SearchProjectManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminNew() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">External Projects Admin</h1>
        <Tabs defaultValue="dataorbitzone">
          <TabsList>
            <TabsTrigger value="dataorbitzone">DataOrbitZone</TabsTrigger>
            <TabsTrigger value="searchproject">SearchProject</TabsTrigger>
          </TabsList>
          <TabsContent value="dataorbitzone">
            <DataOrbitZoneManager />
          </TabsContent>
          <TabsContent value="searchproject">
            <SearchProjectManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
