import { DataOrbitZoneManager } from "@/components/admin/DataOrbitZoneManager";

export default function AdminNew() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">DataOrbitZone Admin</h1>
        <DataOrbitZoneManager />
      </div>
    </div>
  );
}
