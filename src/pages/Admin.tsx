import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dataOrbitZoneClient } from "@/integrations/dataorbitzone/client";
import { searchProjectClient } from "@/integrations/searchproject/client";
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
import { Trash2, Edit, Plus, Cloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Category {
  id: number;
  name: string;
  slug: string;
  code_range?: string;
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
  author_bio?: string;
  author_image?: string;
}

interface RelatedSearch {
  id: string;
  category_id?: number;
  blog_id?: string;
  search_text: string;
  target_url?: string;
  display_order: number;
  is_active?: boolean;
  allowed_countries?: string[];
  session_id?: string;
  ip_address?: string;
}

interface PrelandingPage {
  id: string;
  related_search_id: string;
  logo_url: string | null;
  logo_position: string;
  logo_size: number;
  main_image_url: string | null;
  image_ratio: string;
  headline: string;
  description: string;
  headline_font_size: number;
  headline_color: string;
  description_font_size: number;
  description_color: string;
  text_alignment: string;
  email_box_color: string;
  email_box_border_color: string;
  button_text: string;
  button_color: string;
  button_text_color: string;
  background_color: string;
  background_image_url: string | null;
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
  related_searches_breakdown: Array<{search_term: string; click_count: number; unique_clicks: number; visit_now_clicks: number; visit_now_unique: number}>;
  blog_clicks_breakdown: Array<{blog_title: string; click_count: number; unique_clicks: number}>;
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
  
  // DataOrbitZone state
  const [dzCategories, setDzCategories] = useState<Category[]>([]);
  const [dzBlogs, setDzBlogs] = useState<Blog[]>([]);
  const [dzRelatedSearches, setDzRelatedSearches] = useState<RelatedSearch[]>([]);
  const [dzPrelandingPages, setDzPrelandingPages] = useState<PrelandingPage[]>([]);
  
  const [analytics, setAnalytics] = useState<Analytics>({ sessions: 0, page_views: 0, clicks: 0 });
  const [dataOrbitAnalytics, setDataOrbitAnalytics] = useState<Analytics>({ sessions: 0, page_views: 0, clicks: 0 });
  const [searchProjectAnalytics, setSearchProjectAnalytics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'blogs' | 'searches' | 'analytics' | 'dataorbit-analytics' | 'searchproject-analytics'>('blogs');
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
  const [dataOrbitAnalyticsDetails, setDataOrbitAnalyticsDetails] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [dataOrbitSelectedCountry, setDataOrbitSelectedCountry] = useState<string>("all");
  const [dataOrbitSelectedSiteName, setDataOrbitSelectedSiteName] = useState<string>("all");

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
    fetchDataOrbitAnalytics();
    fetchSearchProjectAnalytics();
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

          // Get breakdown of each related search with session_id to get IP
          const { data: rsBreakdown } = await supabase
            .from("clicks")
            .select("button_label, session_id")
            .eq("session_id", session.session_id)
            .like("button_id", "related-search-%");

          // Count clicks and unique IPs per search term
          const breakdownMap = new Map<string, {clicks: number; ips: Set<string>; visitNowClicks: number; visitNowIps: Set<string>}>();
          
          for (const click of rsBreakdown || []) {
            const term = click.button_label || 'Unknown';
            
            // Get IP for this session_id
            const { data: sessionData } = await supabase
              .from("sessions")
              .select("ip_address")
              .eq("session_id", click.session_id)
              .single();
            
            const ip = sessionData?.ip_address || 'unknown';
            
            if (!breakdownMap.has(term)) {
              breakdownMap.set(term, {clicks: 0, ips: new Set(), visitNowClicks: 0, visitNowIps: new Set()});
            }
            const entry = breakdownMap.get(term)!;
            entry.clicks += 1;
            entry.ips.add(ip);
          }

          // Get Visit Now button clicks for each related search
          for (const [term, data] of breakdownMap.entries()) {
            const { data: visitNowClicks } = await supabase
              .from("clicks")
              .select("session_id")
              .eq("button_id", `visit-now-${term}`)
              .eq("session_id", session.session_id);

            for (const click of visitNowClicks || []) {
              const { data: sessionData } = await supabase
                .from("sessions")
                .select("ip_address")
                .eq("session_id", click.session_id)
                .single();
              
              const ip = sessionData?.ip_address || 'unknown';
              data.visitNowClicks += 1;
              data.visitNowIps.add(ip);
            }
          }
          
          const breakdown = Array.from(breakdownMap.entries()).map(([search_term, data]) => ({
            search_term,
            click_count: data.clicks,
            unique_clicks: data.ips.size,
            visit_now_clicks: data.visitNowClicks,
            visit_now_unique: data.visitNowIps.size
          }));

          // Get blog clicks breakdown
          const { data: blogClicksData } = await supabase
            .from("clicks")
            .select("button_label, session_id")
            .eq("session_id", session.session_id)
            .like("button_id", "blog-card-%");

          const blogBreakdownMap = new Map<string, {clicks: number; ips: Set<string>}>();
          
          for (const click of blogClicksData || []) {
            const blogTitle = click.button_label || 'Unknown';
            
            const { data: sessionData } = await supabase
              .from("sessions")
              .select("ip_address")
              .eq("session_id", click.session_id)
              .single();
            
            const ip = sessionData?.ip_address || 'unknown';
            
            if (!blogBreakdownMap.has(blogTitle)) {
              blogBreakdownMap.set(blogTitle, {clicks: 0, ips: new Set()});
            }
            const entry = blogBreakdownMap.get(blogTitle)!;
            entry.clicks += 1;
            entry.ips.add(ip);
          }

          const blogBreakdown = Array.from(blogBreakdownMap.entries()).map(([blog_title, data]) => ({
            blog_title,
            click_count: data.clicks,
            unique_clicks: data.ips.size
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
            blog_clicks_breakdown: blogBreakdown,
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

  const fetchDataOrbitAnalytics = async () => {
    try {
      console.log('🔍 Fetching DataOrbitZone analytics...');
      
      // Fetch all analytics data
      const { data: analyticsData, error } = await dataOrbitZoneClient
        .from("analytics")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ DataOrbitZone fetch error:', error);
        toast.error('Failed to fetch DataOrbitZone analytics. Check RLS policies.');
        return;
      }

      console.log(`✅ Fetched ${analyticsData?.length || 0} analytics records`);

      if (analyticsData && analyticsData.length > 0) {
        // Log all unique event types for debugging
        const eventTypes = new Set(analyticsData.map((a: any) => a.event_type));
        console.log('📊 Event types found:', Array.from(eventTypes));

        // Log sample events with ALL fields to debug
        console.log('📝 Sample events (full data):', analyticsData.slice(0, 2));
        console.log('📝 Sample events (filtered):', analyticsData.slice(0, 3).map(e => ({
          event_type: e.event_type,
          ip_address: e.ip_address,
          country: e.country,
          site_name: e.site_name,
          page_url: e.page_url,
          url: e.url,
          referrer: e.referrer,
          device: e.device,
          source: e.source
        })));

        // More flexible event type matchers - match ANY event type containing these keywords
        const isPageViewEvent = (eventType?: string) => {
          if (!eventType) return false;
          const lower = eventType.toLowerCase().trim();
          // Match: page_view, pageview, page-view, view, page, etc.
          return lower.includes('page') || 
                 lower.includes('view') || 
                 lower === 'page_view' || 
                 lower === 'pageview';
        };

        const isClickEvent = (eventType?: string) => {
          if (!eventType) return false;
          const lower = eventType.toLowerCase().trim();
          return lower.includes('click');
        };

        // Count events
        const pageViewEvents = analyticsData.filter((a: any) => isPageViewEvent(a.event_type));
        const clickEvents = analyticsData.filter((a: any) => isClickEvent(a.event_type));
        
        console.log('📈 Page view events:', pageViewEvents.length);
        console.log('🖱️  Click events:', clickEvents.length);

        const sessions = new Set(analyticsData.map((a: any) => a.session_id)).size;
        const pageViews = pageViewEvents.length;
        const clicks = clickEvents.length;

        console.log('📊 Final totals:', { sessions, pageViews, clicks });

        setDataOrbitAnalytics({
          sessions,
          page_views: pageViews,
          clicks
        });

        // Build lookup maps for names
        const relatedSearchIds = Array.from(new Set(
          analyticsData.filter((e: any) => !!e.related_search_id).map((e: any) => e.related_search_id)
        ));
        const blogIds = Array.from(new Set(
          analyticsData.filter((e: any) => !!e.blog_id).map((e: any) => e.blog_id)
        ));

        const relatedSearchMap = new Map<string, string>();
        if (relatedSearchIds.length > 0) {
          const { data: rsData } = await dataOrbitZoneClient
            .from('related_searches')
            .select('id, search_text')
            .in('id', relatedSearchIds);
          rsData?.forEach((r: any) => relatedSearchMap.set(r.id, r.search_text));
        }

        const blogMap = new Map<string, string>();
        if (blogIds.length > 0) {
          const { data: bData } = await dataOrbitZoneClient
            .from('blogs')
            .select('id, title')
            .in('id', blogIds);
          bData?.forEach((b: any) => blogMap.set(b.id, b.title));
        }

        // Helper function to extract domain from URL - now checks multiple URL fields
        const extractSiteName = (event: any) => {
          // Try multiple possible URL field names
          const urlFields = [event.page_url, event.url, event.referrer];
          
          for (const urlField of urlFields) {
            if (!urlField || typeof urlField !== 'string') continue;
            
            try {
              // If it's already a full URL
              if (urlField.startsWith('http://') || urlField.startsWith('https://')) {
                const urlObj = new URL(urlField);
                const hostname = urlObj.hostname.replace(/^www\./, '');
                if (hostname && hostname !== '') return hostname;
              }
              // If it's just a domain
              else if (urlField.includes('.')) {
                const cleaned = urlField.replace(/^www\./, '').split('/')[0];
                if (cleaned && cleaned !== '') return cleaned;
              }
            } catch (error) {
              console.log('Error parsing URL:', urlField, error);
            }
          }
          
          return null;
        };

        // Group by session with enrichment and breakdowns
        const sessionMap = new Map<string, any>();
        analyticsData.forEach((event: any) => {
          if (!sessionMap.has(event.session_id)) {
            // Extract site name from multiple possible sources
            let siteName = 'Unknown';
            
            // First try the site_name field
            if (event.site_name && event.site_name.trim() !== '' && event.site_name !== 'Unknown') {
              siteName = event.site_name;
            } else {
              // Try extracting from URLs
              const extracted = extractSiteName(event);
              if (extracted) {
                siteName = extracted;
              }
            }
            
            console.log(`Session ${event.session_id.slice(0, 8)}: site_name="${event.site_name}" -> resolved to "${siteName}"`);
            
            // Initialize with first event's data - use actual values, not defaults
            sessionMap.set(event.session_id, {
              session_id: event.session_id,
              ip_address: event.ip_address || 'unknown',
              country: event.country || 'unknown',
              site_name: siteName,
              device: event.device || 'unknown',
              source: event.source || 'direct',
              page_views: 0,
              clicks: 0,
              created_at: event.created_at,
              last_active: event.created_at,
              related_search_clicks: new Map<string, { clicks: number; uniques: Set<string> }>(),
              blog_clicks: new Map<string, { clicks: number; uniques: Set<string> }>(),
            });
          }
          const session = sessionMap.get(event.session_id);

          // Enrich with ANY non-null/non-empty values from subsequent events
          if (event.ip_address && event.ip_address.trim() !== '' && event.ip_address !== 'unknown') {
            session.ip_address = event.ip_address;
          }
          if (event.country && event.country.trim() !== '' && event.country !== 'unknown') {
            session.country = event.country;
          }
          // For site_name, try multiple sources
          if (event.site_name && event.site_name.trim() !== '' && event.site_name !== 'Unknown') {
            session.site_name = event.site_name;
          } else if (session.site_name === 'Unknown') {
            const extracted = extractSiteName(event);
            if (extracted) {
              session.site_name = extracted;
            }
          }
          if (event.device && event.device.trim() !== '' && event.device !== 'unknown') {
            session.device = event.device;
          }
          if (event.source && event.source.trim() !== '' && event.source !== 'direct') {
            session.source = event.source;
          }

          // Counters - using the same flexible matching
          if (isPageViewEvent(event.event_type)) {
            session.page_views++;
          }
          if (isClickEvent(event.event_type)) {
            session.clicks++;
          }

          // Breakdowns
          const uniqueKey = (event.ip_address && event.ip_address !== 'unknown') ? event.ip_address : event.session_id;
          if (isClickEvent(event.event_type) && event.related_search_id) {
            const term = relatedSearchMap.get(event.related_search_id) || 'Unknown';
            if (!session.related_search_clicks.has(term)) {
              session.related_search_clicks.set(term, { clicks: 0, uniques: new Set<string>() });
            }
            const entry = session.related_search_clicks.get(term)!;
            entry.clicks += 1;
            entry.uniques.add(uniqueKey);
          }
          if (isClickEvent(event.event_type) && event.blog_id) {
            const title = blogMap.get(event.blog_id) || 'Unknown';
            if (!session.blog_clicks.has(title)) {
              session.blog_clicks.set(title, { clicks: 0, uniques: new Set<string>() });
            }
            const entry = session.blog_clicks.get(title)!;
            entry.clicks += 1;
            entry.uniques.add(uniqueKey);
          }

          // Update last active
          if (new Date(event.created_at).getTime() > new Date(session.last_active).getTime()) {
            session.last_active = event.created_at;
          }
        });

        const details = Array.from(sessionMap.values()).map((s: any) => ({
          ...s,
          related_search_breakdown: Array.from(s.related_search_clicks.entries()).map(([search_term, val]: any) => ({
            search_term,
            click_count: val.clicks,
            unique_clicks: val.uniques.size,
          })),
          blog_clicks_breakdown: Array.from(s.blog_clicks.entries()).map(([blog_title, val]: any) => ({
            blog_title,
            click_count: val.clicks,
            unique_clicks: val.uniques.size,
          })),
        }));

        console.log(`✅ Processed ${details.length} session details`);
        console.log('📋 Sample session detail:', details[0]);
        
        setDataOrbitAnalyticsDetails(details.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } else {
        console.log('⚠️  No analytics data found');
        setDataOrbitAnalytics({ sessions: 0, page_views: 0, clicks: 0 });
        setDataOrbitAnalyticsDetails([]);
      }
    } catch (error) {
      console.error('❌ Error fetching DataOrbitZone analytics:', error);
      toast.error('Failed to fetch DataOrbitZone analytics. Check database connection.');
    }
  };

  const fetchSearchProjectAnalytics = async () => {
    try {
      const { data: analyticsData, error } = await searchProjectClient
        .from('analytics')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      console.log('SearchProject Analytics:', analyticsData);
      setSearchProjectAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error fetching SearchProject analytics:', error);
      toast.error('Failed to fetch SearchProject analytics');
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

            {activeTab === 'dataorbit-analytics' && (
              <Button onClick={fetchDataOrbitAnalytics} variant="outline">
                🔄 Refresh Analytics
              </Button>
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
          <button
            onClick={() => setActiveTab('dataorbit-analytics')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'dataorbit-analytics'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            DataOrbitZone Analytics
          </button>
          <button
            onClick={() => setActiveTab('searchproject-analytics')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'searchproject-analytics'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SearchProject Analytics
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
                      <th className="text-left p-4 font-semibold">Blog Clicks</th>
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
                                      <div key={idx} className="bg-gray-50 p-3 rounded space-y-2">
                                        <div className="flex justify-between items-center text-xs gap-2">
                                          <span className="font-medium text-gray-700 flex-1">{item.search_term}</span>
                                          <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                                              Total: {item.click_count}
                                            </span>
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                                              Unique: {item.unique_clicks}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs gap-2 pl-4 border-l-2 border-green-300">
                                          <span className="text-gray-600">Visit Now Button:</span>
                                          <div className="flex gap-2">
                                            {item.visit_now_clicks > 0 ? (
                                              <>
                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">
                                                  Clicked: {item.visit_now_clicks}
                                                </span>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                                                  Unique: {item.visit_now_unique}
                                                </span>
                                              </>
                                            ) : (
                                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded font-semibold">
                                                Not Clicked
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold text-center">
                                Total: {detail.blog_clicks_breakdown.reduce((sum, item) => sum + item.click_count, 0)}
                              </span>
                              {detail.blog_clicks_breakdown.length > 0 && (
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                                    View breakdown
                                  </summary>
                                  <div className="mt-2 space-y-1">
                                    {detail.blog_clicks_breakdown.map((item, idx) => (
                                      <div key={idx} className="bg-gray-50 p-3 rounded">
                                        <div className="flex justify-between items-center text-xs gap-2">
                                          <span className="font-medium text-gray-700 flex-1">{item.blog_title}</span>
                                          <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                                              Total: {item.click_count}
                                            </span>
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                                              Unique: {item.unique_clicks}
                                            </span>
                                          </div>
                                        </div>
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

        {/* DataOrbitZone Analytics Dashboard */}
        {activeTab === 'dataorbit-analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Total Sessions</h3>
                <p className="text-4xl font-bold text-accent">{dataOrbitAnalytics.sessions}</p>
                <p className="text-sm text-muted-foreground mt-2">Unique visitors tracked</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Page Views</h3>
                <p className="text-4xl font-bold text-accent">{dataOrbitAnalytics.page_views}</p>
                <p className="text-sm text-muted-foreground mt-2">Total pages viewed</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Total Clicks</h3>
                <p className="text-4xl font-bold text-accent">{dataOrbitAnalytics.clicks}</p>
                <p className="text-sm text-muted-foreground mt-2">Buttons and links clicked</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Country</Label>
                  <Select value={dataOrbitSelectedCountry} onValueChange={setDataOrbitSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {Array.from(new Set(dataOrbitAnalyticsDetails.map(d => d.country))).map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Source</Label>
                  <Select value={dataOrbitSelectedSiteName} onValueChange={setDataOrbitSelectedSiteName}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {Array.from(new Set(dataOrbitAnalyticsDetails.map(d => d.source))).map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Detailed Sessions Table */}
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
                      <th className="text-left p-4 font-semibold">Blog Clicks</th>
                      <th className="text-left p-4 font-semibold">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataOrbitAnalyticsDetails
                      .filter(detail => {
                        const countryMatch = dataOrbitSelectedCountry === 'all' || detail.country === dataOrbitSelectedCountry;
                        const sourceMatch = dataOrbitSelectedSiteName === 'all' || detail.source === dataOrbitSelectedSiteName;
                        return countryMatch && sourceMatch;
                      })
                      .map((detail, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4 text-sm font-mono">{detail.session_id.slice(0, 8)}...</td>
                          <td className="p-4 text-sm">{detail.ip_address}</td>
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
                          <td className="p-4 text-sm">{detail.device}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              {detail.page_views}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                              {detail.clicks}
                            </span>
                          </td>
                          <td className="p-4">
                            {detail.related_search_breakdown?.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold text-center">
                                  Total: {detail.related_search_breakdown.reduce((sum: number, item: any) => sum + item.click_count, 0)}
                                </span>
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                    View breakdown
                                  </summary>
                                  <div className="mt-2 space-y-1 max-w-md">
                                    {detail.related_search_breakdown.map((item: any, idx: number) => (
                                      <div key={idx} className="bg-green-50 p-2 rounded text-xs">
                                        <div className="flex justify-between items-center gap-2">
                                          <span className="font-medium flex-1">{item.search_term}</span>
                                          <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                                              Total: {item.click_count}
                                            </span>
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                                              Unique: {item.unique_clicks}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No clicks</span>
                            )}
                          </td>
                          <td className="p-4">
                            {detail.blog_clicks_breakdown?.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold text-center">
                                  Total: {detail.blog_clicks_breakdown.reduce((sum: number, item: any) => sum + item.click_count, 0)}
                                </span>
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                    View breakdown
                                  </summary>
                                  <div className="mt-2 space-y-1 max-w-md">
                                    {detail.blog_clicks_breakdown.map((item: any, idx: number) => (
                                      <div key={idx} className="bg-orange-50 p-2 rounded text-xs">
                                        <div className="flex justify-between items-center gap-2">
                                          <span className="font-medium flex-1">{item.blog_title}</span>
                                          <div className="flex gap-2">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                                              Total: {item.click_count}
                                            </span>
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                                              Unique: {item.unique_clicks}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No clicks</span>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            {new Date(detail.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SearchProject Analytics Dashboard */}
        {activeTab === 'searchproject-analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Total Sessions</h3>
                <p className="text-4xl font-bold text-accent">{searchProjectAnalytics.length}</p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Page Views</h3>
                <p className="text-4xl font-bold text-accent">
                  {searchProjectAnalytics.reduce((sum, s) => sum + (s.page_views || 0), 0)}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Clicks</h3>
                <p className="text-4xl font-bold text-accent">
                  {searchProjectAnalytics.reduce((sum, s) => sum + (s.clicks || 0), 0)}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Related Searches</h3>
                <p className="text-4xl font-bold text-accent">
                  {searchProjectAnalytics.reduce((sum, s) => sum + (s.related_searches || 0), 0)}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Result Clicks</h3>
                <p className="text-4xl font-bold text-accent">
                  {searchProjectAnalytics.reduce((sum, s) => sum + (s.result_clicks || 0), 0)}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Session ID</th>
                      <th className="text-left p-4 font-semibold">IP Address</th>
                      <th className="text-left p-4 font-semibold">Country</th>
                      <th className="text-left p-4 font-semibold">Device</th>
                      <th className="text-left p-4 font-semibold">Source</th>
                      <th className="text-left p-4 font-semibold">Page Views</th>
                      <th className="text-left p-4 font-semibold">Clicks</th>
                      <th className="text-left p-4 font-semibold">Related Searches</th>
                      <th className="text-left p-4 font-semibold">Result Clicks</th>
                      <th className="text-left p-4 font-semibold">Time Spent (s)</th>
                      <th className="text-left p-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchProjectAnalytics.map((session) => (
                      <tr key={session.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4 text-sm font-mono">{session.session_id.substring(0, 8)}...</td>
                        <td className="p-4 text-sm">{session.ip_address || '-'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {session.country || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-sm">{session.device || '-'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {session.source || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            {session.page_views || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                            {session.clicks || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                            {session.related_searches || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {session.result_clicks || 0}
                          </span>
                        </td>
                        <td className="p-4 text-sm">{session.time_spent || 0}</td>
                        <td className="p-4 text-sm">{new Date(session.timestamp).toLocaleString()}</td>
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