import { useState, useEffect } from 'react';
import { searchProjectClient } from '@/integrations/searchproject/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Edit2, Plus, Save, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WebResult {
  id: string;
  webresult_page: string;
  is_sponsored: boolean;
  offer_name: string | null;
  title: string;
  description: string;
  original_link: string;
  logo_url: string | null;
  serial_number: number;
  imported_from: string | null;
  access_type: string;
  allowed_countries: string[];
  backlink_url: string | null;
}

interface LandingPage {
  id: string;
  title: string;
  description: string;
}

interface EmailCapture {
  id: string;
  email: string;
  web_result_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  country: string | null;
  device: string | null;
  captured_at: string;
  redirected_to: string | null;
}

export function SearchProjectManager() {
  const [activeTab, setActiveTab] = useState('webresults');
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [emailCaptures, setEmailCaptures] = useState<EmailCapture[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (activeTab === 'webresults') fetchWebResults();
    if (activeTab === 'landing') fetchLandingPages();
    if (activeTab === 'emails') fetchEmailCaptures();
  }, [activeTab]);

  const fetchWebResults = async () => {
    const { data, error } = await searchProjectClient
      .from('web_results')
      .select('*')
      .order('serial_number', { ascending: true });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setWebResults(data || []);
    }
  };

  const fetchLandingPages = async () => {
    const { data, error } = await searchProjectClient
      .from('landing_page')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLandingPages(data || []);
    }
  };

  const fetchEmailCaptures = async () => {
    const { data, error } = await searchProjectClient
      .from('email_captures')
      .select('*')
      .order('captured_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setEmailCaptures(data || []);
    }
  };

  const handleSaveWebResult = async () => {
    const data = {
      ...formData,
      serial_number: parseInt(formData.serial_number || '0'),
      allowed_countries: Array.isArray(formData.allowed_countries) 
        ? formData.allowed_countries 
        : (formData.allowed_countries || '').split(',').map((c: string) => c.trim()).filter(Boolean),
    };

    if (editingId) {
      const { error } = await searchProjectClient
        .from('web_results')
        .update(data)
        .eq('id', editingId);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Web result updated' });
        setEditingId(null);
        setFormData({});
        fetchWebResults();
      }
    } else {
      const { error } = await searchProjectClient
        .from('web_results')
        .insert([data]);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Web result created' });
        setFormData({});
        fetchWebResults();
      }
    }
  };

  const handleSaveLandingPage = async () => {
    if (editingId) {
      const { error } = await searchProjectClient
        .from('landing_page')
        .update(formData)
        .eq('id', editingId);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Landing page updated' });
        setEditingId(null);
        setFormData({});
        fetchLandingPages();
      }
    } else {
      const { error } = await searchProjectClient
        .from('landing_page')
        .insert([formData]);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Landing page created' });
        setFormData({});
        fetchLandingPages();
      }
    }
  };

  const handleDeleteWebResult = async (id: string) => {
    const { error } = await searchProjectClient
      .from('web_results')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Web result deleted' });
      fetchWebResults();
    }
  };

  const handleDeleteLandingPage = async (id: string) => {
    const { error } = await searchProjectClient
      .from('landing_page')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Landing page deleted' });
      fetchLandingPages();
    }
  };

  const startEdit = (item: any, type: string) => {
    setEditingId(item.id);
    if (type === 'webresult') {
      setFormData({
        ...item,
        allowed_countries: Array.isArray(item.allowed_countries) 
          ? item.allowed_countries.join(', ') 
          : item.allowed_countries || '',
      });
    } else {
      setFormData(item);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="webresults">Web Results</TabsTrigger>
          <TabsTrigger value="landing">Landing Pages</TabsTrigger>
          <TabsTrigger value="emails">Email Captures</TabsTrigger>
        </TabsList>

        <TabsContent value="webresults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit' : 'Add'} Web Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Webresult Page"
                value={formData.webresult_page || ''}
                onChange={(e) => setFormData({ ...formData, webresult_page: e.target.value })}
              />
              <Input
                placeholder="Title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                placeholder="Original Link"
                value={formData.original_link || ''}
                onChange={(e) => setFormData({ ...formData, original_link: e.target.value })}
              />
              <Input
                placeholder="Logo URL"
                value={formData.logo_url || ''}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Serial Number"
                value={formData.serial_number || ''}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
              <Input
                placeholder="Offer Name"
                value={formData.offer_name || ''}
                onChange={(e) => setFormData({ ...formData, offer_name: e.target.value })}
              />
              <Input
                placeholder="Backlink URL"
                value={formData.backlink_url || ''}
                onChange={(e) => setFormData({ ...formData, backlink_url: e.target.value })}
              />
              <Select
                value={formData.access_type || 'worldwide'}
                onValueChange={(value) => setFormData({ ...formData, access_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Access Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worldwide">Worldwide</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Allowed Countries (comma separated, e.g., US, UK, CA)"
                value={formData.allowed_countries || ''}
                onChange={(e) => setFormData({ ...formData, allowed_countries: e.target.value })}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.is_sponsored || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_sponsored: checked })}
                />
                <label className="text-sm">Is Sponsored</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveWebResult}>
                  {editingId ? <><Save className="h-4 w-4 mr-2" /> Update</> : <><Plus className="h-4 w-4 mr-2" /> Create</>}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {webResults.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.serial_number}. {result.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p><strong>Page:</strong> {result.webresult_page}</p>
                        <p><strong>Link:</strong> {result.original_link}</p>
                        {result.is_sponsored && <p className="text-yellow-600">★ Sponsored</p>}
                        {result.offer_name && <p><strong>Offer:</strong> {result.offer_name}</p>}
                        <p><strong>Access:</strong> {result.access_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(result, 'webresult')}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteWebResult(result.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="landing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit' : 'Add'} Landing Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveLandingPage}>
                  {editingId ? <><Save className="h-4 w-4 mr-2" /> Update</> : <><Plus className="h-4 w-4 mr-2" /> Create</>}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {landingPages.map((page) => (
              <Card key={page.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{page.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{page.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(page, 'landing')}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteLandingPage(page.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Captures ({emailCaptures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailCaptures.map((capture) => (
                  <div key={capture.id} className="border-b pb-2 text-sm">
                    <p><strong>{capture.email}</strong></p>
                    <p className="text-muted-foreground">
                      {capture.country} • {capture.device} • {new Date(capture.captured_at).toLocaleString()}
                    </p>
                    {capture.redirected_to && <p className="text-xs">→ {capture.redirected_to}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
