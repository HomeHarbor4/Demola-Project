// src/pages/Profile.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { Edit } from 'lucide-react';

export default function Profile() {
  const { t } = useLanguage();
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not logged in and loading is finished
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('Profile Page: Redirecting to /signin');
      setLocation('/signin');
    }
  }, [user, isLoading, setLocation]);

  const getUserInitials = () => {
    if (!user) return 'U';
    const displayName = user.name || 'User';
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0]?.[0]?.toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/'; // Redirect to home after logout
  };

  // Show loading spinner while auth state is being determined
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

  // If loading is done and still no user, render minimal state (should be redirected)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-10 text-center">
          <p>{t('profile.signInPrompt')}</p>
          <Button onClick={() => setLocation('/signin')} className="mt-4">{t('navbar.signIn')}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Render profile information
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageHeader title={t('profile.title')} description={t('profile.description')} />

      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.name || t('navbar.profile')} />
              ) : (
                <AvatarFallback className="text-2xl bg-primary-100 text-primary-600">
                  {getUserInitials()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                @{user.username}
                <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'agent' ? 'secondary' : 'outline'} className="capitalize">
                  {t(`roles.${user.role}`)}
                </Badge>
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" className="ml-auto hidden sm:flex" aria-label={t('profile.editButton')} disabled>
              <Edit className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">{t('profile.email')}</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">{t('profile.phone')}</span>
              <span className="font-medium">{user.phone || <span className="text-slate-400 italic">{t('profile.notProvided')}</span>}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">{t('profile.memberSince')}</span>
              <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" disabled>
                <Edit className="h-4 w-4 mr-2" /> {t('profile.editProfile')}
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto sm:ml-auto">
                {t('navbar.signOut')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
