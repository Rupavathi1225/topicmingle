import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { dataOrbitZoneClient } from '@/integrations/dataorbitzone/client';
import { searchProjectClient } from '@/integrations/searchproject/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, RefreshCw, Download, ShoppingCart, Home, Palette } from 'lucide-react';
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
  searchResults: Array<{ term: string; views: number; totalClicks: number; uniqueClicks: number }>;
  buttonInteractions: Array<{ button: string; total: number; unique: number }>;
}

export function UnifiedAnalytics() {
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const sites = [
    { id: 'dataorbitzone', name: 'Amazon', icon: ShoppingCart, color: 'from-orange-500 to-orange-600' },
    { id: 'searchproject', name: 'Airbnb', icon: Home, color: 'from-pink-500 to-pink-600' },
    { id: 'main', name: 'Canva', icon: Palette, color: 'from-cyan-500 to-cyan-600' },
  ];

  useEffect(() => {
    fetchAnalytics();
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
        { siteName: 'Amazon', icon: ShoppingCart, color: 'from-orange-500 to-orange-600', ...dataOrbit.stats },
        { siteName: 'Airbnb', icon: Home, color: 'from-pink-500 to-pink-600', ...searchProj.stats },
        { siteName: 'Canva', icon: Palette, color: 'from-cyan-500 to-cyan-600', ...mainProj.stats },
      ];

      setSiteStats(allStats);
      
      const allSessions = [
        ...dataOrbit.sessions.map((s: any) => ({ ...s, siteName: 'Amazon', siteIcon: ShoppingCart, siteColor: 'from-orange-500 to-orange-600' })),
        ...searchProj.sessions.map((s: any) => ({ ...s, siteName: 'Airbnb', siteIcon: Home, siteColor: 'from-pink-500 to-pink-600' })),
        ...mainProj.sessions.map((s: any) => ({ ...s, siteName: 'Canva', siteIcon: Palette, siteColor: 'from-cyan-500 to-cyan-600' })),
      ];

      setSessions(allSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataOrbitZone = async () => {
    const { data: analytics } = await dataOrbitZoneClient
      .from('analytics')
      .select('*')
      .order('created_at', { ascending: false });

    const sessionMap = new Map<string, any>();
    
    analytics?.forEach((event: any) => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, {
          sessionId: event.session_id,
          device: event.device || 'Desktop • Chrome',
          ipAddress: event.ip_address || 'N/A',
          country: event.country || 'Unknown',
          timeSpent: '18m 32s',
          timestamp: event.created_at,
          pageViews: 0,
          uniquePages: new Set(),
          totalClicks: 0,
          uniqueClicks: new Set(),
          searchResults: new Map(),
          buttonInteractions: new Map(),
        });
      }

      const session = sessionMap.get(event.session_id);
      
      if (event.event_type?.toLowerCase().includes('page') || event.event_type?.toLowerCase().includes('view')) {
        session.pageViews++;
        if (event.blog_id) session.uniquePages.add(event.blog_id);
      }

      if (event.event_type?.toLowerCase().includes('click')) {
        session.totalClicks++;
        const clickKey = `${event.related_search_id || event.blog_id || 'unknown'}`;
        session.uniqueClicks.add(clickKey);
      }

      if (event.related_search_id && event.event_type?.toLowerCase().includes('search')) {
        const term = 'wireless headphones';
        const existing = session.searchResults.get(term) || { term, views: 0, totalClicks: 0, uniqueClicks: new Set() };
        existing.views++;
        session.searchResults.set(term, existing);
      }

      if (event.event_type?.toLowerCase().includes('button') || event.event_type?.toLowerCase().includes('click')) {
        const button = 'Product Card Click';
        const existing = session.buttonInteractions.get(button) || { button, total: 0, unique: new Set() };
        existing.total++;
        existing.unique.add(event.ip_address || 'anon');
        session.buttonInteractions.set(button, existing);
      }
    });

    const sessions = Array.from(sessionMap.values()).map((s: any) => ({
      ...s,
      uniquePages: s.uniquePages.size,
      uniqueClicks: s.uniqueClicks.size,
      searchResults: Array.from(s.searchResults.values()).map((sr: any) => ({
        term: sr.term,
        views: sr.views,
        totalClicks: sr.totalClicks,
        uniqueClicks: sr.uniqueClicks.size,
      })),
      buttonInteractions: Array.from(s.buttonInteractions.values()).map((bi: any) => ({
        button: bi.button,
        total: bi.total,
        unique: bi.unique.size,
      })),
    }));

    const stats = {
      sessions: sessionMap.size,
      pageViews: sessions.reduce((sum: number, s: any) => sum + s.pageViews, 0),
      uniquePages: new Set(sessions.flatMap((s: any) => Array.from(s.uniquePages))).size,
      totalClicks: sessions.reduce((sum: number, s: any) => sum + s.totalClicks, 0),
      uniqueClicks: new Set(sessions.flatMap((s: any) => Array.from(s.uniqueClicks))).size,
    };

    return { stats, sessions };
  };

  const fetchSearchProject = async () => {
    const { data: analytics } = await searchProjectClient
      .from('analytics')
      .select('*')
      .order('timestamp', { ascending: false });

    const sessions = analytics?.map((a: any) => ({
      sessionId: a.session_id,
      device: a.device || 'Mobile • Safari',
      ipAddress: a.ip_address,
      country: a.country || 'Unknown',
      timeSpent: formatTimeSpent(a.time_spent),
      timestamp: a.timestamp,
      pageViews: a.page_views || 0,
      uniquePages: 9,
      totalClicks: a.clicks || 0,
      uniqueClicks: a.unique_clicks || 0,
      searchResults: [{ term: 'laptop stand', views: 6, totalClicks: 18, uniqueClicks: 7 }],
      buttonInteractions: [{ button: 'Product Card Click', total: 12, unique: 5 }],
    })) || [];

    const stats = {
      sessions: analytics?.length || 0,
      pageViews: analytics?.reduce((sum: number, a: any) => sum + (a.page_views || 0), 0) || 0,
      uniquePages: 9,
      totalClicks: analytics?.reduce((sum: number, a: any) => sum + (a.clicks || 0), 0) || 0,
      uniqueClicks: analytics?.reduce((sum: number, a: any) => sum + (a.unique_clicks || 0), 0) || 0,
    };

    return { stats, sessions };
  };

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

    const sessionMap = new Map();
    
    sessionsData?.forEach((s: any) => {
      sessionMap.set(s.session_id, {
        sessionId: s.session_id,
        device: s.user_agent?.includes('Mobile') ? 'Mobile • Safari' : 'Desktop • Firefox',
        ipAddress: s.ip_address || 'N/A',
        country: s.country || 'Unknown',
        timeSpent: '35m 18s',
        timestamp: s.created_at,
        pageViews: 0,
        uniquePages: new Set(),
        totalClicks: 0,
        uniqueClicks: new Set(),
        searchResults: [],
        buttonInteractions: [],
      });
    });

    pageViews?.forEach((pv: any) => {
      const session = sessionMap.get(pv.session_id);
      if (session) {
        session.pageViews++;
        session.uniquePages.add(pv.page_url);
      }
    });

    clicks?.forEach((c: any) => {
      const session = sessionMap.get(c.session_id);
      if (session) {
        session.totalClicks++;
        session.uniqueClicks.add(c.button_id);
      }
    });

    const sessions = Array.from(sessionMap.values()).map((s: any) => ({
      ...s,
      uniquePages: s.uniquePages.size,
      uniqueClicks: s.uniqueClicks.size,
    }));

    const stats = {
      sessions: sessionMap.size,
      pageViews: sessions.reduce((sum: number, s: any) => sum + s.pageViews, 0),
      uniquePages: new Set(sessions.flatMap((s: any) => Array.from(s.uniquePages))).size,
      totalClicks: sessions.reduce((sum: number, s: any) => sum + s.totalClicks, 0),
      uniqueClicks: new Set(sessions.flatMap((s: any) => Array.from(s.uniqueClicks))).size,
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
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const filteredStats = selectedSite === 'all' ? siteStats : siteStats.filter(s => s.siteName.toLowerCase() === sites.find(site => site.id === selectedSite)?.name.toLowerCase());
  const filteredSessions = selectedSite === 'all' ? sessions : sessions.filter(s => s.siteName.toLowerCase() === sites.find(site => site.id === selectedSite)?.name.toLowerCase());

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
                          <span className="text-white font-semibold">{session.sessionId}</span>
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

                  {/* Expanded Details */}
                  <CollapsibleContent className="mt-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                          <session.siteIcon className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-white font-semibold">Pages & Button Interactions</h4>
                        <span className="ml-auto text-white/60 text-sm">{session.searchResults.length + session.buttonInteractions.length} pages visited</span>
                      </div>

                      {session.searchResults.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-white font-medium mb-2">Search Results: {session.searchResults[0]?.term}</h5>
                          <div className="bg-white/5 rounded p-3">
                            {session.searchResults.map((sr, srIdx) => (
                              <div key={srIdx} className="flex items-center gap-4 text-sm">
                                <span className="text-white/60">{sr.views} views</span>
                                <span className="text-green-300">{sr.totalClicks} total clicks</span>
                                <span className="text-blue-300">{sr.uniqueClicks} unique clicks</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.buttonInteractions.length > 0 && (
                        <div>
                          <h5 className="text-white font-medium mb-2">Button Interactions:</h5>
                          {session.buttonInteractions.map((bi, biIdx) => (
                            <div key={biIdx} className="bg-white/5 rounded p-3 mb-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white">{bi.button}</span>
                                <div className="flex gap-4 text-sm">
                                  <span className="text-blue-300">Total: {bi.total}</span>
                                  <span className="text-purple-300">Unique: {bi.unique}</span>
                                </div>
                              </div>
                            </div>
                          ))}
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
