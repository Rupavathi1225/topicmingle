import { createClient } from '@supabase/supabase-js';

const DATAORBITZONE_URL = 'https://xajelbbeohalbckziwiq.supabase.co';
const DATAORBITZONE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhamVsYmJlb2hhbGJja3ppd2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDgyODYsImV4cCI6MjA3ODMyNDI4Nn0.ZO1lM4C0h7ptkPHSirzpQT20smkVMh9ao-xEMKYHG2Q';

export const dataOrbitZoneClient = createClient(DATAORBITZONE_URL, DATAORBITZONE_ANON_KEY);
