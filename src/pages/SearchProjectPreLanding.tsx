import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProjectClient } from '@/integrations/searchproject/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PreLandingPageData {
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
}

export default function SearchProjectPreLanding() {
  const [searchParams] = useSearchParams();
  const pageKey = searchParams.get('page');
  const [pageData, setPageData] = useState<PreLandingPageData | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pageKey) {
      fetchPageData();
    }
  }, [pageKey]);

  const fetchPageData = async () => {
    const { data, error } = await searchProjectClient
      .from('pre_landing_pages')
      .select('*')
      .eq('page_key', pageKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast.error('Page not found');
      setLoading(false);
      return;
    }

    setPageData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !pageData) return;

    setSubmitting(true);

    try {
      let country = 'Unknown';
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        country = data.country_code || 'Unknown';
      } catch (err) {
        console.error('Failed to get country:', err);
      }

      const { error } = await searchProjectClient.from('email_captures').insert([
        {
          email,
          page_key: pageData.page_key,
          source: window.location.href,
          country,
        },
      ]);

      if (error) {
        toast.error('Failed to save email');
        setSubmitting(false);
        return;
      }

      toast.success('Email captured successfully!');
      
      setTimeout(() => {
        window.location.href = pageData.target_url;
      }, 1000);
    } catch (err) {
      toast.error('Something went wrong');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!pageData) {
    return <div className="min-h-screen flex items-center justify-center"><p>Page not found</p></div>;
  }

  const aspectRatioClass = 
    pageData.image_ratio === '16:9' ? 'aspect-video' :
    pageData.image_ratio === '4:3' ? 'aspect-[4/3]' :
    'aspect-square';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: pageData.background_color,
        backgroundImage: pageData.background_image_url ? `url(${pageData.background_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {pageData.logo_url && (
        <div className={`p-6 ${pageData.logo_position === 'top-center' ? 'flex justify-center' : ''}`}>
          <img src={pageData.logo_url} alt="Logo" style={{ width: `${pageData.logo_width}px` }} className="object-contain" />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          {pageData.main_image_url && (
            <div className={`w-full ${aspectRatioClass} overflow-hidden rounded-lg`}>
              <img src={pageData.main_image_url} alt="Main" className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            style={{
              fontSize: `${pageData.headline_font_size}px`,
              color: pageData.headline_color,
              textAlign: pageData.headline_align as any,
            }}
            className="font-bold leading-tight"
          >
            {pageData.headline}
          </h1>

          {pageData.description && (
            <p
              style={{
                fontSize: `${pageData.description_font_size}px`,
                color: pageData.description_color,
                textAlign: pageData.description_align as any,
              }}
              className="leading-relaxed"
            >
              {pageData.description}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="h-12 text-lg bg-white border-2"
              style={{ borderColor: pageData.cta_color }}
            />
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-lg font-semibold"
              style={{ backgroundColor: pageData.cta_color, color: '#ffffff' }}
            >
              {submitting ? 'Submitting...' : pageData.cta_text}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
