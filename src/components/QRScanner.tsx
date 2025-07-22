import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, ScanLine, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScanComplete?: (data: any) => void;
}

export default function QRScanner({ onScanComplete }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Simulate QR scanning for demo - replace with actual QR library
  const startScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Simulate scanning a QR code (replace with actual QR detection)
  const simulateScan = async (studentId: string) => {
    setIsLoading(true);
    try {
      // Get student profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Student Not Found",
          description: "QR code not recognized. Please register first.",
          variant: "destructive"
        });
        return;
      }

      // Check last entry to determine if this is entry or exit
      const { data: lastLog } = await supabase
        .from('inout_logs')
        .select('*')
        .eq('student_id', profile.id)
        .order('timestamp', { ascending: false })
        .limit(1);

      const action = (!lastLog || lastLog.length === 0 || lastLog[0]?.action === 'OUT') ? 'IN' : 'OUT';

      // Record the scan
      const { data: logData, error: logError } = await supabase
        .from('inout_logs')
        .insert({
          student_id: profile.id,
          action: action,
          scanned_by: 'system'
        })
        .select()
        .single();

      if (logError) throw logError;

      const scanResult = {
        ...logData,
        profile: profile,
        action: action
      };

      setLastScan(scanResult);
      onScanComplete?.(scanResult);

      toast({
        title: `${action === 'IN' ? 'Entry' : 'Exit'} Recorded`,
        description: `${profile.first_name} ${profile.last_name} - ${action === 'IN' ? 'Entered' : 'Left'} lab`,
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Scan Error",
        description: "Failed to process scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="shadow-lab border-lab-blue/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-lab-blue">
            <Camera className="h-6 w-6" />
            QR Laboratory Scanner
          </CardTitle>
          <CardDescription>
            Scan QR code to log laboratory entry/exit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner Interface */}
          <div className="relative aspect-square bg-gradient-subtle rounded-lg overflow-hidden border-2 border-dashed border-lab-blue/30">
            {isScanning ? (
              <>
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-lg">
                  <div className="absolute inset-4 border-2 border-accent/70 rounded-lg">
                    <div className="w-full h-0.5 bg-accent animate-scan-line absolute top-1/2 left-0 transform -translate-y-1/2" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="bg-lab-blue/90 text-white">
                    <ScanLine className="h-3 w-3 mr-1" />
                    Scanning...
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-lab-gray">
                <Camera className="h-16 w-16 mb-4 text-lab-blue/50" />
                <p className="text-sm text-center">
                  {lastScan ? 'Ready to scan next QR code' : 'Start camera to scan QR codes'}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <Button 
              onClick={isScanning ? stopScanning : startScanning}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              disabled={isLoading}
            >
              {isScanning ? 'Stop Scanner' : 'Start Scanner'}
            </Button>

            {/* Demo buttons for testing */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => simulateScan('STU001')}
                disabled={isLoading}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Demo: Student 1
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => simulateScan('STU002')}
                disabled={isLoading}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Demo: Student 2
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Scan Result */}
      {lastScan && (
        <Card className="shadow-card animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {lastScan.action === 'IN' ? (
                <CheckCircle className="h-4 w-4 text-accent" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              Last Scan Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {lastScan.profile?.first_name} {lastScan.profile?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastScan.profile?.student_id}
                </p>
              </div>
              <Badge 
                variant={lastScan.action === 'IN' ? 'default' : 'destructive'}
                className={lastScan.action === 'IN' ? 'bg-accent' : ''}
              >
                {lastScan.action === 'IN' ? 'ENTERED' : 'EXITED'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date(lastScan.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}