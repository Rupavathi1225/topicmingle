import { useState, useEffect } from 'react';
// CHANGED: Reverted to aliased paths (@/) which is correct for your project
import { supabase } from '@/integrations/supabase/client';
import { dataOrbitZoneClient } from '@/integrations/dataorbitzone/client';
import { searchProjectClient } from '@/integrations/searchproject/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, RefreshCw, Download, ShoppingCart, Home, Palette, Search, FileText, MousePointerClick } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SiteStats {
  siteName: string;
  icon: any;
  color: string;
  sessions: number;
  pageViews: number;
  uniquePages: number;
  totalClicks: number;
  uniqueClicks: number;
}

// Updated SessionDetail interface to include blog clicks and detailed search results
interface SessionDetail {
  sessionId: string;
  siteName: string;
  siteIcon: any;
  siteColor: string;
  device: string;
  ipAddress: string;
  country: string;
  timeSpent: string;
  timestamp: string;
  pageViews: number;
  uniquePages: number;
  totalClicks: number;
  uniqueClicks: number;
  searchResults: Array<{
    term: string;
    views: number;
    totalClicks: number;
    uniqueClicks: number;
    visitNowClicks: number;
    visitNowUnique: number;
  }>;
  blogClicks: Array<{
    title: string;
    totalClicks: number;
    uniqueClicks: number;
  }>;
  buttonInteractions: Array<{
    button: string;
    total: number;
    unique: number;
  }>;
}

