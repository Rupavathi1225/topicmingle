import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PreLandingPage {
  id: string;
  page_key: string;
  logo_url: string | null;
  logo_position: string;
  logo_width: number;
  main_image_url: string | null;
  image_ratio: string;
  headline: string;
  description: string | null;
  headline_font_size: number;
  headline_color: string;
  headline_align: string;
  description_font_size: number;
  description_color: string;
  description_align: string;
  cta_text: string;
  cta_color: string;
  background_color: string;
  background_image_url: string | null;
  target_url: string;
  is_active: boolean;
}

interface PreLandingPageBuilderProps {
  projectClient: any;
}

export const PreLandingPageBuilder = ({ projectClient }: PreLandingPageBuilderProps) => {
  const [pages, setPages] = useState<PreLandingPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<PreLandingPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PreLandingPage>>({
    page_key: '',
    logo_position: 'top-center',
    logo_width: 150,
    image_ratio: '16:9',
    headline: '',
    description: '',
    headline_font_size: 32,
    headline_color: '#000000',
    headline_align: 'center',
    description_font_size: 16,
    description_color: '#333333',
    description_align: 'center',
    cta_text: 'Get Started',
    cta_color: '#10b981',
    background_color: '#ffffff',
    target_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await projectClient.from('pre_landing_pages').select('*').order('created_at', { ascending: false });
    if (data) setPages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPage) {
      const { error } = await projectClient
        .from('pre_landing_pages')
        .update(formData)
        .eq('id', selectedPage.id);
      
      if (error) {
        toast.error('Failed to update page');
      } else {
        toast.success('Page updated successfully');
        setIsEditing(false);
        setSelectedPage(null);
        fetchPages();
      }
    } else {
      const { error } = await projectClient
        .from('pre_landing_pages')
        .insert([formData]);
      
      if (error) {
        toast.error('Failed to create page');
      } else {
        toast.success('Page created successfully');
        setIsEditing(false);
        resetForm();
        fetchPages();
      }
    }
  };

  const handleEdit = (page: PreLandingPage) => {
    setSelectedPage(page);
    setFormData(page);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    const { error } = await projectClient.from('pre_landing_pages').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete page');
    } else {
      toast.success('Page deleted successfully');
      fetchPages();
    }
  };

  const resetForm = () => {
    setFormData({
      page_key: '',
      logo_position: 'top-center',
      logo_width: 150,
      image_ratio: '16:9',
      headline: '',
      description: '',
      headline_font_size: 32,
      headline_color: '#000000',
      headline_align: 'center',
      description_font_size: 16,
      description_color: '#333333',
      description_align: 'center',
      cta_text: 'Get Started',
      cta_color: '#10b981',
      background_color: '#ffffff',
      target_url: '',
      is_active: true,
    });
    setSelectedPage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pre-Landing Pages</h2>
        <Button onClick={() => setIsEditing(true)}>Add New Page</Button>
      </div>

      {!isEditing ? (
        <div className="grid gap-4">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{page.page_key}</span>
                  <div className="space-x-2">
                    <Button onClick={() => handleEdit(page)} variant="outline" size="sm">Edit</Button>
                    <Button onClick={() => handleDelete(page.id)} variant="destructive" size="sm">Delete</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{page.headline}</p>
                <p className="text-xs text-muted-foreground mt-2">Target: {page.target_url}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{selectedPage ? 'Edit Page' : 'Create New Page'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Page Key (unique identifier)</Label>
                <Input
                  value={formData.page_key}
                  onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
                  required
                  placeholder="e.g., wr-1, wr-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={formData.logo_url || ''}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label>Logo Position</Label>
                  <Select
                    value={formData.logo_position}
                    onValueChange={(value) => setFormData({ ...formData, logo_position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo Width (px)</Label>
                  <Input
                    type="number"
                    value={formData.logo_width}
                    onChange={(e) => setFormData({ ...formData, logo_width: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Main Image URL</Label>
                  <Input
                    value={formData.main_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <Label>Image Ratio</Label>
                <Select
                  value={formData.image_ratio}
                  onValueChange={(value) => setFormData({ ...formData, image_ratio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="1:1">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Headline</Label>
                <Input
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  required
                  placeholder="Enter headline"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    type="number"
                    value={formData.headline_font_size}
                    onChange={(e) => setFormData({ ...formData, headline_font_size: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={formData.headline_color}
                    onChange={(e) => setFormData({ ...formData, headline_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={formData.headline_align}
                    onValueChange={(value) => setFormData({ ...formData, headline_align: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    type="number"
                    value={formData.description_font_size}
                    onChange={(e) => setFormData({ ...formData, description_font_size: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={formData.description_color}
                    onChange={(e) => setFormData({ ...formData, description_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={formData.description_align}
                    onValueChange={(value) => setFormData({ ...formData, description_align: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Button Text</Label>
                  <Input
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CTA Button Color</Label>
                  <Input
                    type="color"
                    value={formData.cta_color}
                    onChange={(e) => setFormData({ ...formData, cta_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Background Image URL (optional)</Label>
                  <Input
                    value={formData.background_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                    placeholder="https://example.com/bg.jpg"
                  />
                </div>
              </div>

              <div>
                <Label>Target URL (where to redirect after email capture)</Label>
                <Input
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  required
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedPage ? 'Update' : 'Create'} Page
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
