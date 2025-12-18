import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const TestSupabase = () => {
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionResult(null);
    
    try {
      // Try a simple auth check to test connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setConnectionResult(`Error: ${error.message}`);
      } else {
        setConnectionResult(`Success! Session: ${data.session ? 'Active' : 'No active session'}`);
      }
    } catch (err) {
      setConnectionResult(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">VITE_SUPABASE_URL:</p>
            <p className="font-mono text-sm bg-muted p-2 rounded break-all">
              {supabaseUrl || 'NOT SET'}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">VITE_SUPABASE_PUBLISHABLE_KEY (first 50 chars):</p>
            <p className="font-mono text-sm bg-muted p-2 rounded break-all">
              {supabaseKey ? supabaseKey.substring(0, 50) + '...' : 'NOT SET'}
            </p>
          </div>

          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>

          {connectionResult && (
            <div className={`p-4 rounded ${connectionResult.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p className="font-mono text-sm">{connectionResult}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSupabase;
