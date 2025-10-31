import { ChevronRight } from 'lucide-react';
import { useTracking } from '@/hooks/useTracking';

interface RelatedSearchesProps {
  searches: string[];
}

const RelatedSearches = ({ searches }: RelatedSearchesProps) => {
  const { trackClick } = useTracking();

  const handleSearchClick = (search: string) => {
    trackClick(`related-search-${search}`, search);
    // Open search in new tab (similar to TopicMingle)
    window.open(`https://www.google.com/search?q=${encodeURIComponent(search)}`, '_blank');
  };

  return (
    <div className="my-12">
      <h3 className="text-sm font-semibold text-blog-meta mb-4">Related searches</h3>
      <div className="grid gap-4">
        {searches.map((search, index) => (
          <button
            key={index}
            onClick={() => handleSearchClick(search)}
            className="flex items-center justify-between p-4 bg-[#1a2332] hover:bg-[#243042] text-white rounded-lg transition-colors duration-200 group"
          >
            <span className="text-left font-medium">{search}</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedSearches;