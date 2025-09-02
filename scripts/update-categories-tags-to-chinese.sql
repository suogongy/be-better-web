-- 更新分类和标签为中文的SQL脚本
-- 执行前请备份数据库

-- 1. 更新分类表 (categories)
-- 将常见的英文分类名称更新为中文

UPDATE public.categories 
SET name = '技术',
    description = '技术相关文章，包括编程、开发、架构等'
WHERE name ILIKE '%tech%' OR name ILIKE '%technology%';

UPDATE public.categories 
SET name = '生活',
    description = '日常生活、个人感悟、经验分享等'
WHERE name ILIKE '%life%' OR name ILIKE '%lifestyle%';

UPDATE public.categories 
SET name = '工作',
    description = '工作相关、职业发展、职场经验等'
WHERE name ILIKE '%work%' OR name ILIKE '%career%' OR name ILIKE '%job%';

UPDATE public.categories 
SET name = '学习',
    description = '学习笔记、知识分享、教育相关等'
WHERE name ILIKE '%learn%' OR name ILIKE '%study%' OR name ILIKE '%education%';

UPDATE public.categories 
SET name = '健康',
    description = '健康生活、运动健身、心理健康等'
WHERE name ILIKE '%health%' OR name ILIKE '%fitness%' OR name ILIKE '%wellness%';

UPDATE public.categories 
SET name = '旅行',
    description = '旅行游记、景点介绍、旅行攻略等'
WHERE name ILIKE '%travel%' OR name ILIKE '%trip%' OR name ILIKE '%journey%';

UPDATE public.categories 
SET name = '美食',
    description = '美食分享、烹饪技巧、餐厅推荐等'
WHERE name ILIKE '%food%' OR name ILIKE '%cooking%' OR name ILIKE '%recipe%';

UPDATE public.categories 
SET name = '阅读',
    description = '读书笔记、书评、阅读心得等'
WHERE name ILIKE '%book%' OR name ILIKE '%reading%' OR name ILIKE '%review%';

UPDATE public.categories 
SET name = '音乐',
    description = '音乐分享、乐评、音乐创作等'
WHERE name ILIKE '%music%' OR name ILIKE '%song%' OR name ILIKE '%album%';

UPDATE public.categories 
SET name = '电影',
    description = '电影评论、观影感受、影视资讯等'
WHERE name ILIKE '%movie%' OR name ILIKE '%film%' OR name ILIKE '%cinema%';

UPDATE public.categories 
SET name = '设计',
    description = '设计作品、设计理念、创意分享等'
WHERE name ILIKE '%design%' OR name ILIKE '%creative%' OR name ILIKE '%art%';

UPDATE public.categories 
SET name = '商业',
    description = '商业分析、创业经验、市场洞察等'
WHERE name ILIKE '%business%' OR name ILIKE '%startup%' OR name ILIKE '%entrepreneur%';

UPDATE public.categories 
SET name = '科学',
    description = '科学发现、科普知识、研究进展等'
WHERE name ILIKE '%science%' OR name ILIKE '%research%' OR name ILIKE '%discovery%';

UPDATE public.categories 
SET name = '历史',
    description = '历史故事、历史人物、历史事件等'
WHERE name ILIKE '%history%' OR name ILIKE '%historical%';

UPDATE public.categories 
SET name = '哲学',
    description = '哲学思考、人生感悟、思想探讨等'
WHERE name ILIKE '%philosophy%' OR name ILIKE '%thinking%' OR name ILIKE '%thought%';

-- 2. 更新标签表 (tags)
-- 将常见的英文标签更新为中文

UPDATE public.tags 
SET name = 'JavaScript'
WHERE name ILIKE '%javascript%' OR name ILIKE '%js%';

UPDATE public.tags 
SET name = 'Python'
WHERE name ILIKE '%python%';

UPDATE public.tags 
SET name = 'React'
WHERE name ILIKE '%react%';

UPDATE public.tags 
SET name = 'Vue'
WHERE name ILIKE '%vue%';

UPDATE public.tags 
SET name = 'Node.js'
WHERE name ILIKE '%node%' OR name ILIKE '%nodejs%';

UPDATE public.tags 
SET name = '数据库'
WHERE name ILIKE '%database%' OR name ILIKE '%db%';

UPDATE public.tags 
SET name = 'API'
WHERE name ILIKE '%api%';

UPDATE public.tags 
SET name = '前端'
WHERE name ILIKE '%frontend%' OR name ILIKE '%front-end%';

UPDATE public.tags 
SET name = '后端'
WHERE name ILIKE '%backend%' OR name ILIKE '%back-end%';

