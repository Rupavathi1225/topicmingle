import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  author: string;
  featuredImage?: string;
  publishedAt: string;
  excerpt?: string;
  serialNumber?: number;
}

const BlogCard = ({
  title,
  slug,
  category,
  categorySlug,
  author,
  featuredImage,
  publishedAt,
  excerpt,
  serialNumber,
}: BlogCardProps) => {
  return (
    <article className="group">
      <Link to={`/blog/${categorySlug}/${slug}`}>
        {featuredImage && (
          <div className="aspect-video overflow-hidden rounded-lg mb-4">
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </Link>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {serialNumber && (
            <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded">
              #{serialNumber}
            </span>
          )}
          <Link
            to={`/category/${categorySlug}`}
            className="inline-block text-xs font-semibold text-accent hover:underline"
          >
            {category}
          </Link>
        </div>
        
        <Link to={`/blog/${categorySlug}/${slug}`}>
          <h2 className="text-2xl font-bold text-blog-heading group-hover:text-accent transition-colors line-clamp-2">
            {title}
          </h2>
        </Link>
        
        {excerpt && (
          <p className="text-blog-meta text-sm line-clamp-2">{excerpt}</p>
        )}
        
        <div className="flex items-center gap-2 text-sm text-blog-meta">
          <Calendar className="h-4 w-4" />
          <time>{format(new Date(publishedAt), "MMM dd, yyyy")}</time>
          <span>•</span>
          <span>{author}</span>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
