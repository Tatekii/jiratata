# Task Form 改进总结

## 问题分析

1. **Zod 校验字段不完整**：原始的 schemas 没有包含 `IClientTask` 接口中的所有字段
2. **类型推导问题**：Zod schema 字段与 `IClientTask` 类型定义不同步

## 解决方案

### 1. 重构 Schemas (`src/features/tasks/schemas.ts`)

- **基于 IClientTask 接口创建完整的 Schema**：使用 `satisfies` 操作符确保 schema 字段与 `IClientTask` 类型保持同步
- **改进类型安全**：添加编译时类型检查，确保 schema 包含所有必需字段
- **分离关注点**：创建 `createBaseTaskSchema` 作为基础，然后基于它构建创建和更新的 schemas

#### 新增/修复的字段：
- `position`: 任务位置（系统自动生成）
- `loggedHours`: 已记录工时
- `startDate`: 开始日期
- `status`: 任务状态
- `assigneeId`: 分配人员
- `taskType`: 任务类型
- `parentTaskId`: 父任务ID

### 2. 更新 CreateTaskForm

#### 新增字段：
- **任务状态选择**：允许用户在创建时选择任务状态
- **分配人员选择**：添加 `memberOptions` 参数和对应的表单字段
- **任务类型选择**：移到单独的字段，增加了 SUBTASK 类型

#### 改进：
- 更完整的表单验证
- 更好的用户体验
- 父任务选择功能（基于所选项目的任务列表）

### 3. 更新 EditTaskForm

#### 新增字段：
- **开始日期**：与到期日期并排显示
- **父任务选择**：允许编辑任务的父子关系

#### 修复：
- 解决 Zod schema 类型问题（`ZodEffects` 类型处理）
- 改进表单布局，使用网格布局优化空间利用

### 4. 类型安全改进

- **编译时验证**：使用 TypeScript 的类型系统确保 schema 与接口同步
- **导出类型**：提供 `CreateTaskInput` 和 `UpdateTaskInput` 类型供其他组件使用
- **类型推导**：从 `IClientTask` 接口自动推导 schema 字段

## 接口变更

### CreateTaskFormProps
```typescript
interface CreateTaskFormProps {
	onCancel?: () => void
	projectOptions: Pick<IClientProject, "_id" | "name" | "image">[]
	memberOptions?: { id: string; name: string }[] // 新增
}
```

### EditTaskFormProps  
```typescript
interface EditTaskFormProps {
	onCancel?: () => void
	projectOptions: { id: string; name: string; image?: string }[]
	memberOptions: { id: string; name: string }[]
	initialValues: IClientTask
	availableTasks?: { id: string; name: string }[] // 新增
}
```

## 使用方式

### 创建任务表单
```typescript
<CreateTaskForm 
	projectOptions={projects}
	memberOptions={members} // 需要传入成员列表
	onCancel={handleCancel}
/>
```

### 编辑任务表单
```typescript
<EditTaskForm 
	projectOptions={projects}
	memberOptions={members}
	availableTasks={availableTasks} // 可选择的父任务
	initialValues={task}
	onCancel={handleCancel}
/>
```

## 优势

1. **完整性**：现在表单包含了 `IClientTask` 接口的所有字段
2. **类型安全**：编译时验证确保字段同步
3. **可维护性**：当 `IClientTask` 接口变更时，TypeScript 会提示相应的 schema 更新
4. **用户体验**：更丰富的字段选择和更好的表单布局
5. **扩展性**：基础 schema 可以轻松扩展为其他用途

## 注意事项

- 需要确保调用组件传入正确的 `memberOptions` 和 `availableTasks` 数据
- 父任务选择功能需要后端 API 支持过滤逻辑，避免循环引用
- 建议在父组件中添加数据加载状态和错误处理
