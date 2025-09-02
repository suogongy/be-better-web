# 博客管理中文化脚本

本目录包含了将博客管理系统的分类和标签从英文更新为中文的SQL脚本。

## 文件说明

### `update-categories-tags-to-chinese.sql`
主要的SQL脚本，用于：
1. 将现有的英文分类名称更新为中文
2. 将现有的英文标签名称更新为中文
3. 插入常用的中文分类和标签（如果不存在）

## 使用方法

### 1. 备份数据库
在执行脚本前，请务必备份您的数据库：
```bash
# 使用pg_dump备份PostgreSQL数据库
pg_dump -h localhost -U username -d database_name > backup_before_chinese_update.sql
```

### 2. 执行SQL脚本
```bash
# 连接到数据库并执行脚本
psql -h localhost -U username -d database_name -f update-categories-tags-to-chinese.sql
```

或者在您的数据库管理工具中直接执行脚本内容。

### 3. 验证结果
脚本执行完成后，会显示更新后的分类和标签列表。

## 更新内容

### 分类更新
- `tech/technology` → `技术`
- `life/lifestyle` → `生活`
- `work/career/job` → `工作`
- `learn/study/education` → `学习`
- `health/fitness/wellness` → `健康`
- `travel/trip/journey` → `旅行`
- `food/cooking/recipe` → `美食`
- `book/reading/review` → `阅读`
- `music/song/album` → `音乐`
- `movie/film/cinema` → `电影`
- `design/creative/art` → `设计`
- `business/startup/entrepreneur` → `商业`
- `science/research/discovery` → `科学`
- `history/historical` → `历史`
- `philosophy/thinking/thought` → `哲学`

### 标签更新
- 技术类：`JavaScript`, `Python`, `React`, `Vue`, `Node.js`, `数据库`, `API`, `前端`, `后端`, `全栈`
- 开发类：`移动开发`, `云服务`, `人工智能`, `机器学习`, `深度学习`, `数据科学`
- 新兴技术：`区块链`, `物联网`, `微服务`, `容器化`, `DevOps`
- 开发实践：`测试`, `性能优化`, `安全`, `用户体验`, `产品设计`
- 管理类：`项目管理`, `团队协作`, `时间管理`, `效率提升`
- 个人发展：`目标设定`, `习惯养成`, `心理健康`, `运动健身`
- 生活类：`营养健康`, `睡眠质量`, `压力管理`, `冥想`, `瑜伽`
- 运动类：`跑步`, `骑行`, `游泳`, `徒步`
- 艺术类：`摄影`, `绘画`, `写作`, `演讲`
- 商业类：`沟通技巧`, `领导力`, `创新思维`, `问题解决`, `决策制定`
- 财务类：`财务管理`, `投资理财`, `创业`, `市场营销`, `品牌建设`

## 注意事项

1. **备份重要**：执行前请务必备份数据库
2. **测试环境**：建议先在测试环境中执行
3. **数据一致性**：更新分类和标签后，相关的文章关联关系会保持不变
4. **回滚方案**：如果出现问题，可以使用备份文件恢复

## 故障排除

### 常见问题
1. **权限不足**：确保数据库用户有UPDATE和INSERT权限
2. **外键约束**：如果存在外键约束，可能需要先处理关联数据
3. **字符编码**：确保数据库支持中文字符

### 回滚操作
如果更新后出现问题，可以使用备份文件恢复：
```bash
psql -h localhost -U username -d database_name < backup_before_chinese_update.sql
```

## 联系支持

如果在执行过程中遇到问题，请检查：
1. 数据库连接是否正常
2. 用户权限是否足够
3. 数据库版本是否兼容

---

**重要提醒**：在生产环境中执行前，请务必在测试环境中验证脚本的正确性。