export function UnifiedAnalytics() {
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const sites = [
    { id: 'dataorbitzone', name: 'DataOrbitZone', icon: ShoppingCart, color: 'from-orange-500 to-orange-600' },
    { id: 'searchproject', name: 'SearchProject', icon: Home, color: 'from-pink-500 to-pink-600' },
    { id: 'main', name: 'TopicMingle', icon: Palette, color: 'from-cyan-500 to-cyan-600' },
  ];

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite, selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dataOrbit, searchProj, mainProj] = await Promise.all([
        fetchDataOrbitZone(),
        fetchSearchProject(),
        fetchMainProject(),
      ]);

      const allStats: SiteStats[] = [
        { siteName: 'DataOrbitZone', icon: ShoppingCart, color: 'from-orange-500 to-orange-600', ...dataOrbit.stats },
        { siteName: 'SearchProject', icon: Home, color: 'from-pink-500 to-pink-600', ...searchProj.stats },
        { siteName: 'TopicMingle', icon: Palette, color: 'from-cyan-500 to-cyan-600', ...mainProj.stats },
      ];

      setSiteStats(allStats);

      const allSessions = [
        ...dataOrbit.sessions,
        ...searchProj.sessions,
        ...mainProj.sessions,
      ];

      // keep newest first
      setSessions(allSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch & process DataOrbitZone analytics.
   * - CHANGED: Now fetches blog/search names from their respective tables to show correct labels.
   */
  const fetchDataOrbitZone = async () => {
    const { data: analytics } = await dataOrbitZoneClient
      .from('analytics')
      .select('*')
      .order('created_at', { ascending: false });

    // CHANGED: Added lookup maps for names, just like in Admin.tsx
    const relatedSearchIds = Array.from(new Set((analytics || []).map((e: any) => e.related_search_id).filter(Boolean)));
    const blogIds = Array.from(new Set((analytics || []).map((e: any) => e.blog_id).filter(Boolean)));

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
    // END CHANGED

    const sessionMap = new Map<string, any>();
    const globalUniquePages = new Set<string>();
    const globalUniqueClicks = new Set<string>();

    (analytics || []).forEach((event: any) => {
      const sid = event.session_id || `anon-${event.ip_address || 'unknown'}`;
      if (!sessionMap.has(sid)) {
        sessionMap.set(sid, {
          sessionId: sid,
          device: event.device || 'Desktop • Chrome',
          ipAddress: event.ip_address || 'N/A',
          country: event.country || 'Unknown',
          timeSpent: '0s',
          timestamp: event.created_at || new Date().toISOString(),
          pageViews: 0,
          uniquePagesSet: new Set<string>(),
          totalClicks: 0,
          uniqueClicksSet: new Set<string>(),
          // CHANGED: Using new maps for breakdown
          rsBreakdownMap: new Map<string, any>(),
          blogBreakdownMap: new Map<string, any>(),
          buttonInteractionsMap: new Map<string, any>(),
        });
      }

      const session = sessionMap.get(sid);
      const eventType = (event.event_type || '').toString().toLowerCase();

      // Page Views
      if (eventType.includes('page') || eventType.includes('view')) {
        session.pageViews++;
        const pageId = event.page_url || event.url || (event.blog_id ? `blog-${event.blog_id}` : null);
        if (pageId) {
          session.uniquePagesSet.add(pageId);
          globalUniquePages.add(pageId);
        }
      }

      // Clicks
      if (eventType.includes('click') || eventType.includes('button')) {
        session.totalClicks++;
        const clickId = event.button_id || event.related_search_id || (event.blog_id ? `blog-${event.blog_id}` : null) || `click-${session.sessionId}-${session.totalClicks}`;
        if (clickId) {
          session.uniqueClicksSet.add(clickId);
          globalUniqueClicks.add(clickId);
        }

        // CHANGED: Detailed click breakdown logic
        const ip = session.ipAddress || 'unknown';
        const buttonId = event.button_id || 'unknown';
        const buttonLabel = event.button_label || 'Unknown';

        let isAssigned = false;

        // 1. Related Search Click (the term itself)
        if (event.related_search_id && buttonId.startsWith('related-search-')) { // Only count clicks on the search term
          const term = relatedSearchMap.get(event.related_search_id) || buttonLabel || 'Unknown Search';
          const entry = session.rsBreakdownMap.get(term) || { term, views: 0, totalClicks: 0, uniqueClicks: new Set(), visitNowClicks: 0, visitNowUnique: new Set() };
          entry.totalClicks++;
          entry.uniqueClicks.add(ip);
          session.rsBreakdownMap.set(term, entry);
          isAssigned = true;
        }

        // 2. "Visit Now" Button Click
        if (buttonId.startsWith('visit-now-')) {
          const term = buttonLabel; // Assuming label is the term
          const entry = session.rsBreakdownMap.get(term) || { term, views: 0, totalClicks: 0, uniqueClicks: new Set(), visitNowClicks: 0, visitNowUnique: new Set() };
          entry.visitNowClicks++;
          entry.visitNowUnique.add(ip);
          session.rsBreakdownMap.set(term, entry);
          isAssigned = true;
        }
        
        // 3. Blog Card Click
        if (event.blog_id && buttonId.startsWith('blog-card-')) { // Only count clicks on the blog card
           const title = blogMap.get(event.blog_id) || buttonLabel || 'Unknown Blog';
           const entry = session.blogBreakdownMap.get(title) || { title, totalClicks: 0, uniqueClicks: new Set() };
           entry.totalClicks++;
           entry.uniqueClicks.add(ip);
           session.blogBreakdownMap.set(title, entry);
           isAssigned = true;
        }
        
        // 4. Other Button Click (if not assigned to RS or Blog)
        if (!isAssigned && !buttonId.startsWith('related-search-')) { // Avoid double-counting
            const key = buttonLabel === 'Unknown' ? (buttonId || 'Unknown-button') : buttonLabel;
            if(key !== 'Unknown-button') { // Don't log "Unknown-button"
              const entry = session.buttonInteractionsMap.get(key) || { button: key, total: 0, unique: new Set() };
              entry.total++;
              entry.unique.add(ip);
              session.buttonInteractionsMap.set(key, entry);
            }
        }
      }
      
      // Track views for RS (if event type is view and has rs_id)
      if ((eventType.includes('view') || eventType.includes('page')) && event.related_search_id) {
          const term = relatedSearchMap.get(event.related_search_id) || event.related_search_label || 'Unknown Search';
          const entry = session.rsBreakdownMap.get(term) || { term, views: 0, totalClicks: 0, uniqueClicks: new Set(), visitNowClicks: 0, visitNowUnique: new Set() };
          entry.views++;
          session.rsBreakdownMap.set(term, entry);
      }

      // Update timestamp if newer
      if (event.created_at && new Date(event.created_at).getTime() > new Date(session.timestamp).getTime()) {
        session.timestamp = event.created_at;
      }
    });

    // Convert per-session maps/sets to arrays + counts
    const sessions = Array.from(sessionMap.values()).map((s: any) => {
      // CHANGED: Convert new maps to arrays
      const finalSearchResults = Array.from(s.rsBreakdownMap.values()).map((sr: any) => ({
        term: sr.term,
        views: sr.views,
        totalClicks: sr.totalClicks,
        uniqueClicks: sr.uniqueClicks.size,
        visitNowClicks: sr.visitNowClicks,
        visitNowUnique: sr.visitNowUnique.size,
      }));

      const finalBlogClicks = Array.from(s.blogBreakdownMap.values()).map((bc: any) => ({
        title: bc.title,
        totalClicks: bc.totalClicks,
        uniqueClicks: bc.uniqueClicks.size,
      }));

      const finalButtonInteractions = Array.from(s.buttonInteractionsMap.values()).map((bi: any) => ({
        button: bi.button,
        total: bi.total,
        unique: bi.unique.size,
      }));

      return {
        sessionId: s.sessionId,
        siteName: 'DataOrbitZone',
        siteIcon: ShoppingCart,
        siteColor: 'from-orange-500 to-orange-600',
        device: s.device,
        ipAddress: s.ipAddress,
        country: s.country,
        timeSpent: s.timeSpent,
        timestamp: s.timestamp,
        pageViews: s.pageViews,
        uniquePages: s.uniquePagesSet.size,
        totalClicks: s.totalClicks,
        uniqueClicks: s.uniqueClicksSet.size,
        searchResults: finalSearchResults,
        blogClicks: finalBlogClicks,
        buttonInteractions: finalButtonInteractions,
      };
    }) as SessionDetail[];

    const stats = {
      sessions: sessionMap.size,
      pageViews: sessions.reduce((sum: number, s: any) => sum + s.pageViews, 0),
      uniquePages: globalUniquePages.size,
      totalClicks: sessions.reduce((sum: number, s: any) => sum + s.totalClicks, 0),
      uniqueClicks: globalUniqueClicks.size,
    };

    return { stats, sessions };
  };

  /**
   * Fetch & process SearchProject analytics.
   * - Adds empty/zeroed fields to match the new SessionDetail interface.
   */
  const fetchSearchProject = async () => {
    const { data: analytics } = await searchProjectClient
      .from('analytics')
      .select('*')
      .order('timestamp', { ascending: false });

    const sessions: SessionDetail[] = (analytics || []).map((a: any) => ({
      sessionId: a.session_id || `sp-${a.id || Math.random().toString(36).slice(2, 9)}`,
      siteName: 'SearchProject',
      siteIcon: Home,
      siteColor: 'from-pink-500 to-pink-600',
      device: a.device || 'Mobile • Safari',
      ipAddress: a.ip_address || 'N/A',
      country: a.country || 'Unknown',
      timeSpent: formatTimeSpent(a.time_spent || 0),
      timestamp: a.timestamp || a.created_at || new Date().toISOString(),
      pageViews: a.page_views || 0,
      uniquePages: a.unique_pages || (a.page_urls ? new Set(a.page_urls).size : (a.unique_pages_count || 0)),
      totalClicks: a.clicks || 0,
      uniqueClicks: a.unique_clicks || (a.button_ids ? new Set(a.button_ids).size : (a.unique_clicks_count || 0)),
      searchResults: Array.isArray(a.search_results) ? a.search_results.map((sr: any) => ({
        term: sr.term,
        views: sr.views || 0,
        totalClicks: sr.totalClicks || 0,
        uniqueClicks: sr.uniqueClicks || 0,
        visitNowClicks: 0,
        visitNowUnique: 0,
      })) : [{
        term: 'results',
        views: a.related_searches || 0,
        totalClicks: a.result_clicks || 0,
        uniqueClicks: a.unique_clicks || 0,
        visitNowClicks: 0,
        visitNowUnique: 0,
      }],
      blogClicks: [],
      buttonInteractions: Array.isArray(a.button_interactions) ? a.button_interactions.map((bi: any) => ({
        button: bi.button,
        total: bi.total || 0,
        unique: bi.unique || 0,
      })) : [{ button: 'result-click', total: a.result_clicks || 0, unique: a.unique_result_clicks || 0 }],
    }));

    // build global sets if explicit arrays exist; else fallback sums
    const globalUniquePagesSet = new Set<string>();
    const globalUniqueClicksSet = new Set<string>();
    (analytics || []).forEach((a: any) => {
      if (a.page_urls && Array.isArray(a.page_urls)) a.page_urls.forEach((p: string) => globalUniquePagesSet.add(p));
      if (a.button_ids && Array.isArray(a.button_ids)) a.button_ids.forEach((b: string) => globalUniqueClicksSet.add(b));
    });

    const stats = {
      sessions: (analytics || []).length,
      pageViews: (analytics || []).reduce((sum: number, a: any) => sum + (a.page_views || 0), 0),
      uniquePages: globalUniquePagesSet.size || (sessions.reduce((sum, s) => sum + (s.uniquePages || 0), 0)),
      totalClicks: (analytics || []).reduce((sum: number, a: any) => sum + (a.clicks || 0), 0),
      uniqueClicks: globalUniqueClicksSet.size || (sessions.reduce((sum, s) => sum + (s.uniqueClicks || 0), 0)),
    };

    return { stats, sessions };
  };

  /**
   * Fetch & process main project (TopicMingle) data from Supabase sessions/page_views/clicks tables
   * - Now processes the 'clicks' table to find detailed blog/search/visit-now clicks.
   */
  const fetchMainProject = async () => {
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: pageViews } = await supabase
      .from('page_views')
      .select('*');

    const { data: clicks } = await supabase
      .from('clicks')
      .select('*');

    const sessionMap = new Map<string, any>();
    const globalUniquePages = new Set<string>();
    const globalUniqueClicks = new Set<string>();

    (sessionsData || []).forEach((s: any) => {
      sessionMap.set(s.session_id, {
        sessionId: s.session_id,
        device: s.user_agent?.includes('Mobile') ? 'Mobile • Safari' : 'Desktop • Firefox',
        ipAddress: s.ip_address || 'N/A',
        country: s.country || 'Unknown',
        timeSpent: '0s',
        timestamp: s.created_at || new Date().toISOString(),
        pageViews: 0,
        uniquePagesSet: new Set<string>(),
        totalClicks: 0,
        uniqueClicksSet: new Set<string>(),
        // Added maps to process detailed clicks
        rsBreakdownMap: new Map<string, any>(),
        blogBreakdownMap: new Map<string, any>(),
        buttonInteractionsMap: new Map<string, any>(),
      });
    });

    (pageViews || []).forEach((pv: any) => {
      const session = sessionMap.get(pv.session_id);
      if (session) {
        session.pageViews++;
        const pageKey = pv.page_url || pv.path || `pv-${pv.id}`;
        session.uniquePagesSet.add(pageKey);
        globalUniquePages.add(pageKey);
      }
    });

    // Detailed click processing
    (clicks || []).forEach((c: any) => {
      const session = sessionMap.get(c.session_id);
      if (session) {
        // Count total clicks
        session.totalClicks++;
        const clickKey = c.button_id || c.button_label || `click-${c.id}`;
        session.uniqueClicksSet.add(clickKey);
        globalUniqueClicks.add(clickKey);

        // Sort clicks into breakdowns
        const buttonId = c.button_id || 'unknown';
        const buttonLabel = c.button_label || 'Unknown';
        const ip = session.ipAddress || 'unknown';

        if (buttonId.startsWith('related-search-')) {
          const term = buttonLabel;
          const entry = session.rsBreakdownMap.get(term) || { term, clicks: 0, ips: new Set(), visitNowClicks: 0, visitNowIps: new Set() };
          entry.clicks++;
          entry.ips.add(ip);
          session.rsBreakdownMap.set(term, entry);
        } else if (buttonId.startsWith('visit-now-')) {
          const term = buttonLabel; // Assumes label matches the related search term
          const entry = session.rsBreakdownMap.get(term) || { term, clicks: 0, ips: new Set(), visitNowClicks: 0, visitNowIps: new Set() };
          entry.visitNowClicks++;
          entry.visitNowIps.add(ip);
          session.rsBreakdownMap.set(term, entry);
        } else if (buttonId.startsWith('blog-card-')) {
          const title = buttonLabel;
          const entry = session.blogBreakdownMap.get(title) || { title, clicks: 0, ips: new Set() };
          entry.clicks++;
          entry.ips.add(ip);
          session.blogBreakdownMap.set(title, entry);
        } else {
          // Add to other button interactions
          const key = buttonLabel || buttonId;
          const entry = session.buttonInteractionsMap.get(key) || { button: key, total: 0, uniqueSet: new Set() };
          entry.total++;
          entry.uniqueSet.add(ip);
          session.buttonInteractionsMap.set(key, entry);
        }
      }
    });

    // Convert maps to final arrays for the session object
    const sessions = Array.from(sessionMap.values()).map((s: any) => ({
      sessionId: s.sessionId,
      siteName: 'TopicMingle',
      siteIcon: Palette,
      siteColor: 'from-cyan-500 to-cyan-600',
      device: s.device,
      ipAddress: s.ipAddress,
      country: s.country,
      timeSpent: s.timeSpent,
      timestamp: s.timestamp,
      pageViews: s.pageViews,
      uniquePages: s.uniquePagesSet.size,
      totalClicks: s.totalClicks,
      uniqueClicks: s.uniqueClicksSet.size,
      searchResults: Array.from(s.rsBreakdownMap.values()).map((r: any) => ({
        term: r.term,
        views: 0,
        totalClicks: r.clicks,
        uniqueClicks: r.ips.size,
        visitNowClicks: r.visitNowClicks,
        visitNowUnique: r.visitNowIps.size,
      })),
      blogClicks: Array.from(s.blogBreakdownMap.values()).map((b: any) => ({
        title: b.title,
        totalClicks: b.clicks,
        uniqueClicks: b.ips.size,
      })),
      buttonInteractions: Array.from(s.buttonInteractionsMap.values()).map((bi: any) => ({
        button: bi.button,
        total: bi.total,
        unique: bi.uniqueSet.size,
      })),
    })) as SessionDetail[];

    const stats = {
      sessions: sessionMap.size,
      pageViews: sessions.reduce((sum: number, s: any) => sum + s.pageViews, 0),
      uniquePages: globalUniquePages.size,
      totalClicks: sessions.reduce((sum: number, s: any) => sum + s.totalClicks, 0),
      uniqueClicks: globalUniqueClicks.size,
    };

    return { stats, sessions };
  };

  const formatTimeSpent = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) newSet.delete(sessionId);
      else newSet.add(sessionId);
      return newSet;
    });
  };

  const filteredStats = selectedSite === 'all'
    ? siteStats
    : siteStats.filter(s => s.siteName.toLowerCase() === (sites.find(site => site.id === selectedSite)?.name.toLowerCase()));

  const filteredSessions = selectedSite === 'all'
    ? sessions
    : sessions.filter(s => s.siteName.toLowerCase() === (sites.find(site => site.id === selectedSite)?.name.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Multi-Site Analytics Hub</h1>
          <p className="text-purple-200">Track page views, clicks & button interactions across platforms</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 bg-purple-800/50 border-purple-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={fetchAnalytics} className="bg-purple-600 hover:bg-purple-500">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Site Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedSite === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedSite('all')}
            className={selectedSite === 'all' ? 'bg-white text-purple-900' : 'bg-purple-800/50 border-purple-600 text-white'}
          >
            All Sites
          </Button>
          {sites.map(site => (
            <Button
              key={site.id}
              variant={selectedSite === site.id ? 'default' : 'outline'}
              onClick={() => setSelectedSite(site.id)}
              className={selectedSite === site.id ? 'bg-white text-purple-900' : 'bg-purple-800/50 border-purple-600 text-white'}
            >
              <site.icon className="h-4 w-4 mr-2" />
              {site.name}
            </Button>
          ))}
        </div>

        {/* Site Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {filteredStats.map((stat, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{stat.siteName}</h3>
                    <p className="text-sm text-gray-500">{stat.sessions} sessions</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Page Views</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.pageViews}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Unique Pages</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.uniquePages}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Clicks</p>
                    <p className="text-2xl font-bold text-blue-600">{stat.totalClicks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Unique Clicks</p>
                    <p className="text-2xl font-bold text-purple-600">{stat.uniqueClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session Details */}
        <div className="space-y-4">
          {filteredSessions.map((session, idx) => (
            <Collapsible key={idx} open={expandedSessions.has(session.sessionId)} onOpenChange={() => toggleSession(session.sessionId)}>
              <Card className={`bg-gradient-to-r ${session.siteColor} border-0 shadow-lg overflow-hidden`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <session.siteIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{session.sessionId.substring(0, 8)}...</span>
                          <span className="px-2 py-1 rounded-full bg-white/20 text-white text-xs">{session.siteName}</span>
                          <span className="px-2 py-1 rounded-full bg-white/20 text-white text-xs">{session.country}</span>
                        </div>
                        <p className="text-white/80 text-sm mt-1">
                          {session.device} • {session.ipAddress} • {session.timeSpent} • {new Date(session.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
                        {expandedSessions.has(session.sessionId) ? 'Hide' : 'Details'}
                        {expandedSessions.has(session.sessionId) ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-1">Page Views</p>
                      <p className="text-2xl font-bold text-white">{session.pageViews}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-1">Unique Pages</p>
                      <p className="text-2xl font-bold text-white">{session.uniquePages}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-1">Total Clicks</p>
                      <p className="text-2xl font-bold text-white">{session.totalClicks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-1">Unique Clicks</p>
                      <p className="text-2xl font-bold text-white">{session.uniqueClicks}</p>
                    </div>
                  </div>

                  {/* This is the new detailed breakdown section.
                    It now renders the new data structures.
                  */}
                  <CollapsibleContent className="mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-4">

                      {/* Related Searches Breakdown */}
                      {session.searchResults && session.searchResults.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Search className="h-5 w-5 text-white/80" />
                            <h5 className="text-white font-semibold text-lg">Related Search Clicks</h5>
                          </div>
                          <div className="space-y-2">
                            {session.searchResults.map((sr, srIdx) => (
                              <div key={srIdx} className="bg-white/10 rounded-lg p-3">
                                <div className="flex justify-between items-center text-sm gap-2">
                                  <span className="font-medium text-white flex-1 truncate" title={sr.term}>{sr.term}</span>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                      Total: {sr.totalClicks}
                                    </span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                      Unique: {sr.uniqueClicks}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs gap-2 pl-4 mt-2 border-l-2 border-green-300">
                                  <span className="text-white/80">"Visit Now" Button:</span>
                                  <div className="flex gap-2">
                                    {sr.visitNowClicks > 0 ? (
                                      <>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">
                                          Total: {sr.visitNowClicks}
                                        </span>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                                          Unique: {sr.visitNowUnique}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-gray-600/50 text-white/60 rounded font-semibold">
                                        Not Clicked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blog Clicks Breakdown */}
                      {session.blogClicks && session.blogClicks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-white/80" />
                            <h5 className="text-white font-semibold text-lg">Blog Clicks</h5>
                          </div>
                          <div className="space-y-2">
                            {session.blogClicks.map((bc, bcIdx) => (
                              <div key={bcIdx} className="bg-white/10 rounded-lg p-3">
                                <div className="flex justify-between items-center text-sm gap-2">
                                  <span className="font-medium text-white flex-1 truncate" title={bc.title}>{bc.title}</span>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                      Total: {bc.totalClicks}
                                    </span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                      Unique: {bc.uniqueClicks}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Button Interactions */}
                      {session.buttonInteractions && session.buttonInteractions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MousePointerClick className="h-5 w-5 text-white/80" />
                            <h5 className="text-white font-semibold text-lg">Other Button Interactions</h5>
                          </div>
                          <div className="space-y-2">
                            {session.buttonInteractions.map((bi, biIdx) => (
                              <div key={biIdx} className="bg-white/10 rounded-lg p-3">
                                <div className="flex justify-between items-center text-sm gap-2">
                                  <span className="font-medium text-white flex-1 truncate" title={bi.button}>{bi.button}</span>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                      Total: {bi.total}
                                    </span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                      Unique: {bi.unique}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}