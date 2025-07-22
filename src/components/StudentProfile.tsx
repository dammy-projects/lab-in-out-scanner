import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  QrCode, 
  Save, 
  Download, 
  History,
  Clock,
  MapPin,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from 'qrcode';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  student_id: string;
  role: string;
  qr_code?: string;
  profile_image_url?: string;
}

interface LogEntry {
  id: string;
  action: string;
  timestamp: string;
  scanned_by: string;
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    student_id: ''
  });
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        middle_name: profileData.middle_name || '',
        student_id: profileData.student_id || ''
      });

      // Fetch user's logs
      const { data: logsData } = await supabase
        .from('inout_logs')
        .select('*')
        .eq('student_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      setLogs(logsData || []);

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const updateProfile = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });

    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!profile || !profile.student_id) {
      toast({
        title: "Cannot Generate QR Code",
        description: "Please add a Student ID first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate QR code data with student ID
      const qrData = `IBACMI_LAB_${profile.student_id}_${profile.id}`;
      
      // Generate actual QR code image
      const qrCodeDataURL = await QRCodeGenerator.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e40af', // lab-blue color
          light: '#ffffff'
        }
      });
      
      const { error } = await supabase
        .from('profiles')
        .update({ qr_code: qrData })
        .eq('id', profile.id);

      if (error) throw error;

      setQrCodeImage(qrCodeDataURL);
      await fetchProfile();
      
      toast({
        title: "QR Code Generated",
        description: "Your lab access QR code has been created successfully",
      });

    } catch (error) {
      console.error('QR Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage || !profile) return;
    
    const link = document.createElement('a');
    link.download = `IBACMI_Lab_QR_${profile.student_id}.png`;
    link.href = qrCodeImage;
    link.click();
  };

  const regenerateQRCode = async () => {
    await generateQRCode();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Generate QR code image when profile has qr_code data
  useEffect(() => {
    if (profile?.qr_code) {
      QRCodeGenerator.toDataURL(profile.qr_code, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      }).then(setQrCodeImage).catch(console.error);
    }
  }, [profile?.qr_code]);

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-lab-gray-light rounded-lg"></div>
          <div className="h-20 bg-lab-gray-light rounded-lg"></div>
          <div className="h-40 bg-lab-gray-light rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="shadow-lab border-lab-blue/20">
        <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white/20">
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl text-white">
                  {profile.first_name} {profile.last_name}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Student ID: {profile.student_id}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {profile.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="font-medium">
                    {profile.first_name} {profile.middle_name} {profile.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                  <p className="font-medium">{profile.student_id}</p>
                </div>
              </div>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-lab-blue text-lab-blue hover:bg-lab-blue hover:text-white"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={updateProfile}
                  disabled={isLoading}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-lab-blue" />
            Lab Access QR Code
          </CardTitle>
          <CardDescription>
            Your unique QR code for laboratory entry and exit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.qr_code && qrCodeImage ? (
            <div className="text-center space-y-4">
              <div className="inline-block p-6 bg-white border-2 border-lab-blue/20 rounded-lg shadow-card">
                <img 
                  src={qrCodeImage} 
                  alt="Lab Access QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {profile.qr_code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Student ID: {profile.student_id}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={downloadQRCode}
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
                <Button 
                  onClick={regenerateQRCode}
                  disabled={isLoading}
                  variant="outline"
                  className="border-lab-blue text-lab-blue hover:bg-lab-blue hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-lab-blue/50" />
              <p className="text-muted-foreground mb-2">
                No QR code generated yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {!profile.student_id ? 'Please add your Student ID first' : 'Generate your unique lab access QR code'}
              </p>
              <Button 
                onClick={generateQRCode}
                disabled={isLoading || !profile.student_id}
                className="bg-gradient-primary hover:shadow-glow"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                Generate QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-lab-blue" />
            Recent Lab Activity
          </CardTitle>
          <CardDescription>
            Your latest laboratory entry and exit records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gradient-subtle transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${log.action === 'IN' ? 'bg-accent' : 'bg-destructive'}`} />
                  <div>
                    <p className="font-medium">
                      {log.action === 'IN' ? 'Entered Laboratory' : 'Exited Laboratory'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={log.action === 'IN' ? 'default' : 'destructive'}
                  className={log.action === 'IN' ? 'bg-accent' : ''}
                >
                  {log.action}
                </Badge>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No lab activity recorded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}