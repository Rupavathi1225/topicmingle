import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Get or create session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Get source from URL parameters
const getSource = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('source') || urlParams.get('utm_source') || 'direct';
};

// Get comprehensive client info including country
const getClientInfo = async () => {
  try {
    // Use ipapi.co for country detection (free tier: 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      ip: data.ip || 'unknown',
      country: data.country_code || 'WW',
      userAgent: navigator.userAgent,
      source: getSource()
    };
  } catch (error) {
    // Fallback to basic IP detection
    try {
      const fallbackResponse = await fetch('https://api.ipify.org?format=json');
      const fallbackData = await fallbackResponse.json();
      return {
        ip: fallbackData.ip,
        country: 'WW',
        userAgent: navigator.userAgent,
        source: getSource()
      };
    } catch {
      return {
        ip: 'unknown',
        country: 'WW',
        userAgent: navigator.userAgent,
        source: getSource()
      };
    }
  }
};

export const useTracking = () => {
  const sessionId = getSessionId();

  // Initialize or update session
  useEffect(() => {
    const initSession = async () => {
      const { ip, country, userAgent, source } = await getClientInfo();
      
      await supabase
        .from('sessions')
        .upsert({
          session_id: sessionId,
          ip_address: ip,
          country: country,
          source: source,
          user_agent: userAgent,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        });
    };

    initSession();
  }, [sessionId]);

  // Track page view
  const trackPageView = useCallback(async (pageUrl: string, blogId?: string) => {
    const { country, source } = await getClientInfo();
    await supabase
      .from('page_views')
      .insert({
        session_id: sessionId,
        page_url: pageUrl,
        blog_id: blogId || null,
        country: country,
        source: source
      });
  }, [sessionId]);

  // Track click
  const trackClick = useCallback(async (buttonId: string, buttonLabel: string) => {
    const { country, source } = await getClientInfo();
    await supabase
      .from('clicks')
      .insert({
        session_id: sessionId,
        button_id: buttonId,
        button_label: buttonLabel,
        page_url: window.location.href,
        country: country,
        source: source
      });
  }, [sessionId]);

  return {
    sessionId,
    trackPageView,
    trackClick
  };
};