import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dumbbell, User, Settings, LogOut, Cog, Sparkles, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getActiveProgram, type WorkoutProgram } from '@/lib/firestore';
import { checkRegenerationEligibility } from '@/lib/programRegeneration';
import { ProgramRegenerationDialog } from '@/components/ProgramRegenerationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function Navigation() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [showRegenerationDialog, setShowRegenerationDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [regenerationReason, setRegenerationReason] = useState<string>('');

  useEffect(() => {
    async function loadProgramData() {
      if (!currentUser) return;

      try {
        const activeProgram = await getActiveProgram(currentUser.uid);
        setProgram(activeProgram);
        
        if (activeProgram) {
          const eligibility = await checkRegenerationEligibility(currentUser.uid);
          setCanRegenerate(eligibility.canRegenerate);
          setRegenerationReason(eligibility.reason || '');
        }
      } catch (error) {
        console.error('Error loading program data:', error);
      }
    }

    loadProgramData();
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const handleRegenerationSuccess = (result: any) => {
    if (result.program) {
      setProgram(result.program);
    }
    
    if (currentUser) {
      checkRegenerationEligibility(currentUser.uid).then((eligibility) => {
        setCanRegenerate(eligibility.canRegenerate);
        setRegenerationReason(eligibility.reason || '');
      });
    }
  };

  const userInitials = currentUser?.email
    ? currentUser.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <>
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Muscle Coach
            </span>
          </Link>

          {/* Menus */}
          {currentUser && (
            <div className="flex items-center gap-2">
              {/* Program Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Cog className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Program Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setShowConfirmationDialog(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Generate New Program</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/program-overview" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Program Overview</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Program Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
    
    {/* Safety Confirmation Dialog */}
    <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate New Program?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace your current program and all its progress data. 
            {program && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Current Program:</strong> {program.name}<br/>
                  <strong>Week:</strong> {program.currentWeek} of {program.totalWeeks}<br/>
                  <strong>Workouts Completed:</strong> {program.workoutsCompleted} of {program.totalWorkouts}
                </p>
              </div>
            )}
            <p className="mt-2 text-sm font-medium text-destructive">
              This action cannot be undone. Are you sure you want to continue?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setShowConfirmationDialog(false);
              setShowRegenerationDialog(true);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Generate New Program
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Program Regeneration Dialog */}
    {currentUser && (
      <ProgramRegenerationDialog
        open={showRegenerationDialog}
        onOpenChange={setShowRegenerationDialog}
        userId={currentUser.uid}
        currentProgram={program}
        onSuccess={handleRegenerationSuccess}
      />
    )}
  </>
  );
}