UPDATE public.tags 
SET name = '全栈'
WHERE name ILIKE '%fullstack%' OR name ILIKE '%full-stack%';

UPDATE public.tags 
SET name = '移动开发'
WHERE name ILIKE '%mobile%' OR name ILIKE '%app%';

UPDATE public.tags 
SET name = '云服务'
WHERE name ILIKE '%cloud%' OR name ILIKE '%aws%' OR name ILIKE '%azure%';

UPDATE public.tags 
SET name = '人工智能'
WHERE name ILIKE '%ai%' OR name ILIKE '%artificial%' OR name ILIKE '%intelligence%';

UPDATE public.tags 
SET name = '机器学习'
WHERE name ILIKE '%ml%' OR name ILIKE '%machine%' OR name ILIKE '%learning%';

UPDATE public.tags 
SET name = '深度学习'
WHERE name ILIKE '%deep%' OR name ILIKE '%deeplearning%';

UPDATE public.tags 
SET name = '数据科学'
WHERE name ILIKE '%data%' OR name ILIKE '%analytics%';

UPDATE public.tags 
SET name = '区块链'
WHERE name ILIKE '%blockchain%' OR name ILIKE '%crypto%';

UPDATE public.tags 
SET name = '物联网'
WHERE name ILIKE '%iot%' OR name ILIKE '%internet%';

UPDATE public.tags 
SET name = '微服务'
WHERE name ILIKE '%microservice%' OR name ILIKE '%micro-service%';

UPDATE public.tags 
SET name = '容器化'
WHERE name ILIKE '%docker%' OR name ILIKE '%kubernetes%' OR name ILIKE '%container%';

UPDATE public.tags 
SET name = 'DevOps'
WHERE name ILIKE '%devops%';

UPDATE public.tags 
SET name = '测试'
WHERE name ILIKE '%test%' OR name ILIKE '%testing%';

UPDATE public.tags 
SET name = '性能优化'
WHERE name ILIKE '%performance%' OR name ILIKE '%optimization%';

UPDATE public.tags 
SET name = '安全'
WHERE name ILIKE '%security%' OR name ILIKE '%secure%';

UPDATE public.tags 
SET name = '用户体验'
WHERE name ILIKE '%ux%' OR name ILIKE '%user%' OR name ILIKE '%experience%';

UPDATE public.tags 
SET name = '产品设计'
WHERE name ILIKE '%product%' OR name ILIKE '%design%';

UPDATE public.tags 
SET name = '项目管理'
WHERE name ILIKE '%project%' OR name ILIKE '%management%';

UPDATE public.tags 
SET name = '团队协作'
WHERE name ILIKE '%team%' OR name ILIKE '%collaboration%';

UPDATE public.tags 
SET name = '时间管理'
WHERE name ILIKE '%time%' OR name ILIKE '%management%';

UPDATE public.tags 
SET name = '效率提升'
WHERE name ILIKE '%productivity%' OR name ILIKE '%efficiency%';

UPDATE public.tags 
SET name = '目标设定'
WHERE name ILIKE '%goal%' OR name ILIKE '%target%';

UPDATE public.tags 
SET name = '习惯养成'
WHERE name ILIKE '%habit%' OR name ILIKE '%routine%';

UPDATE public.tags 
SET name = '心理健康'
WHERE name ILIKE '%mental%' OR name ILIKE '%psychology%';

UPDATE public.tags 
SET name = '运动健身'
WHERE name ILIKE '%fitness%' OR name ILIKE '%exercise%' OR name ILIKE '%workout%';

UPDATE public.tags 
SET name = '营养健康'
WHERE name ILIKE '%nutrition%' OR name ILIKE '%diet%' OR name ILIKE '%health%';

UPDATE public.tags 
SET name = '睡眠质量'
WHERE name ILIKE '%sleep%' OR name ILIKE '%rest%';

UPDATE public.tags 
SET name = '压力管理'
WHERE name ILIKE '%stress%' OR name ILIKE '%anxiety%';

UPDATE public.tags 
SET name = '冥想'
WHERE name ILIKE '%meditation%' OR name ILIKE '%mindfulness%';

UPDATE public.tags 
SET name = '瑜伽'
WHERE name ILIKE '%yoga%';

UPDATE public.tags 
SET name = '跑步'
WHERE name ILIKE '%running%' OR name ILIKE '%jogging%';

UPDATE public.tags 
SET name = '骑行'
WHERE name ILIKE '%cycling%' OR name ILIKE '%bike%';

UPDATE public.tags 
SET name = '游泳'
WHERE name ILIKE '%swimming%';

UPDATE public.tags 
SET name = '徒步'
WHERE name ILIKE '%hiking%' OR name ILIKE '%trekking%';

