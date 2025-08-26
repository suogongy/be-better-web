-- 修复用户资料迁移脚本
-- 为现有的 auth.users 创建对应的 public.users 记录

-- 1. 重新创建用户注册触发器（不依赖外键约束）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 为现有的认证用户创建用户资料
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, public.users.name),
  updated_at = NOW();

-- 4. 验证结果
-- 检查用户数量是否匹配
DO $$
DECLARE
  auth_count INTEGER;
  public_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO public_count FROM public.users;
  
  RAISE NOTICE 'Auth users count: %, Public users count: %', auth_count, public_count;
  
  IF auth_count = public_count THEN
    RAISE NOTICE '✅ User migration completed successfully!';
  ELSE
    RAISE WARNING '⚠️ User counts do not match. Please check the migration.';
  END IF;
END $$;