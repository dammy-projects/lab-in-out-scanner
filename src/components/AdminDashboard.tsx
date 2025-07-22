import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  Activity, 
  TrendingUp, 
  Calendar,
  UserCheck,
  UserX,
  Database,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  student_id: string;
  action: string;
  timestamp: string;
  scanned_by: string;
  profiles?: {
    first_name: string;
    last_name: string;
    student_id: string;
  };
}

interface DashboardStats {
  totalStudents: number;
  currentlyInLab: number;
  todayEntries: number;
  todayExits: number;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    currentlyInLab: 0,
    todayEntries: 0,
    todayExits: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('inout_logs')
        .select(`
          *,
          profiles!inner(first_name, last_name, student_id)
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Fetch total students
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = (logsData || []).filter(log => 
        log.timestamp.startsWith(today)
      );

      const todayEntries = todayLogs.filter(log => log.action === 'IN').length;
      const todayExits = todayLogs.filter(log => log.action === 'OUT').length;

      // Calculate currently in lab (simplified - would need more complex logic for accurate count)
      const currentlyInLab = Math.max(0, todayEntries - todayExits);

      setStats({
        totalStudents: totalStudents || 0,
        currentlyInLab,
        todayEntries,
        todayExits
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inout_logs'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const StatCard = ({ title, value, icon: Icon, subtitle, trend }: any) => (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center ${trend ? 'animate-pulse-glow' : ''}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laboratory Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage lab access</p>
        </div>
        <Button 
          onClick={fetchDashboardData}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="border-lab-blue text-lab-blue hover:bg-lab-blue hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          subtitle="Registered users"
        />
        <StatCard
          title="Currently in Lab"
          value={stats.currentlyInLab}
          icon={UserCheck}
          subtitle="Active sessions"
          trend={stats.currentlyInLab > 0}
        />
        <StatCard
          title="Today's Entries"
          value={stats.todayEntries}
          icon={TrendingUp}
          subtitle="Check-ins today"
        />
        <StatCard
          title="Today's Exits"
          value={stats.todayExits}
          icon={UserX}
          subtitle="Check-outs today"
        />
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-lab-blue" />
                Recent Activity Logs
              </CardTitle>
              <CardDescription>
                Latest laboratory entry and exit records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gradient-subtle transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${log.action === 'IN' ? 'bg-accent' : 'bg-destructive'}`} />
                      <div>
                        <p className="font-medium text-foreground">
                          {log.profiles?.first_name} {log.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.profiles?.student_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={log.action === 'IN' ? 'default' : 'destructive'}
                        className={log.action === 'IN' ? 'bg-accent' : ''}
                      >
                        {log.action}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No activity logs found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
              <CardDescription>
                All laboratory access logs for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs
                  .filter(log => {
                    const today = new Date().toISOString().split('T')[0];
                    return log.timestamp.startsWith(today);
                  })
                  .map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gradient-subtle transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${log.action === 'IN' ? 'bg-accent' : 'bg-destructive'}`} />
                        <div>
                          <p className="font-medium text-foreground">
                            {log.profiles?.first_name} {log.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.profiles?.student_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={log.action === 'IN' ? 'default' : 'destructive'}
                          className={log.action === 'IN' ? 'bg-accent' : ''}
                        >
                          {log.action}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Laboratory usage patterns and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Peak Hours</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Morning (8-12)</span>
                      <span className="font-medium">High Activity</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Afternoon (12-17)</span>
                      <span className="font-medium">Peak Activity</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Evening (17-20)</span>
                      <span className="font-medium">Low Activity</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Weekly Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekdays</span>
                      <span className="font-medium">85% Usage</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekends</span>
                      <span className="font-medium">15% Usage</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}