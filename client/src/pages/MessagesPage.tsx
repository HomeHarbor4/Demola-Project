// src/pages/MessagesPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Inbox, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; // For relative time
import { useLanguage } from '@/contexts/LanguageContext';

// Define the structure of a message object from your API
// Adjust this based on your actual backend response
interface Message {
  id: number;
  subject: string;
  message: string;
  createdAt: string; // ISO date string
  read: boolean;
  propertyId?: number; // Optional link to property
  propertyTitle?: string; // Optional property title
  senderUserId: number;
  senderName: string;
  senderPhotoURL?: string | null;
  userId: number; // Receiver ID
  receiverName?: string; // Optional receiver name
  receiverPhotoURL?: string | null; // Optional receiver photo
}

// Function to fetch user's messages
const fetchUserMessages = async (userId: number): Promise<Message[]> => {
  // Adjust endpoint if needed
  return apiRequest<Message[]>('GET', `/messages/user/${userId}`);
};

export default function MessagesPage() {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'inbox' | 'sent'>('inbox'); // State to toggle view

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log('Messages Page: Redirecting to /signin');
      setLocation('/signin?redirect=/messages'); // Redirect back after login
    }
  }, [user, isAuthLoading, setLocation]);

  // Fetch messages only if user is logged in
  const {
    data: messages,
    isLoading: isMessagesLoading,
    error,
    refetch
  } = useQuery<Message[], Error>({
    queryKey: ['userMessages', user?.id], // Query key includes user ID
    queryFn: () => fetchUserMessages(user!.id),
    enabled: !!user && !isAuthLoading, // Only run query if user exists and auth loading is done
    staleTime: 1000 * 30, // Cache for 30 seconds (messages can update frequently)
  });

  const isLoading = isAuthLoading || (isMessagesLoading && !!user);

  // Filter messages based on view
  const filteredMessages = messages?.filter(msg =>
    view === 'inbox' ? msg.userId === user?.id : msg.senderUserId === user?.id
  ) || [];

  const getUserInitials = (name?: string | null) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    return nameParts[0]?.[0]?.toUpperCase() || '?';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner />
        </div>
        <Footer />
      </div>
    );
  }

  // If loading is done and still no user
  if (!user) {
     return (
       <div className="min-h-screen bg-slate-50">
        <Navbar />
         <div className="container mx-auto px-4 py-10 text-center">
           <p>{t('messages.signInRequired')}</p>
           <Button onClick={() => setLocation('/signin?redirect=/messages')} className="mt-4">
             {t('auth.signIn')}
           </Button>
         </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageHeader 
        title={t('messages.title')} 
        description={t('messages.description')} 
      />

      <div className="container mx-auto px-4 py-10">
        <div className="flex space-x-2 mb-6 border-b">
           <Button
             variant={view === 'inbox' ? 'secondary' : 'ghost'}
             onClick={() => setView('inbox')}
             className="rounded-b-none"
           >
             <Inbox className="mr-2 h-4 w-4" /> {t('messages.inbox')}
           </Button>
           <Button
             variant={view === 'sent' ? 'secondary' : 'ghost'}
             onClick={() => setView('sent')}
             className="rounded-b-none"
           >
             <Send className="mr-2 h-4 w-4" /> {t('messages.sent')}
           </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('messages.errorTitle')}</AlertTitle>
            <AlertDescription>
              {error.message || t('messages.errorDescription')}
              <Button variant="link" onClick={() => refetch()} className="p-0 h-auto ml-2">
                {t('common.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : filteredMessages && filteredMessages.length > 0 ? (
          <div className="space-y-4">
            {filteredMessages
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((message) => {
                const otherPartyName = view === 'inbox' ? message.senderName : message.receiverName || t('common.unknown');
                const otherPartyPhoto = view === 'inbox' ? message.senderPhotoURL : message.receiverPhotoURL;

                return (
                  <Card key={message.id} className={`overflow-hidden ${!message.read && view === 'inbox' ? 'border-primary' : ''}`}>
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4 bg-muted/30">
                       <Avatar className="h-10 w-10 border">
                          {otherPartyPhoto ? (
                            <AvatarImage src={otherPartyPhoto} alt={otherPartyName} />
                          ) : (
                            <AvatarFallback>{getUserInitials(otherPartyName)}</AvatarFallback>
                          )}
                        </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium flex justify-between items-center">
                          <span>
                            {view === 'inbox' 
                              ? t('messages.from', { name: otherPartyName })
                              : t('messages.to', { name: otherPartyName })}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-1">
                          {t('messages.subject')}: {message.subject}
                        </CardDescription>
                         {message.propertyTitle && (
                           <CardDescription className="text-xs mt-1 text-blue-600">
                             {t('messages.regarding')}: {message.propertyTitle}
                           </CardDescription>
                         )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 text-sm text-muted-foreground">
                      <p className="line-clamp-3">{message.message}</p>
                    </CardContent>
                  </Card>
                );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-lg">
             {view === 'inbox' ? (
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
             ) : (
                <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
             )}
            <h3 className="text-lg font-medium text-muted-foreground">
              {view === 'inbox' 
                ? t('messages.noReceivedMessages')
                : t('messages.noSentMessages')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('messages.emptyStateDescription', { view: t(`messages.${view}`) })}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
