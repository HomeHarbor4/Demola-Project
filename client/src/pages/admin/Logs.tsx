import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertTriangle, Clock, Info, Terminal, AlertCircle, RefreshCw, Trash, Plus, Search, ChevronDown, Download, Filter, RotateCw } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

// Types
interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  details?: Record<string, any>;
}

interface LogsResponse {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    totalLogs: number;
    totalPages: number;
  };
  filters: {
    level: string | null;
    source: string | null;
    search: string | null;
  };
}

// Helper function for log level styling
function getLogLevelBadge(level: string) {
  switch (level.toLowerCase()) {
    case 'info':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Info className="w-3 h-3 mr-1" /> Info</Badge>;
    case 'warning':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>;
    case 'error':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    case 'debug':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Terminal className="w-3 h-3 mr-1" /> Debug</Badge>;
    default:
      return <Badge variant="outline">{level}</Badge>;
  }
}

// Format date for display
function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export default function LogsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Fetch logs
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery<LogsResponse>({
    queryKey: [
      '/admin/logs', 
      { 
        page, 
        limit, 
        level: filterLevel, 
        source: filterSource, 
        search: searchQuery 
      }
    ],
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 30000 // 30 seconds
  });
  
  // Fetch unique log levels for filter
  const { data: logLevels } = useQuery<string[]>({
    queryKey: ['/admin/logs/levels'],
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Fetch unique log sources for filter
  const { data: logSources } = useQuery<string[]>({
    queryKey: ['/admin/logs/sources'],
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setPage(1); // Reset to first page on new search
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterLevel(null);
    setFilterSource(null);
    setSearchTerm('');
    setSearchQuery('');
    setPage(1);
  };
  
  // Generate new logs
  const generateLogs = async (count: number = 10) => {
    setIsGenerating(true);
    try {
      await apiRequest('POST', '/admin/logs/generate', { count });
      await queryClient.invalidateQueries({ queryKey: ['/admin/logs'] });
      toast({
        title: "Logs Generated",
        description: `Successfully generated ${count} new log entries.`,
      });
    } catch (error) {
      console.error('Error generating logs:', error);
      toast({
        title: "Error",
        description: "Failed to generate logs.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Clear all logs
  const clearAllLogs = async () => {
    if (!window.confirm("Are you sure you want to delete all logs? This action cannot be undone.")) {
      return;
    }
    
    setIsDeletingAll(true);
    try {
      await apiRequest('DELETE', '/admin/logs/clear');
      await queryClient.invalidateQueries({ queryKey: ['/admin/logs'] });
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: "Error",
        description: "Failed to clear logs.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };
  
  // Delete a specific log
  const deleteLog = async (id: number) => {
    setIsDeleting(true);
    try {
      await apiRequest('DELETE', `/admin/logs/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['/admin/logs'] });
      if (selectedLog?.id === id) {
        setSelectedLog(null);
      }
      toast({
        title: "Log Deleted",
        description: "Log entry has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: "Error",
        description: "Failed to delete log.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Export logs as JSON
  const exportLogs = () => {
    if (!data?.logs || data.logs.length === 0) {
      toast({
        title: "No Logs to Export",
        description: "There are no logs available to export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Logs Exported",
        description: "Logs have been exported as JSON file.",
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export logs. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // View log details
  const viewLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage system activities</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Actions
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Log Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => generateLogs(10)} disabled={isGenerating}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate 10 Logs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateLogs(50)} disabled={isGenerating}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate 50 Logs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={clearAllLogs}
                  disabled={isDeletingAll}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Clear All Logs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="default" 
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RotateCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Filter controls */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Log Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[220px]">
                <Input
                  placeholder="Search logs by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <Select 
                  value={filterLevel || 'all'} 
                  onValueChange={(value) => {
                    setFilterLevel(value === 'all' ? null : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Log Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {logLevels?.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-auto">
                <Select 
                  value={filterSource || 'all'} 
                  onValueChange={(value) => {
                    setFilterSource(value === 'all' ? null : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Log Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {logSources?.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                
                {(filterLevel || filterSource || searchQuery) && (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Logs table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <RefreshCw className="animate-spin h-8 w-8 text-primary mb-4" />
                  <p className="text-muted-foreground">Loading system logs...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64 text-red-500">
                <AlertCircle className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-semibold">Error loading logs</h3>
                <p className="text-muted-foreground mb-4">There was a problem fetching the system logs.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : !data?.logs?.length ? (
              <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
                <Terminal className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No logs found</h3>
                <p className="mb-6 text-center max-w-md">
                  {searchQuery || filterLevel || filterSource 
                    ? "No logs match your current filters. Try adjusting your search criteria."
                    : "There are no system logs available. Generate some logs to get started."}
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="default"
                    onClick={() => generateLogs(10)}
                    disabled={isGenerating}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Sample Logs
                  </Button>
                  
                  {(searchQuery || filterLevel || filterSource) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="w-full">Message</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.logs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className="cursor-pointer hover:bg-muted/40 transition-colors" 
                        onClick={() => viewLogDetails(log)}
                      >
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.source}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs md:max-w-md truncate">
                          {log.message}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              if (window.confirm("Delete this log entry?")) {
                                deleteLog(log.id);
                              }
                            }}
                            disabled={isDeleting}
                            title="Delete log"
                          >
                            <Trash className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {/* Pagination */}
          {data && data.pagination && data.pagination.totalPages > 1 && (
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {data.logs.length} of {data.pagination.totalLogs} logs
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }).map((_, i) => {
                    // Calculate page numbers to show (centered around current page)
                    let pageNum;
                    if (data.pagination.totalPages <= 5) {
                      // Show all pages if 5 or fewer
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      // Show first 5 pages
                      pageNum = i + 1;
                    } else if (page >= data.pagination.totalPages - 2) {
                      // Show last 5 pages
                      pageNum = data.pagination.totalPages - 4 + i;
                    } else {
                      // Show pages around current
                      pageNum = page - 2 + i;
                    }
                    
                    if (pageNum <= 0 || pageNum > data.pagination.totalPages) return null;
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < data.pagination.totalPages) setPage(page + 1);
                      }}
                      className={page >= data.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="sm:block hidden w-24"></div> {/* Spacer for alignment */}
            </CardFooter>
          )}
        </Card>
        
        {/* Log details sheet */}
        {selectedLog && (
          <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Log Details</SheetTitle>
                <SheetDescription>
                  ID: {selectedLog.id} | {formatDate(selectedLog.timestamp)}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Level:</h3>
                  <div>{getLogLevelBadge(selectedLog.level)}</div>
                </div>
                
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Source:</h3>
                  <div>
                    <Badge variant="secondary">{selectedLog.source}</Badge>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Message:</h3>
                  <p className="text-sm whitespace-pre-wrap break-words">{selectedLog.message}</p>
                </div>
                
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Details:</h3>
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/20">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              <SheetFooter className="mt-6 space-x-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Delete this log entry?")) {
                      deleteLog(selectedLog.id);
                    }
                  }}
                  disabled={isDeleting}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Log
                </Button>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </AdminLayout>
  );
}