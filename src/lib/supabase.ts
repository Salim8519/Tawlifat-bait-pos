import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqlkvruqrjhazmjldhha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGt2cnVxcmpoYXptamxkaGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NTA3MTEsImV4cCI6MjA0ODEyNjcxMX0.2b8noimKFW66tXBV-Mqf7b5ee8VDi_rJDSwIXQfMAwc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);