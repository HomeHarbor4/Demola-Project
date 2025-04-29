import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PropertyForm } from "@/components/admin/PropertyForm";

export default function CreateProperty() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add New Property</h2>
          <p className="text-muted-foreground">
            Create a new property listing in the system
          </p>
        </div>
        
        <PropertyForm />
      </div>
    </AdminLayout>
  );
}