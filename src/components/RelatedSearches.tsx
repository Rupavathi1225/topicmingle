import { ChevronRight } from 'lucide-react';
import { useTracking } from '@/hooks/useTracking';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RelatedSearch {
  id: string;
  search_text: string;
  display_order: number;
  allowed_countries: string[];
}

interface RelatedSearchesProps {
  categoryId: number;
}

const RelatedSearches = ({ categoryId }: RelatedSearchesProps) => {
  const { trackClick } = useTracking();
  const [searches, setSearches] = useState<RelatedSearch[]>([]);
  const [userCountry, setUserCountry] = useState<string>('WW');

  useEffect(() => {
    // Get user's country
    const getUserCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setUserCountry(data.country_code || 'WW');
      } catch {
        setUserCountry('WW');
      }
    };
    getUserCountry();
  }, []);

  useEffect(() => {
    const fetchRelatedSearches = async () => {
      const { data } = await supabase
        .from('related_searches')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (data) {
        // Filter by country
        const filteredSearches = data.filter(search => 
          search.allowed_countries.includes('WW') || 
          search.allowed_countries.includes(userCountry)
        ).slice(0, 4);
        setSearches(filteredSearches);
      }
    };

    if (userCountry) {
      fetchRelatedSearches();
    }
  }, [categoryId, userCountry]);

  const handleSearchClick = async (search: string) => {
    try {
      // Track the click with all details before opening new page
      await trackClick(`related-search-${search}`, search);
      // Redirect to our related search page
      window.location.href = `/related-search?q=${encodeURIComponent(search)}`;
    } catch (error) {
      console.error('Error tracking related search click:', error);
      // Still redirect even if tracking fails
      window.location.href = `/related-search?q=${encodeURIComponent(search)}`;
    }
  };

  if (searches.length === 0) return null;

  return (
    <div className="my-12">
      <h3 className="text-sm font-semibold text-blog-meta mb-4">Related searches</h3>
      <div className="grid gap-4">
        {searches.map((search) => (
          <button
            key={search.id}
            onClick={() => handleSearchClick(search.search_text)}
            className="flex items-center justify-between p-4 bg-[#1a2332] hover:bg-[#243042] text-white rounded-lg transition-colors duration-200 group"
          >
            <span className="text-left font-medium">{search.search_text}</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedSearches;