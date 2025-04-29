// src/pages/FindAgents.tsx

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mail, Phone, Star } from "lucide-react"; // Added Star
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

// --- Agent Card Component ---
interface AgentCardProps {
  agent: User;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const agentImage = agent.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name || 'Agent')}&background=random`;
  // --- Use placeholder or derive from role/other data if available ---
  const agentTitle = agent.role === 'agent' ? "Real Estate Agent" : "User";
  // --- Placeholder data - replace if you add these fields to your User schema ---
  const rating = 4.8; // Placeholder
  const reviewCount = Math.floor(Math.random() * 100) + 10; // Placeholder
  const bio = `Contact ${agent.name || 'this agent'} for assistance with buying, selling, or renting properties.`; // Placeholder

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <img
            src={agentImage}
            alt={agent.name || 'Agent'}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
          />
          <div>
            <CardTitle className="text-lg">{agent.name || 'Agent Name'}</CardTitle>
            <CardDescription>{agentTitle}</CardDescription>
            {/* Placeholder Rating */}
            {/* <div className="flex items-center mt-1">
              <span className="text-yellow-500 font-medium text-sm">{rating.toFixed(1)}</span>
              <div className="flex items-center ml-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 ml-1">({reviewCount})</span>
            </div> */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-slate-600 line-clamp-3 mb-2">
          {bio}
        </p>
        {/* Add other details like city/expertise if available in User schema */}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        {agent.email && (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`mailto:${agent.email}`}>
              <Mail className="h-4 w-4 mr-2" /> Email
            </a>
          </Button>
        )}
        {agent.phone && (
          <Button variant="default" size="sm" className="flex-1" asChild>
            <a href={`tel:${agent.phone}`}>
              <Phone className="h-4 w-4 mr-2" /> Call
            </a>
          </Button>
        )}
        {!agent.email && !agent.phone && (
          <Button variant="outline" size="sm" className="flex-1" disabled>
            Contact Info Unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};


// --- Main Page Component ---
export default function FindAgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all"); // Example filter state
  const [selectedExpertise, setSelectedExpertise] = useState("all"); // Example filter state

  // Fetch agents from the API endpoint
  const { data: agents, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ['/users/agents', searchTerm], // Include searchTerm if backend uses it
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim()); // Append search term if backend supports it
      }
      const queryString = params.toString();
      const url = `/users/agents${queryString ? `?${queryString}` : ''}`;
      console.log(`[FindAgents] Fetching agents from: ${url}`); // Log the URL being fetched

      // --- Add 'GET' method as the first argument ---
      const response = await apiRequest<User[]>('GET', url);
      console.log(`[FindAgents] Received ${response?.length ?? 0} agents`);

      return response;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: true, // Ensure it runs on load (or manage with handleSearch if needed)
    // If search is backend-driven and shouldn't run initially:
    // enabled: false, // Then call refetch() in handleSearch
  });

  const handleSearch = () => {
    // If useQuery is enabled: true, it refetches automatically when searchTerm changes.
    // If useQuery is enabled: false, you need to call refetch:
    // refetch();
  };

  // Filter agents based on search term and other filters (client-side)
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    let results = agents;

    // Search Term Filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter((agent) =>
        (agent.name?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (agent.email?.toLowerCase() || '').includes(lowerSearchTerm)
        // Add city/expertise if available in User schema
        // || (agent.city?.toLowerCase() || '').includes(lowerSearchTerm)
      );
    }

    // City Filter (Example - requires 'city' field on User schema)
    // if (selectedCity !== 'all') {
    //   results = results.filter(agent => agent.city?.toLowerCase() === selectedCity.toLowerCase());
    // }

    // Expertise Filter (Example - requires 'expertise' field on User schema)
    // if (selectedExpertise !== 'all') {
    //   results = results.filter(agent => agent.expertise?.includes(selectedExpertise));
    // }

    return results;
  }, [agents, searchTerm, selectedCity, selectedExpertise]); // Include filter states in dependencies

  // --- Render Function for Agent Grid ---
  const renderAgentGrid = (agentsToRender: User[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            // Skeleton Card
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                  <div>
                    <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <div className="h-9 bg-slate-200 rounded w-1/2"></div>
                <div className="h-9 bg-slate-200 rounded w-1/2"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-600">
          Error loading agents: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      );
    }

    if (agentsToRender.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-lg shadow-md col-span-full"> {/* Ensure it spans full width if needed */}
          <Search className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="mt-2 text-lg font-medium text-slate-900">No agents found</h3>
          <p className="mt-1 text-slate-500">Try adjusting your search or filter terms.</p>
          {(searchTerm || selectedCity !== 'all' || selectedExpertise !== 'all') && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSelectedCity("all");
                setSelectedExpertise("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      );
    }

    // Render actual agent cards
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentsToRender.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    );
  };


  return (
    <div>
      <Navbar />
      <PageHeader
        title="Find Real Estate Agents"
        description="Connect with professional agents who can help with your property needs."
      />

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search by agent name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            </div>
            {/* --- Example Filters (Uncomment and adapt if needed) --- */}
            {/*
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Berlin">Berlin</SelectItem>
                <SelectItem value="Munich">Munich</SelectItem>
                // Populate with actual cities from data or API
              </SelectContent>
            </Select>
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                // Populate with actual expertise options
              </SelectContent>
            </Select>
            */}
            <Button onClick={() => { /* Trigger refetch if backend handles filtering */ }}>
              <Search className="h-4 w-4 mr-2 sm:hidden" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        {/* --- Tabs for Sorting/Filtering (Using API Data) --- */}
        <Tabs defaultValue="all" className="mb-10">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Agents</TabsTrigger>
            {/* Add other tabs if needed, e.g., based on rating or deals if that data exists */}
            {/* <TabsTrigger value="top-rated">Top Rated</TabsTrigger> */}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {/* Render the grid using the filtered API data */}
            {renderAgentGrid(filteredAgents)}
          </TabsContent>

          {/* Example: Top Rated Tab (Requires rating data on User schema) */}
          {/*
          <TabsContent value="top-rated" className="mt-0">
            {renderAgentGrid(
              [...filteredAgents].sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating if available
            )}
          </TabsContent>
          */}
        </Tabs>

      </div>

      {/* Optional: Add CTA or other sections */}
      <div className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are You an Agent?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Join our network to connect with clients and grow your business.</p>
          <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-slate-100" asChild>
            <Link href="/signup?role=agent">Join HomeHarbor</Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
