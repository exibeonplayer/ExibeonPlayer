-- Excluir a função e trigger existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recriar a função com SECURITY DEFINER para contornar RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Adicionar política para permitir inserções do sistema durante signup
CREATE POLICY "Allow system to create profiles during signup"
ON public.profiles
FOR INSERT
WITH CHECK (true);