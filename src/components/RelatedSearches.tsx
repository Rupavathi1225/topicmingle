import { ChevronRight } from 'lucide-react';
import { useTracking } from '@/hooks/useTracking';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RelatedSearch {
  id: string;
  search_text: string;
  display_order: number;
}

interface RelatedSearchesProps {
  categoryId: number;
}

const RelatedSearches = ({ categoryId }: RelatedSearchesProps) => {
  const { trackClick } = useTracking();
  const [searches, setSearches] = useState<RelatedSearch[]>([]);

  useEffect(() => {
    const fetchRelatedSearches = async () => {
      const { data } = await supabase
        .from('related_searches')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(4);
      
      if (data) setSearches(data);
    };

    fetchRelatedSearches();
  }, [categoryId]);

  const handleSearchClick = (search: string) => {
    trackClick(`related-search-${search}`, search);
    // Open search in new tab (similar to TopicMingle)
    window.open(`https://www.google.com/search?q=${encodeURIComponent(search)}`, '_blank');
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