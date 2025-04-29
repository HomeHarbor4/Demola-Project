import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export default function ReseedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleReseed = async () => {
    if (!confirm('This will delete ALL existing data and replace it with Oulu, Finland data. Are you sure?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/reseed/oulu', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to reseed database');
      }
      
      const data = await response.json();
      
      toast({
        title: "Database reseeded successfully",
        description: "The database has been reseeded with Oulu, Finland data. Refresh the page to see the changes.",
        variant: "default"
      });
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error reseeding database:', error);
      toast({
        title: "Error reseeding database",
        description: error.message || "An error occurred while reseeding the database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleReseed} 
      disabled={isLoading}
      variant="destructive"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reseeding Database...
        </>
      ) : (
        'Replace Data with Oulu, Finland Properties'
      )}
    </Button>
  );
}