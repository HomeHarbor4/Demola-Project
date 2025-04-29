import React, { useEffect } from "react"; // Import useEffect
import { useLocation } from "wouter"; // Import useLocation for redirection
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/Spinner"; // Import a Spinner component

export default function AddProperty() {
  // --- Use AuthContext ---
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation(); // Get the setLocation function

  // --- Redirect Logic (Waits for Loading) ---
  useEffect(() => {
    // Only redirect if loading is finished AND there's no user
    if (!isLoading && !user) {
      console.log('AddProperty Page: Redirecting to /signin because user is not found and not loading.');
      // Optional: You could pass the current path to redirect back after login
      // setLocation(`/signin?redirect=/add-property`);
      setLocation('/signin'); // Redirect to signin page
    }
  }, [user, isLoading, setLocation]); // Dependencies: user, isLoading, setLocation

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <Spinner /> {/* Display spinner while loading */}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // --- User Not Found (After Loading) ---
  // This case should ideally not be reached if the useEffect redirects correctly,
  // but it's a safeguard. Return null to prevent rendering the form briefly before redirect.
  if (!user) {
     return null;
  }

  // --- Render Form (Only if user is loaded and exists) ---
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">List Your Property</CardTitle>
              <CardDescription>
                Enter the details of your property to list it on our platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Pass the user ID to the form if needed */}
              <PropertyForm userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
