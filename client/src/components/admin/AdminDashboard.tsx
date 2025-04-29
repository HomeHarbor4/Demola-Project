// src/components/admin/AdminDashboard.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Building2, Users, Map, Star, CheckCircle, BarChart2, Loader2
} from "lucide-react"; // Removed unused icons
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Legend,
} from "recharts";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest

interface DashboardData {
  counts: {
    properties: number;
    users: number;
    // activeUsers: number; // Assuming these might not exist in API response yet
    // agents: number;
    locations: number;
    // favorites: number;
    featuredProperties: number;
    verifiedProperties: number;
  };
  charts: {
    propertiesByType: Record<string, number>;
    propertiesByListingType: Record<string, number>;
    propertiesByCity: Record<string, number>;
  };
  recentProperties?: Array<{
    id: number;
    title: string;
    price: number;
    createdAt: string;
  }>;
  recentUsers?: Array<{
    id: number;
    name: string;
    email: string;
    createdAt: string;
  }>;
}


// Color palette (keep as is)
const CHART_COLORS = ['#4f46e5', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export function AdminDashboard() {
  // Fetch dashboard data using apiRequest
  const { data, isLoading, isError, error } = useQuery<DashboardData, Error>({
    queryKey: ['/admin/dashboard'],
    queryFn: async () => {
      // Use apiRequest for fetching
      return await apiRequest<DashboardData>('GET', '/admin/dashboard');
    },
    staleTime: 60 * 1000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>Error loading dashboard data: {error.message}. Please try again.</p>
      </div>
    );
  }

  // Handle case where data might be undefined even if not loading/error
  if (!data) {
     return <div className="text-center py-10">No dashboard data available.</div>;
  }

  // Create safe defaults for any potentially missing data
  const safeData = {
    properties: data.counts?.properties || 0,
    users: data.counts?.users || 0,
    locations: data.counts?.locations || 0,
    featuredProperties: data.counts?.featuredProperties || 0,
    verifiedProperties: data.counts?.verifiedProperties || 0,
    propertiesByType: data.charts?.propertiesByType || {},
    propertiesByListingType: data.charts?.propertiesByListingType || {},
    propertiesByCity: data.charts?.propertiesByCity || {},
    recentProperties: data.recentProperties || [],
    recentUsers: data.recentUsers || []
  };

  // Prepare chart data
  const propertyTypeData = transformForCharts(safeData.propertiesByType, formatPropertyType);
  const listingTypeData = transformForCharts(safeData.propertiesByListingType, formatListingType);
  const cityData = transformForCharts(safeData.propertiesByCity);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        {/* Refresh button could trigger query invalidation */}
        {/* <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/admin/dashboard'] })}>Refresh</Button> */}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Properties Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Properties</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{safeData.properties}</div>{/* <p className="text-xs text-muted-foreground">+2% from last month</p> */}</CardContent>
        </Card>
        {/* Registered Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Registered Users</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{safeData.users}</div>{/* <p className="text-xs text-muted-foreground">+5% from last month</p> */}</CardContent>
        </Card>
        {/* Featured Properties Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Featured Properties</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{safeData.featuredProperties}</div><p className="text-xs text-muted-foreground">{safeData.properties > 0 ? `${((safeData.featuredProperties / safeData.properties) * 100).toFixed(1)}%` : '0%'}</p></CardContent>
        </Card>
        {/* Verified Properties Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Verified Properties</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{safeData.verifiedProperties}</div><p className="text-xs text-muted-foreground">{safeData.properties > 0 ? `${((safeData.verifiedProperties / safeData.properties) * 100).toFixed(1)}%` : '0%'}</p></CardContent>
        </Card>
      </div>

      {/* Data Visualizations */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Properties by Type Chart */}
        <Card className="col-span-1">
          <CardHeader><CardTitle>Properties by Type</CardTitle><CardDescription>Distribution by property types</CardDescription></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {propertyTypeData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={propertyTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">{propertyTypeData.map((_, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>) : (<p className="text-muted-foreground text-center">No data</p>)}
          </CardContent>
        </Card>
        {/* Properties by Listing Type Chart */}
        <Card className="col-span-1">
          <CardHeader><CardTitle>Properties by Listing Type</CardTitle><CardDescription>Breakdown by listing types</CardDescription></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {listingTypeData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={listingTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={60} /><Tooltip /><Bar dataKey="value">{listingTypeData.map((_, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer>) : (<p className="text-muted-foreground text-center">No data</p>)}
          </CardContent>
        </Card>
        {/* Properties by City Chart */}
        <Card className="col-span-1">
          <CardHeader><CardTitle>Properties by City</CardTitle><CardDescription>Distribution across cities</CardDescription></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {cityData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={cityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value">{cityData.map((_, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer>) : (<p className="text-muted-foreground text-center">No data</p>)}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle><CardDescription>Common administrative tasks</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              <Button variant="outline" className="justify-start" asChild><Link href="/admin/properties"><Building2 className="mr-2 h-4 w-4" />Manage Properties</Link></Button>
              <Button variant="outline" className="justify-start" asChild><Link href="/admin/users"><Users className="mr-2 h-4 w-4" />Manage Users</Link></Button>
              <Button variant="outline" className="justify-start" asChild><Link href="/admin/locations"><Map className="mr-2 h-4 w-4" />Manage Locations</Link></Button>
              <Button variant="outline" className="justify-start" asChild><Link href="/admin/messages"><BarChart2 className="mr-2 h-4 w-4" />View Messages</Link></Button>
            </div>
          </CardContent>
        </Card>
        {/* Recent Properties Card */}
        <Card>
          <CardHeader><CardTitle>Recent Properties</CardTitle><CardDescription>Latest properties added</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeData.recentProperties.length > 0 ? (safeData.recentProperties.slice(0, 4).map(p => (<div key={p.id} className="flex items-center justify-between"><div className="flex-1"><p className="text-sm font-medium truncate">{p.title}</p><p className="text-xs text-muted-foreground">Added {new Date(p.createdAt).toLocaleDateString()}</p></div><div className="text-sm font-semibold">€{p.price.toLocaleString()}</div></div>))) : (<p className="text-sm text-muted-foreground">No recent properties</p>)}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild><Link href="/admin/properties">View All Properties</Link></Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Helper function to format property types from Finnish to English
function formatPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    'Kerrostalo': 'Apartment Building', 'Omakotitalo': 'Detached House', 'Rivitalo': 'Townhouse',
    'Erillistalo': 'Semi-detached House', 'Paritalo': 'Duplex', 'Mökki': 'Cottage', 'Muu': 'Other',
    'apartment': 'Apartment', 'house': 'House', 'townhouse': 'Townhouse', 'villa': 'Villa',
    'penthouse': 'Penthouse', 'cottage': 'Cottage', 'studio': 'Studio', 'commercial': 'Commercial',
    'land': 'Land'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Helper function to format listing types from Finnish to English
function formatListingType(type: string): string {
  const typeMap: Record<string, string> = {
    'Myynti': 'For Sale', 'Vuokraus': 'For Rent', 'Liiketila': 'Commercial',
    'buy': 'For Sale', 'rent': 'For Rent', 'commercial': 'Commercial'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Transform data to recharts format
function transformForCharts(data: Record<string, number>, formatter?: (key: string) => string) {
  return Object.entries(data).map(([key, value]) => ({
    name: formatter ? formatter(key) : key,
    value
  }));
}
