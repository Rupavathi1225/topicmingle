import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: number;
  name: string;
  slug: string;
}

const Navbar = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("id", { ascending: true });
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TM</span>
            </div>
            <span className="text-xl font-bold text-primary">TopicMingle</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
