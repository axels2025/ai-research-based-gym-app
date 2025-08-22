import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, checkProfileCompletion } from '@/lib/userProfiles';
import { isFirebaseConfigured } from '@/lib/firebase';

interface RequireOnboardingProps {
  children: React.ReactNode;
}

export function RequireOnboarding({ children }: RequireOnboardingProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      if (!isFirebaseConfigured) {
        console.warn('Firebase not configured, skipping onboarding check');
        setLoading(false);
        setOnboardingCompleted(false);
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        
        if (!profile) {
          // No profile exists, redirect to onboarding
          setOnboardingCompleted(false);
        } else {
          // Check if onboarding is completed and profile is valid
          const completion = checkProfileCompletion(profile);
          setOnboardingCompleted(profile.onboardingCompleted && completion.completed);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, assume onboarding not completed to be safe
        setOnboardingCompleted(false);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Show Firebase configuration error screen
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[var(--gradient-background)] flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Firebase Setup Required</h1>
            <p className="text-muted-foreground">
              The application needs Firebase configuration to work properly.
            </p>
          </div>
          <div className="text-left bg-card p-4 rounded-lg border space-y-2">
            <p className="font-medium text-sm">Setup Instructions:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Copy <code>.env.example</code> to <code>.env</code></li>
              <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.firebase.google.com</a></li>
              <li>Get your config from Project Settings → General → Your apps</li>
              <li>Fill in the values in your <code>.env</code> file</li>
              <li>Restart the development server</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            Check the browser console for more details
          </p>
        </div>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}