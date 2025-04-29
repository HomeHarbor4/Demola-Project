import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MessagesManagement } from "@/components/admin/MessagesManagement";

export default function MessagesPage() {
  return (
    <AdminLayout>
      <MessagesManagement />
    </AdminLayout>
  );
}