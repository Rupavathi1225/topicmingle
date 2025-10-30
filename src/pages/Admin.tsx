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
}

const Admin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category_id: "",
    author: "",
    content: "",
    featured_image: "",
    status: "draft",
  });

  useEffect(() => {
    fetchCategories();
    fetchBlogs();
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
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
        </div>

        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Title</th>
                  <th className="text-left p-4 font-semibold">Author</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id} className="border-b last:border-0">
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
      </div>
    </div>
  );
};

export default Admin;
