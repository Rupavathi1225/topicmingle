import { DataOrbitZoneManager } from "@/components/admin/DataOrbitZoneManager";
import { SearchProjectManager } from "@/components/admin/SearchProjectManager";
import { PreLandingPageBuilder } from "@/components/admin/PreLandingPageBuilder";
import { RelatedSearchManager } from "@/components/admin/RelatedSearchManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dataOrbitZoneClient } from "@/integrations/dataorbitzone/client";
import { searchProjectClient } from "@/integrations/searchproject/client";
import { supabase } from "@/integrations/supabase/client";

export default function AdminNew() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">External Projects Admin</h1>
        <Tabs defaultValue="dataorbitzone">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dataorbitzone">DataOrbitZone</TabsTrigger>
            <TabsTrigger value="searchproject">SearchProject</TabsTrigger>
            <TabsTrigger value="topicmingle">TopicMingle</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dataorbitzone" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">DataOrbitZone Management</h2>
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="prelanding">Pre-Landing Pages</TabsTrigger>
                  <TabsTrigger value="searches">Related Searches</TabsTrigger>
                </TabsList>
                <TabsContent value="content">
                  <DataOrbitZoneManager />
                </TabsContent>
                <TabsContent value="prelanding">
                  <PreLandingPageBuilder projectClient={dataOrbitZoneClient} />
                </TabsContent>
                <TabsContent value="searches">
                  <RelatedSearchManager projectClient={dataOrbitZoneClient} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          <TabsContent value="searchproject" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">SearchProject Management</h2>
              <Tabs defaultValue="content">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="prelanding">Pre-Landing Pages</TabsTrigger>
                  <TabsTrigger value="searches">Related Searches</TabsTrigger>
                </TabsList>
                <TabsContent value="content">
                  <SearchProjectManager />
                </TabsContent>
                <TabsContent value="prelanding">
                  <PreLandingPageBuilder projectClient={searchProjectClient} />
                </TabsContent>
                <TabsContent value="searches">
                  <RelatedSearchManager projectClient={searchProjectClient} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          <TabsContent value="topicmingle" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">TopicMingle Management</h2>
              <Tabs defaultValue="prelanding">
                <TabsList>
                  <TabsTrigger value="prelanding">Pre-Landing Pages</TabsTrigger>
                  <TabsTrigger value="searches">Related Searches</TabsTrigger>
                </TabsList>
                <TabsContent value="prelanding">
                  <PreLandingPageBuilder projectClient={supabase} />
                </TabsContent>
                <TabsContent value="searches">
                  <RelatedSearchManager projectClient={supabase} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
