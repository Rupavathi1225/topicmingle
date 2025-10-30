import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BlogCard from "@/components/BlogCard";

interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string;
  featured_image: string | null;
  published_at: string;
  content: string;
  serial_number: number;
  categories: {
    id: number;
    name: string;
    slug: string;
  };
}

const Home = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
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
          serial_number,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data) setBlogs(data as Blog[]);
      setLoading(false);
    };

    fetchBlogs();
  }, []);

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

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to TopicMingle</h1>
          <p className="text-xl text-blog-meta max-w-2xl mx-auto">
            Discover insightful articles across various topics
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-blog-meta">No blogs published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                slug={blog.slug}
                category={blog.categories.name}
                categorySlug={blog.categories.slug}
                author={blog.author}
                featuredImage={blog.featured_image || undefined}
                publishedAt={blog.published_at}
                excerpt={blog.content.substring(0, 150)}
                serialNumber={blog.serial_number}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
