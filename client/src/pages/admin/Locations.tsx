import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LocationsManagement } from "@/components/admin/LocationsManagement";

export default function LocationsPage() {
  return (
    <AdminLayout>
      <LocationsManagement />
    </AdminLayout>
  );
}