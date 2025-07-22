import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  LayoutDashboard, 
  User, 
  LogOut, 
  Settings,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
}

export default function Navigation({ activeTab, onTabChange, user }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const navigationItems = [
    {
      id: 'scanner',
      label: 'QR Scanner',
      icon: QrCode,
      description: 'Scan QR codes for lab access'
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      description: 'Manage your profile and QR code'
    },
    ...(profile?.role === 'admin' ? [{
      id: 'dashboard',
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      description: 'Monitor lab activity and users'
    }] : [])
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">IBACMI Lab</h1>
            <p className="text-xs text-muted-foreground">Scanner System</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-lg">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">IBACMI Laboratory</h2>
                  <p className="text-sm text-muted-foreground">QR Scanner System</p>
                </div>
              </div>

              {/* User Info */}
              {profile && (
                <div className="p-3 rounded-lg bg-gradient-subtle border border-border">
                  <p className="font-medium text-foreground">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{profile.student_id}</p>
                  <Badge className="mt-1 bg-lab-blue/10 text-lab-blue">
                    {profile.role}
                  </Badge>
                </div>
              )}

              {/* Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-auto p-3 ${
                        activeTab === item.id 
                          ? 'bg-gradient-primary text-white shadow-glow' 
                          : 'hover:bg-gradient-subtle'
                      }`}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs opacity-70">{item.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </nav>

              {/* Sign Out */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-lab">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">IBACMI Laboratory</h1>
              <p className="text-sm text-muted-foreground">QR Scanner System</p>
            </div>
          </div>

          {/* User Info */}
          {profile && (
            <div className="p-4 rounded-xl bg-gradient-subtle border border-border">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{profile.student_id}</p>
                  <Badge className="mt-1 bg-lab-blue/10 text-lab-blue border-lab-blue/20">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-auto p-4 ${
                    activeTab === item.id 
                      ? 'bg-gradient-primary text-white shadow-glow' 
                      : 'hover:bg-gradient-subtle'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-lab-gray/20 text-lab-gray hover:bg-lab-gray hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}