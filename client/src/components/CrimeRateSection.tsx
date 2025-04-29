import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

interface CrimeRateSectionProps {
  city: string;
  className?: string;
}

interface CrimeData {
  city: string;
  totalCrimes: number;
  months: number;
  dataPoints: number;
  data: Array<{
    crime_count: number;
    month: string;
    municipality_code: string;
    municipality_name: string;
    crime_group_code: string;
    crime_group_name: string;
  }>;
}

export const CrimeRateSection: React.FC<CrimeRateSectionProps> = ({ city, className }) => {
  const { data, isLoading, error } = useQuery<CrimeData>({
    queryKey: ['crime-rate', city],
    queryFn: () => apiRequest('GET', `/crime-rate?city=${city}`),
    enabled: !!city,
  });

  // Process data for monthly chart
  const monthlyData = React.useMemo(() => {
    if (!data?.data) return [];
    
    const monthlyTotals = new Map<string, number>();
    data.data.forEach(entry => {
      const current = monthlyTotals.get(entry.month) || 0;
      monthlyTotals.set(entry.month, current + entry.crime_count);
    });
    
    return Array.from(monthlyTotals.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // Process data for crime categories
  const crimeCategories = React.useMemo(() => {
    if (!data?.data) return [];
    
    const categoryTotals = new Map<string, number>();
    data.data.forEach(entry => {
      // Extract main category from crime_group_name (first word before space)
      const mainCategory = entry.crime_group_name.split(' ')[0];
      const current = categoryTotals.get(mainCategory) || 0;
      categoryTotals.set(mainCategory, current + entry.crime_count);
    });
    
    return Array.from(categoryTotals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 categories
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>Error loading crime data. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Crimes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Crimes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalCrimes}</div>
            <p className="text-sm text-muted-foreground">
              Reported crimes in the last {data.months} months
            </p>
          </CardContent>
        </Card>

        {/* Monthly Breakdown Card */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Crime Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#4f46e5">
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#4f46e5' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Crime Categories Card */}
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>Top Crime Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crimeCategories} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8b5cf6">
                    {crimeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#8b5cf6' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Data is aggregated from official police statistics and may include preliminary data.</p>
      </div>
    </section>
  );
};

export default CrimeRateSection; 