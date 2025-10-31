import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
}

interface Analytics {
  sessions: number;
  page_views: number;
  clicks: number;
}

const Admin = () => {
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
  });

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
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true });
    
    const { data: pageViews } = await supabase
      .from("page_views")
      .select("id", { count: "exact", head: true });
    
    const { data: clicks } = await supabase
      .from("clicks")
      .select("id", { count: "exact", head: true });

    setAnalytics({
      sessions: sessions?.length || 0,
      page_views: pageViews?.length || 0,
      clicks: clicks?.length || 0,
    });
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

    const searchData = {
      category_id: parseInt(searchFormData.category_id),
      search_text: searchFormData.search_text,
      display_order: searchFormData.display_order,
      is_active: searchFormData.is_active,
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
        )}
      </div>
    </div>
  );
};

export default Admin;
