-- 更新分类为中文的SQL脚本
-- 根据提供的数据，将指定的分类条目更新为中文

-- 更新 Personal 分类为 个人
UPDATE public.categories 
SET name = '个人',
    description = '个人想法、经历和反思'
WHERE id = 'ea9cbd4e-19c0-4e91-9e70-e2751d1dc2b6';

-- 更新 Productivity 分类为 效率
UPDATE public.categories 
SET name = '效率',
    description = '关于效率和时间管理的技巧与见解'
WHERE id = '5156748f-a2b6-4d42-8536-f5049be7fb03';

-- 更新 Schedule 分类为 日程
UPDATE public.categories 
SET name = '日程',
    description = '从每日日程和总结中生成的文章'
WHERE id = '39dfc66e-a748-461d-9fa9-45aa096a73c4';

-- 验证更新结果
SELECT id, name, description, color, created_at 
FROM public.categories 
WHERE id IN (
    'ea9cbd4e-19c0-4e91-9e70-e2751d1dc2b6',
    '5156748f-a2b6-4d42-8536-f5049be7fb03',
    '39dfc66e-a748-461d-9fa9-45aa096a73c4'
);