UPDATE public.tags 
SET name = '摄影'
WHERE name ILIKE '%photography%' OR name ILIKE '%photo%';

UPDATE public.tags 
SET name = '绘画'
WHERE name ILIKE '%painting%' OR name ILIKE '%drawing%' OR name ILIKE '%art%';

UPDATE public.tags 
SET name = '写作'
WHERE name ILIKE '%writing%' OR name ILIKE '%blog%';

UPDATE public.tags 
SET name = '演讲'
WHERE name ILIKE '%speech%' OR name ILIKE '%presentation%';

UPDATE public.tags 
SET name = '沟通技巧'
WHERE name ILIKE '%communication%' OR name ILIKE '%speaking%';

UPDATE public.tags 
SET name = '领导力'
WHERE name ILIKE '%leadership%' OR name ILIKE '%leader%';

UPDATE public.tags 
SET name = '创新思维'
WHERE name ILIKE '%innovation%' OR name ILIKE '%creative%';

UPDATE public.tags 
SET name = '问题解决'
WHERE name ILIKE '%problem%' OR name ILIKE '%solution%';

UPDATE public.tags 
SET name = '决策制定'
WHERE name ILIKE '%decision%' OR name ILIKE '%choice%';

UPDATE public.tags 
SET name = '财务管理'
WHERE name ILIKE '%finance%' OR name ILIKE '%money%' OR name ILIKE '%investment%';

UPDATE public.tags 
SET name = '投资理财'
WHERE name ILIKE '%investment%' OR name ILIKE '%trading%' OR name ILIKE '%stock%';

UPDATE public.tags 
SET name = '创业'
WHERE name ILIKE '%startup%' OR name ILIKE '%entrepreneur%';

UPDATE public.tags 
SET name = '市场营销'
WHERE name ILIKE '%marketing%' OR name ILIKE '%advertising%';

UPDATE public.tags 
SET name = '品牌建设'
WHERE name ILIKE '%brand%' OR name ILIKE '%branding%';

UPDATE public.tags 
SET name = '客户服务'
WHERE name ILIKE '%customer%' OR name ILIKE '%service%';

UPDATE public.tags 
SET name = '数据分析'
WHERE name ILIKE '%analytics%' OR name ILIKE '%data%';

UPDATE public.tags 
SET name = '商业策略'
WHERE name ILIKE '%strategy%' OR name ILIKE '%business%';

UPDATE public.tags 
SET name = '竞争分析'
WHERE name ILIKE '%competition%' OR name ILIKE '%competitive%';

UPDATE public.tags 
SET name = '风险管理'
WHERE name ILIKE '%risk%' OR name ILIKE '%management%';

-- 3. 插入一些常用的中文分类（如果不存在的话）
INSERT INTO public.categories (name, description, color) 
SELECT '技术', '技术相关文章，包括编程、开发、架构等', '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = '技术');

INSERT INTO public.categories (name, description, color) 
SELECT '生活', '日常生活、个人感悟、经验分享等', '#10B981'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = '生活');

INSERT INTO public.categories (name, description, color) 
SELECT '工作', '工作相关、职业发展、职场经验等', '#F59E0B'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = '工作');

INSERT INTO public.categories (name, description, color) 
SELECT '学习', '学习笔记、知识分享、教育相关等', '#8B5CF6'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = '学习');

INSERT INTO public.categories (name, description, color) 
SELECT '健康', '健康生活、运动健身、心理健康等', '#EF4444'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = '健康');

-- 4. 插入一些常用的中文标签（如果不存在的话）
INSERT INTO public.tags (name) 
SELECT 'JavaScript'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'JavaScript');

INSERT INTO public.tags (name) 
SELECT 'Python'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Python');

INSERT INTO public.tags (name) 
SELECT 'React'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'React');

INSERT INTO public.tags (name) 
SELECT 'Vue'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Vue');

INSERT INTO public.tags (name) 
SELECT 'Node.js'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Node.js');

INSERT INTO public.tags (name) 
SELECT '数据库'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = '数据库');

INSERT INTO public.tags (name) 
SELECT '前端'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = '前端');

INSERT INTO public.tags (name) 
SELECT '后端'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = '后端');

INSERT INTO public.tags (name) 
SELECT '全栈'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = '全栈');

INSERT INTO public.tags (name) 
SELECT '人工智能'
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = '人工智能');

-- 5. 显示更新结果
SELECT 'Categories updated:' as info;
SELECT name, description FROM public.categories ORDER BY name;

SELECT 'Tags updated:' as info;
SELECT name FROM public.tags ORDER BY name;
