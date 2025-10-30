import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import BlogCard from "@/components/BlogCard";

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

        // Fetch recent posts from same category
        const { data: recentData } = await supabase
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
          .limit(3);

        if (recentData) setRecentPosts(recentData as Blog[]);
      }
      setLoading(false);
    };

    fetchBlog();
  }, [blogSlug]);

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

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="text-sm font-semibold text-accent">
              {blog.categories.name}
            </span>
            <span className="mx-2 text-blog-meta">•</span>
            <time className="text-sm text-blog-meta">
              {format(new Date(blog.published_at), "MMM dd, yyyy")}
            </time>
          </div>

          <h1 className="text-5xl font-bold mb-8 leading-tight">
            {blog.title}
          </h1>

          {blog.featured_image && (
            <div className="aspect-video overflow-hidden rounded-lg mb-12">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <article className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-blog-text leading-relaxed">
                  {blog.content}
                </div>
              </article>
            </div>

            <aside className="space-y-8">
              <div className="border border-blog-border rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-2xl">
                    {blog.author.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{blog.author}</h3>
                    <p className="text-sm text-blog-meta">Author</p>
                  </div>
                </div>
                <p className="text-sm text-blog-meta">
                  {blog.author} is a versatile writer who specializes in creating engaging articles across various topics.
                </p>
              </div>

              {recentPosts.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4">Recent Posts</h3>
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <BlogCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        slug={post.slug}
                        category={post.categories.name}
                        categorySlug={post.categories.slug}
                        author={post.author}
                        featuredImage={post.featured_image || undefined}
                        publishedAt={post.published_at}
                      />
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
};

export default BlogPost;
