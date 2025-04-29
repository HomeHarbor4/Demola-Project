import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserForm } from "@/components/admin/UserForm";

export default function CreateUser() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add New User</h2>
          <p className="text-muted-foreground">
            Create a new user account in the system
          </p>
        </div>
        
        <UserForm />
      </div>
    </AdminLayout>
  );
}