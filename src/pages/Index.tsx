import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import QRScanner from '@/components/QRScanner';
import AdminDashboard from '@/components/AdminDashboard';
import StudentProfile from '@/components/StudentProfile';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentId: ''
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              first_name: authData.firstName,
              last_name: authData.lastName,
              student_id: authData.studentId
            }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome Back",
          description: "Successfully signed in to IBACMI Lab System",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">IBACMI Laboratory</h1>
            <p className="text-muted-foreground">Loading system...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="h-20 w-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow">
                <Activity className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">IBACMI Laboratory</h1>
                <p className="text-muted-foreground">QR Scanner Access System</p>
              </div>
            </div>

            {/* Auth Form */}
            <Card className="shadow-lab">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {authMode === 'signin' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </CardTitle>
                <CardDescription>
                  {authMode === 'signin' 
                    ? 'Access your laboratory scanner account' 
                    : 'Register for laboratory access'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={authData.firstName}
                          onChange={(e) => setAuthData({...authData, firstName: e.target.value})}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={authData.lastName}
                          onChange={(e) => setAuthData({...authData, lastName: e.target.value})}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={authData.studentId}
                        onChange={(e) => setAuthData({...authData, studentId: e.target.value})}
                        placeholder="STU001"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({...authData, email: e.target.value})}
                    placeholder="student@ibacmi.edu"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData({...authData, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>

                <Button 
                  onClick={handleAuth}
                  disabled={isAuthLoading}
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-lab-blue hover:text-lab-blue-dark"
                  >
                    {authMode === 'signin' 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Demo Info */}
            <Card className="shadow-card border-accent/20">
              <CardContent className="p-4">
                <p className="text-sm text-center text-muted-foreground">
                  <strong>Demo credentials:</strong><br />
                  Email: demo@ibacmi.edu<br />
                  Password: demo123
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
      />
      
      <div className="lg:ml-72">
        <div className="container mx-auto px-4 py-6">
          {activeTab === 'scanner' && <QRScanner />}
          {activeTab === 'profile' && <StudentProfile />}
          {activeTab === 'dashboard' && <AdminDashboard />}
        </div>
      </div>
    </div>
  );
};

export default Index;
