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

// Get IP address (client-side approximation)
const getClientInfo = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return {
      ip: data.ip,
      userAgent: navigator.userAgent
    };
  } catch (error) {
    return {
      ip: 'unknown',
      userAgent: navigator.userAgent
    };
  }
};

export const useTracking = () => {
  const sessionId = getSessionId();

  // Initialize or update session
  useEffect(() => {
    const initSession = async () => {
      const { ip, userAgent } = await getClientInfo();
      
      await supabase
        .from('sessions')
        .upsert({
          session_id: sessionId,
          ip_address: ip,
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
    await supabase
      .from('page_views')
      .insert({
        session_id: sessionId,
        page_url: pageUrl,
        blog_id: blogId || null
      });
  }, [sessionId]);

  // Track click
  const trackClick = useCallback(async (buttonId: string, buttonLabel: string) => {
    await supabase
      .from('clicks')
      .insert({
        session_id: sessionId,
        button_id: buttonId,
        button_label: buttonLabel,
        page_url: window.location.href
      });
  }, [sessionId]);

  return {
    sessionId,
    trackPageView,
    trackClick
  };
};