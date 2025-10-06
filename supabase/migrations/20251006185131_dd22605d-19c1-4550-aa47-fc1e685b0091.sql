-- Drop existing types if they exist and recreate
DO $$ BEGIN
  CREATE TYPE public.player_status AS ENUM ('online', 'offline', 'alert', 'maintenance', 'never_accessed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.license_status AS ENUM ('active', 'expired', 'blocked', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_type AS ENUM ('video', 'image');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update app_role to include 'master' if it doesn't exist
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  is_master BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_players INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  status license_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status player_status DEFAULT 'never_accessed',
  ip_address TEXT,
  location TEXT,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  uptime_seconds INTEGER DEFAULT 0,
  connection_losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player_tokens table
CREATE TABLE IF NOT EXISTS public.player_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(player_id)
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,
  public_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  content_type content_type NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create playlist_items table
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_file_id UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  duration_override_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(playlist_id, media_file_id)
);

-- Create player_schedules table
CREATE TABLE IF NOT EXISTS public.player_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player_logs table
CREATE TABLE IF NOT EXISTS public.player_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player_commands table
CREATE TABLE IF NOT EXISTS public.player_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create license_actions table
CREATE TABLE IF NOT EXISTS public.license_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create analytics_daily table
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  uptime_seconds INTEGER DEFAULT 0,
  connection_losses INTEGER DEFAULT 0,
  content_played_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Master users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own license" ON public.licenses;
DROP POLICY IF EXISTS "Master users can view all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Master users can update all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Master users can insert licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Users can insert their own players" ON public.players;
DROP POLICY IF EXISTS "Users can update their own players" ON public.players;
DROP POLICY IF EXISTS "Users can delete their own players" ON public.players;
DROP POLICY IF EXISTS "Users can view their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can insert their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can view their own media" ON public.media_files;
DROP POLICY IF EXISTS "Users can insert their own media" ON public.media_files;
DROP POLICY IF EXISTS "Users can update their own media" ON public.media_files;
DROP POLICY IF EXISTS "Users can delete their own media" ON public.media_files;
DROP POLICY IF EXISTS "Users can view playlist items of their playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can manage playlist items of their playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can view schedules of their players" ON public.player_schedules;
DROP POLICY IF EXISTS "Users can manage schedules of their players" ON public.player_schedules;
DROP POLICY IF EXISTS "Users can view logs of their players" ON public.player_logs;
DROP POLICY IF EXISTS "System can insert player logs" ON public.player_logs;
DROP POLICY IF EXISTS "Users can view commands of their players" ON public.player_commands;
DROP POLICY IF EXISTS "Users can insert commands to their players" ON public.player_commands;
DROP POLICY IF EXISTS "Master users can view all license actions" ON public.license_actions;
DROP POLICY IF EXISTS "System can insert license actions" ON public.license_actions;
DROP POLICY IF EXISTS "Users can view analytics of their players" ON public.analytics_daily;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Master users can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_master = true));

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policies for licenses
CREATE POLICY "Users can view their own license"
  ON public.licenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Master users can view all licenses"
  ON public.licenses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_master = true));

CREATE POLICY "Master users can update all licenses"
  ON public.licenses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_master = true));

CREATE POLICY "Master users can insert licenses"
  ON public.licenses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_master = true));

-- Create RLS policies for players
CREATE POLICY "Users can view their own players"
  ON public.players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players"
  ON public.players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players"
  ON public.players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players"
  ON public.players FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for playlists
CREATE POLICY "Users can view their own playlists"
  ON public.playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for media_files
CREATE POLICY "Users can view their own media"
  ON public.media_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON public.media_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media"
  ON public.media_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON public.media_files FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for playlist_items
CREATE POLICY "Users can view playlist items of their playlists"
  ON public.playlist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage playlist items of their playlists"
  ON public.playlist_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));

-- Create RLS policies for player_schedules
CREATE POLICY "Users can view schedules of their players"
  ON public.player_schedules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.players WHERE id = player_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage schedules of their players"
  ON public.player_schedules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.players WHERE id = player_id AND user_id = auth.uid()));

-- Create RLS policies for player_logs
CREATE POLICY "Users can view logs of their players"
  ON public.player_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.players WHERE id = player_id AND user_id = auth.uid()));

CREATE POLICY "System can insert player logs"
  ON public.player_logs FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for player_commands
CREATE POLICY "Users can view commands of their players"
  ON public.player_commands FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.players WHERE id = player_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert commands to their players"
  ON public.player_commands FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.players WHERE id = player_id AND user_id = auth.uid()));

-- Create RLS policies for license_actions
CREATE POLICY "Master users can view all license actions"
  ON public.license_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_master = true));

CREATE POLICY "System can insert license actions"
  ON public.license_actions FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for analytics_daily
CREATE POLICY "Users can view analytics of their players"
  ON public.analytics_daily FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.players WHERE id = player_id AND user_id = auth.uid()));

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_licenses_updated_at ON public.licenses;
DROP TRIGGER IF EXISTS update_players_updated_at ON public.players;
DROP TRIGGER IF EXISTS update_playlists_updated_at ON public.playlists;
DROP TRIGGER IF EXISTS update_media_files_updated_at ON public.media_files;
DROP TRIGGER IF EXISTS update_player_schedules_updated_at ON public.player_schedules;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS generate_playlist_slug_trigger ON public.playlists;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_schedules_updated_at
  BEFORE UPDATE ON public.player_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, is_master)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    false
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.licenses (user_id, max_players, end_date, status)
  VALUES (
    NEW.id,
    1,
    NOW() + INTERVAL '30 days',
    'active'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate playlist slug
CREATE OR REPLACE FUNCTION public.generate_playlist_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'playlist-' || NEW.code;
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.playlists WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := final_slug;
  NEW.public_url := 'https://fzgkqdhlxolcxqctillo.supabase.co/functions/v1/playlist/' || final_slug;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for playlist slug generation
CREATE TRIGGER generate_playlist_slug_trigger
  BEFORE INSERT OR UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.generate_playlist_slug();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_code ON public.players(code);
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_code ON public.playlists(code);
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_player_logs_player_id ON public.player_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_logs_created_at ON public.player_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_player_commands_player_id ON public.player_commands(player_id);
CREATE INDEX IF NOT EXISTS idx_player_commands_status ON public.player_commands(status);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_player_date ON public.analytics_daily(player_id, date);