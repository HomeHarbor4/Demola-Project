import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react'; // Only need Heart icon
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import hooks
import { apiRequest } from '@/lib/queryClient'; // Import apiRequest helper
import { useAuth } from '@/contexts/AuthContext'; // Use AuthContext for userId

interface FavoriteButtonProps {
  propertyId: number;
  // userId is now obtained from AuthContext
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

interface FavoriteStatusResponse {
  isFavorite: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  propertyId,
  size = 'md',
  className = '',
  onToggle
}) => {
  const { user } = useAuth(); // Get user from context
  const userId = user?.id; // Extract user ID
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Size mapping for the icon
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // --- Use useQuery to fetch favorite status ---
  const favoriteQueryKey = ['/favorites/check', userId, propertyId];

  const { data: favoriteStatus, isLoading: isLoadingStatus } = useQuery<FavoriteStatusResponse>({
    queryKey: favoriteQueryKey,
    queryFn: () => apiRequest<FavoriteStatusResponse>('GET', `/favorites/check/${userId}/${propertyId}`),
    enabled: !!userId, // Only run query if userId exists
    staleTime: 1000 * 60 * 5, // Cache status for 5 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  const isFavorite = favoriteStatus?.isFavorite ?? false; // Default to false if data is not yet available

  // --- Use useMutation for toggling favorite status ---
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Authentication required"); // Should ideally not happen due to button logic, but good practice
      }
      if (isFavorite) {
        // Remove from favorites
        return apiRequest('DELETE', `/favorites/${userId}/${propertyId}`);
      } else {
        // Add to favorites
        return apiRequest('POST', '/favorites', { userId, propertyId });
      }
    },
    onMutate: async () => {
      // Optimistic Update (Optional but improves UX)
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: favoriteQueryKey });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData<FavoriteStatusResponse>(favoriteQueryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<FavoriteStatusResponse>(favoriteQueryKey, (old) => ({ isFavorite: !old?.isFavorite }));

      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onError: (err: any, _variables, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(favoriteQueryKey, context.previousStatus);
      }
      toast({
        title: "Error",
        description: err.message || "Failed to update favorites",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `Property ${isFavorite ? 'removed from' : 'added to'} your favorites`
      });
      // Call the onToggle callback
      onToggle?.(!isFavorite); // Pass the *new* state
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: favoriteQueryKey });
      // Optionally invalidate other queries that depend on favorites
      queryClient.invalidateQueries({ queryKey: ['/favorites/user', userId] }); // Example: invalidate user's favorites list
    },
  });

  const handleToggleClick = () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorites",
        variant: "destructive"
      });
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  // Determine loading state (initial check or mutation pending)
  const isLoading = isLoadingStatus || toggleFavoriteMutation.isPending;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleClick}
      disabled={isLoading || !userId} // Disable if loading or no user
      className={`rounded-full hover:bg-background/80 ${className}`}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isLoading ? (
        // Simple spinner or keep icon slightly dimmed
        <Heart
          size={sizeMap[size]}
          className="text-muted-foreground animate-pulse" // Example loading style
        />
      ) : isFavorite ? (
        <Heart
          size={sizeMap[size]}
          className="text-red-500 fill-red-500"
        />
      ) : (
        <Heart
          size={sizeMap[size]}
          className="text-muted-foreground"
        />
      )}
    </Button>
  );
};

export default FavoriteButton;
