import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTracking } from '@/hooks/useTracking';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RelatedSearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackPageView, trackClick } = useTracking();
  const searchTerm = searchParams.get('q');

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [trackPageView]);

  const handleVisitNow = async () => {
    if (searchTerm) {
      await trackClick(`visit-now-${searchTerm}`, `Visit Now: ${searchTerm}`);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank');
    }
  };

  if (!searchTerm) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">
              {searchTerm}
            </h1>
            <p className="text-lg text-muted-foreground">
              Ready to explore more about "{searchTerm}"? Click the button below to visit Google and find detailed information.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Search Results Await</h2>
              <p className="text-muted-foreground">
                We've prepared a search for you. Click "Visit Now" to see comprehensive results on Google.
              </p>
            </div>

            <Button 
              onClick={handleVisitNow}
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              Visit Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>You'll be redirected to Google search results in a new tab</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RelatedSearchPage;
