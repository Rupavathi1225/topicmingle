import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface EmailCapture {
  id: string;
  email: string;
  page_key: string;
  source: string | null;
  country: string | null;
  captured_at: string;
}

interface EmailCaptureViewerProps {
  projectClient: any;
}

export const EmailCaptureViewer = ({ projectClient }: EmailCaptureViewerProps) => {
  const [captures, setCaptures] = useState<EmailCapture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaptures();
  }, []);

  const fetchCaptures = async () => {
    setLoading(true);
    const { data } = await projectClient
      .from('email_captures')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(100);

    if (data) setCaptures(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div>Loading email captures...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Email Captures</span>
          <Badge variant="secondary">{captures.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {captures.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No emails captured yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Captured At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {captures.map((capture) => (
                  <TableRow key={capture.id}>
                    <TableCell className="font-medium">{capture.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{capture.page_key}</Badge>
                    </TableCell>
                    <TableCell>{capture.country || 'Unknown'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(capture.captured_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
