import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RelatedSearches from "@/components/RelatedSearches";
import { format } from "date-fns";
import { useTracking } from "@/hooks/useTracking";

interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string;
  featured_image: string | null;
  published_at: string;
  content: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  };
}

const BlogPost = () => {
  const { categorySlug, blogSlug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [recentPosts, setRecentPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackPageView, trackClick } = useTracking();

  useEffect(() => {
    const fetchBlog = async () => {
      const { data } = await supabase
        .from("blogs")
        .select(`
          id,
          title,
          slug,
          author,
          featured_image,
          published_at,
          content,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("slug", blogSlug)
        .eq("status", "published")
        .single();

      if (data) {
        setBlog(data as Blog);
        
        // Track page view
        trackPageView(`/blog/${categorySlug}/${blogSlug}`, data.id);

        // First, try to fetch recent posts from same category
        let { data: recentData } = await supabase
          .from("blogs")
          .select(`
            id,
            title,
            slug,
            author,
            featured_image,
            published_at,
            content,
            categories (
              id,
              name,
              slug
            )
          `)
          .eq("status", "published")
          .eq("category_id", (data as Blog).categories.id)
          .neq("id", data.id)
          .order("published_at", { ascending: false })
          .limit(4);

        // If not enough posts from same category, fetch from all categories
        if (!recentData || recentData.length < 4) {
          const { data: allRecentData } = await supabase
            .from("blogs")
            .select(`
              id,
              title,
              slug,
              author,
              featured_image,
              published_at,
              content,
              categories (
                id,
                name,
                slug
              )
            `)
            .eq("status", "published")
            .neq("id", data.id)
            .order("published_at", { ascending: false })
            .limit(4);
          
          if (allRecentData) recentData = allRecentData;
        }

        if (recentData) setRecentPosts(recentData as Blog[]);
      }
      setLoading(false);
    };

    fetchBlog();
  }, [blogSlug, categorySlug, trackPageView]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  if (!blog) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Blog not found</div>
        </div>
      </>
    );
  }

  // Generate related searches based on blog content
  const relatedSearches = blog ? [
    `Free ${blog.categories.name}`,
    `Best Online ${blog.categories.name} Programs`,
    `${blog.categories.name} and Well-being`,
    `${blog.categories.name} Tips`
  ] : [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Category and Date */}
        <div className="bg-background border-b border-blog-border py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <span 
                className="text-sm font-semibold text-accent cursor-pointer hover:underline"
                onClick={() => trackClick(`category-tag-${blog.categories.slug}`, blog.categories.name)}
              >
                {blog.categories.name}
              </span>
              <span className="mx-2 text-blog-meta">•</span>
              <time className="text-sm text-blog-meta">
                {format(new Date(blog.published_at), "MMM dd, yyyy")}
              </time>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-blog-heading">
              {blog.title}
            </h1>

            {/* Layout: Author Sidebar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
              {/* Left Sidebar - Author Info */}
              <aside className="lg:sticky lg:top-20 self-start">
                <div className="border border-blog-border rounded-lg p-6 bg-card">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-3xl mb-3">
                      {blog.author.charAt(0)}
                    </div>
                    <h3 className="font-bold text-lg text-blog-heading">{blog.author}</h3>
                    <p className="text-sm text-blog-meta mt-1">
                      {blog.author} is a passionate health and wellness writer who shares expertise to inspire readers to prioritize self-care. With a background in holistic nutrition and alternative therapies, provides practical advice, mindful living tips, and natural remedies. {blog.author}'s genuine interest in well-being extends beyond writing, enjoying practicing yoga, exploring organic farming, and experimenting with herbal remedies in own garden.
                    </p>
                  </div>
                </div>

                {/* Recent Posts in Sidebar */}
                {recentPosts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-bold text-xl mb-4 text-blog-heading">Recent posts</h3>
                    <div className="space-y-4">
                      {recentPosts.map((post) => (
                        <div 
                          key={post.id}
                          className="group cursor-pointer"
                          onClick={() => {
                            trackClick(`recent-post-${post.slug}`, post.title);
                            window.location.href = `/blog/${post.categories.slug}/${post.slug}`;
                          }}
                        >
                          <div className="flex gap-3">
                            {post.featured_image && (
                              <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm group-hover:text-accent transition-colors line-clamp-2 text-blog-heading">
                                {post.title}
                              </h4>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* Main Content Area */}
              <div className="space-y-8">
                {/* Featured Image */}
                {blog.featured_image && (
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <img
                      src={blog.featured_image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Article Content */}
                <article className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-blog-text leading-relaxed text-base">
                    {blog.content}
                  </div>
                </article>

                {/* Related Searches */}
                <RelatedSearches searches={relatedSearches} />
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default BlogPost;
