import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/hooks/useTracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  category_id: number;
  author: string;
  content: string;
  featured_image: string | null;
  status: string;
  published_at: string;
  serial_number: number;
}

interface RelatedSearch {
  id: string;
  category_id: number;
  search_text: string;
  display_order: number;
  is_active: boolean;
  allowed_countries: string[];
  session_id?: string;
  ip_address?: string;
}

interface AnalyticsDetail {
  session_id: string;
  ip_address: string;
  country: string;
  source: string;
  user_agent: string;
  page_views_count: number;
  clicks_count: number;
  related_searches_count: number;
  related_searches_breakdown: Array<{search_term: string; click_count: number}>;
  last_active: string;
}

interface Analytics {
  sessions: number;
  page_views: number;
  clicks: number;
}

const Admin = () => {
  const { sessionId } = useTracking();
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ sessions: 0, page_views: 0, clicks: 0 });
  const [activeTab, setActiveTab] = useState<'blogs' | 'searches' | 'analytics'>('blogs');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [editingSearch, setEditingSearch] = useState<RelatedSearch | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category_id: "",
    author: "",
    content: "",
    featured_image: "",
    status: "draft",
  });

  const [searchFormData, setSearchFormData] = useState({
    category_id: "",
    search_text: "",
    display_order: 0,
    is_active: true,
    allowed_countries: ["WW"] as string[],
  });

  const [analyticsDetails, setAnalyticsDetails] = useState<AnalyticsDetail[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  // Get IP address for tracking
  const getIPAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };


  useEffect(() => {
    fetchCategories();
    fetchBlogs();
    fetchRelatedSearches();
    fetchAnalytics();
  }, []);


  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("id");
    if (data) setCategories(data);
  };

  const fetchBlogs = async () => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBlogs(data);
  };

  const fetchRelatedSearches = async () => {
    const { data } = await supabase
      .from("related_searches")
      .select("*")
      .order("category_id", { ascending: true })
      .order("display_order", { ascending: true });
    if (data) setRelatedSearches(data);
  };

  const fetchAnalytics = async () => {
    const { count: sessionsCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });
    
    const { count: pageViewsCount } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true });
    
    const { count: clicksCount } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true });

    setAnalytics({
      sessions: sessionsCount || 0,
      page_views: pageViewsCount || 0,
      clicks: clicksCount || 0,
    });

    // Fetch detailed analytics
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*")
      .order("last_active", { ascending: false });

    if (sessionsData) {
      const details = await Promise.all(
        sessionsData.map(async (session) => {
          const { count: pvCount } = await supabase
            .from("page_views")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session.session_id);

          const { count: cCount } = await supabase
            .from("clicks")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session.session_id);

          const { count: rsCount } = await supabase
            .from("clicks")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session.session_id)
            .like("button_id", "related-search-%");

          // Get breakdown of each related search
          const { data: rsBreakdown } = await supabase
            .from("clicks")
            .select("button_label")
            .eq("session_id", session.session_id)
            .like("button_id", "related-search-%");

          // Count clicks per search term
          const breakdownMap = new Map<string, number>();
          rsBreakdown?.forEach(click => {
            const term = click.button_label || 'Unknown';
            breakdownMap.set(term, (breakdownMap.get(term) || 0) + 1);
          });
          const breakdown = Array.from(breakdownMap.entries()).map(([search_term, click_count]) => ({
            search_term,
            click_count
          }));

          return {
            session_id: session.session_id,
            ip_address: session.ip_address || 'unknown',
            country: session.country || 'WW',
            source: session.source || 'direct',
            user_agent: session.user_agent || 'unknown',
            page_views_count: pvCount || 0,
            clicks_count: cCount || 0,
            related_searches_count: rsCount || 0,
            related_searches_breakdown: breakdown,
            last_active: session.last_active,
          };
        })
      );
      setAnalyticsDetails(details);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category_id || !formData.author || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    const blogData = {
      title: formData.title,
      slug: formData.slug,
      category_id: parseInt(formData.category_id),
      author: formData.author,
      content: formData.content,
      featured_image: formData.featured_image || null,
      status: formData.status,
    };

    if (editingBlog) {
      const { error } = await supabase
        .from("blogs")
        .update(blogData)
        .eq("id", editingBlog.id);

      if (error) {
        toast.error("Failed to update blog");
      } else {
        toast.success("Blog updated successfully");
        fetchBlogs();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("blogs").insert([blogData]);

      if (error) {
        toast.error("Failed to create blog");
      } else {
        toast.success("Blog created successfully");
        fetchBlogs();
        resetForm();
      }
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      category_id: blog.category_id.toString(),
      author: blog.author,
      content: blog.content,
      featured_image: blog.featured_image || "",
      status: blog.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      const { error } = await supabase.from("blogs").delete().eq("id", id);

      if (error) {
        toast.error("Failed to delete blog");
      } else {
        toast.success("Blog deleted successfully");
        fetchBlogs();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      category_id: "",
      author: "",
      content: "",
      featured_image: "",
      status: "draft",
    });
    setEditingBlog(null);
    setIsDialogOpen(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchFormData.category_id || !searchFormData.search_text) {
      toast.error("Please fill in all required fields");
      return;
    }

    const ipAddress = await getIPAddress();

    const searchData = {
      category_id: parseInt(searchFormData.category_id),
      search_text: searchFormData.search_text,
      display_order: searchFormData.display_order,
      is_active: searchFormData.is_active,
      allowed_countries: searchFormData.allowed_countries,
      session_id: sessionId,
      ip_address: ipAddress,
    };

    if (editingSearch) {
      const { error } = await supabase
        .from("related_searches")
        .update(searchData)
        .eq("id", editingSearch.id);

      if (error) {
        toast.error("Failed to update search");
      } else {
        toast.success("Search updated successfully");
        fetchRelatedSearches();
        resetSearchForm();
      }
    } else {
      const { error } = await supabase.from("related_searches").insert([searchData]);

      if (error) {
        toast.error("Failed to create search");
      } else {
        toast.success("Search created successfully");
        fetchRelatedSearches();
        resetSearchForm();
      }
    }
  };

  const handleEditSearch = (search: RelatedSearch) => {
    setEditingSearch(search);
    setSearchFormData({
      category_id: search.category_id.toString(),
      search_text: search.search_text,
      display_order: search.display_order,
      is_active: search.is_active,
      allowed_countries: search.allowed_countries || ["WW"],
    });
    setIsSearchDialogOpen(true);
  };

  const handleDeleteSearch = async (id: string) => {
    if (confirm("Are you sure you want to delete this related search?")) {
      const { error } = await supabase.from("related_searches").delete().eq("id", id);

      if (error) {
        toast.error("Failed to delete search");
      } else {
        toast.success("Search deleted successfully");
        fetchRelatedSearches();
      }
    }
  };

  const resetSearchForm = () => {
    setSearchFormData({
      category_id: "",
      search_text: "",
      display_order: 0,
      is_active: true,
      allowed_countries: ["WW"],
    });
    setEditingSearch(null);
    setIsSearchDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          
          <div className="flex gap-2">
            {activeTab === 'blogs' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Blog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBlog ? "Edit Blog" : "Create New Blog"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    value={formData.featured_image}
                    onChange={(e) =>
                      setFormData({ ...formData, featured_image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={10}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingBlog ? "Update Blog" : "Create Blog"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
            )}

            {activeTab === 'searches' && (
              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetSearchForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Related Search
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSearch ? "Edit Related Search" : "Create New Related Search"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="search-category">Category *</Label>
                      <Select
                        value={searchFormData.category_id}
                        onValueChange={(value) =>
                          setSearchFormData({ ...searchFormData, category_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="search-text">Search Text *</Label>
                      <Input
                        id="search-text"
                        value={searchFormData.search_text}
                        onChange={(e) =>
                          setSearchFormData({ ...searchFormData, search_text: e.target.value })
                        }
                        required
                        placeholder="e.g., Free Education"
                      />
                    </div>

                    <div>
                      <Label htmlFor="display-order">Display Order</Label>
                      <Input
                        id="display-order"
                        type="number"
                        value={searchFormData.display_order}
                        onChange={(e) =>
                          setSearchFormData({ ...searchFormData, display_order: parseInt(e.target.value) })
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-active"
                        checked={searchFormData.is_active}
                        onChange={(e) =>
                          setSearchFormData({ ...searchFormData, is_active: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="is-active">Active</Label>
                    </div>

                    <div>
                      <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
                      <Input
                        id="countries"
                        placeholder="WW,US,IN (or just WW for worldwide)"
                        value={searchFormData.allowed_countries.join(',')}
                        onChange={(e) => {
                          const countries = e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
                          setSearchFormData({ ...searchFormData, allowed_countries: countries.length > 0 ? countries : ["WW"] });
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use country codes: US, IN, GB, etc. Use WW for worldwide.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingSearch ? "Update Search" : "Create Search"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetSearchForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'blogs'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Blogs
          </button>
          <button
            onClick={() => setActiveTab('searches')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'searches'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Related Searches
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Blogs Table */}
        {activeTab === 'blogs' && (
          <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Serial #</th>
                  <th className="text-left p-4 font-semibold">Title</th>
                  <th className="text-left p-4 font-semibold">Author</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id} className="border-b last:border-0">
                    <td className="p-4">
                      <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded">
                        #{blog.serial_number}
                      </span>
                    </td>
                    <td className="p-4">{blog.title}</td>
                    <td className="p-4">{blog.author}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          blog.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(blog)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Related Searches Table */}
        {activeTab === 'searches' && (
          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Search Text</th>
                    <th className="text-left p-4 font-semibold">Countries</th>
                    <th className="text-left p-4 font-semibold">Order</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedSearches.map((search) => {
                    const category = categories.find(c => c.id === search.category_id);
                    return (
                      <tr key={search.id} className="border-b last:border-0">
                        <td className="p-4">{category?.name}</td>
                        <td className="p-4">{search.search_text}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {search.allowed_countries?.join(', ') || 'WW'}
                          </span>
                        </td>
                        <td className="p-4">{search.display_order}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              search.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {search.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSearch(search)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSearch(search.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Total Sessions</h3>
                <p className="text-4xl font-bold text-accent">{analytics.sessions}</p>
                <p className="text-sm text-muted-foreground mt-2">Unique visitors tracked</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Page Views</h3>
                <p className="text-4xl font-bold text-accent">{analytics.page_views}</p>
                <p className="text-sm text-muted-foreground mt-2">Total pages viewed</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Total Clicks</h3>
                <p className="text-4xl font-bold text-accent">{analytics.clicks}</p>
                <p className="text-sm text-muted-foreground mt-2">Buttons and links clicked</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="WW">Worldwide</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Source</Label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="meta">Meta</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Detailed Analytics Table */}
            <div className="bg-card rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Session ID</th>
                      <th className="text-left p-4 font-semibold">IP Address</th>
                      <th className="text-left p-4 font-semibold">Country</th>
                      <th className="text-left p-4 font-semibold">Source</th>
                      <th className="text-left p-4 font-semibold">Device</th>
                      <th className="text-left p-4 font-semibold">Page Views</th>
                      <th className="text-left p-4 font-semibold">Clicks</th>
                      <th className="text-left p-4 font-semibold">Related Searches</th>
                      <th className="text-left p-4 font-semibold">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsDetails
                      .filter(detail => 
                        (selectedCountry === 'all' || detail.country === selectedCountry) &&
                        (selectedSource === 'all' || detail.source === selectedSource)
                      )
                      .map((detail) => (
                        <tr key={detail.session_id} className="border-b last:border-0">
                          <td className="p-4 font-mono text-xs">{detail.session_id.substring(0, 8)}...</td>
                          <td className="p-4">{detail.ip_address}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {detail.country}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {detail.source}
                            </span>
                          </td>
                          <td className="p-4 text-xs max-w-xs truncate" title={detail.user_agent}>
                            {detail.user_agent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
                          </td>
                          <td className="p-4 text-center">{detail.page_views_count}</td>
                          <td className="p-4 text-center">{detail.clicks_count}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold text-center">
                                Total: {detail.related_searches_count}
                              </span>
                              {detail.related_searches_breakdown.length > 0 && (
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                                    View breakdown
                                  </summary>
                                  <div className="mt-2 space-y-1">
                                    {detail.related_searches_breakdown.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                                        <span className="font-medium text-gray-700">{item.search_term}</span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                                          {item.click_count}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {new Date(detail.last_active).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
