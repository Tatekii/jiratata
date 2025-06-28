/**
 * MongoDB版本的任务服务辅助函数
 */
import { Task, ETaskStatus, Member } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// 从models导入查询接口类型
interface TaskQuery {
  workspaceId: string;
  projectId?: string;
  assigneeId?: string;
  status?: ETaskStatus;
  search?: string;
  dueDate?: string;
}

// 任务过滤器类型
interface TaskFilter {
  workspaceId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  status?: ETaskStatus;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
  dueDate?: {
    $gte: Date;
    $lt: Date;
  };
}

// 任务更新数据类型
interface TaskUpdateData {
  name?: string;
  description?: string;
  status?: ETaskStatus;
  dueDate?: Date;
  position?: number;
  assigneeId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
}

// 获取任务列表
export const getTasks = async (query: TaskQuery) => {
  await connectToDatabase();
  
  const filter: TaskFilter = {
    workspaceId: new mongoose.Types.ObjectId(query.workspaceId)
  };
  
  if (query.projectId) {
    filter.projectId = new mongoose.Types.ObjectId(query.projectId);
  }
  
  if (query.assigneeId) {
    filter.assigneeId = new mongoose.Types.ObjectId(query.assigneeId);
  }
  
  if (query.status) {
    filter.status = query.status;
  }
  
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } }
    ];
  }
  
  if (query.dueDate) {
    const date = new Date(query.dueDate);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    filter.dueDate = {
      $gte: date,
      $lt: nextDay
    };
  }
  
  return await Task.find(filter)
    .populate('assigneeId', 'userId role')
    .populate({
      path: 'assigneeId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate('projectId', 'name imageUrl')
    .sort({ position: 1, createdAt: -1 });
};

// 创建任务
export const createTask = async (data: {
  name: string;
  description?: string;
  workspaceId: string;
  projectId: string;
  assigneeId: string;
  status: ETaskStatus;
  dueDate: Date;
}) => {
  await connectToDatabase();
  
  // 获取该状态下任务的最大position
  const lastTask = await Task.findOne({
    projectId: new mongoose.Types.ObjectId(data.projectId),
    status: data.status
  }).sort({ position: -1 });
  
  const position = lastTask ? lastTask.position + 1000 : 1000;
  
  const task = new Task({
    name: data.name,
    description: data.description,
    workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
    projectId: new mongoose.Types.ObjectId(data.projectId),
    assigneeId: new mongoose.Types.ObjectId(data.assigneeId),
    status: data.status,
    dueDate: data.dueDate,
    position
  });
  
  return await task.save();
};

// 获取单个任务
export const getTaskById = async (taskId: string) => {
  await connectToDatabase();
  
  return await Task.findById(taskId)
    .populate('assigneeId', 'userId role')
    .populate({
      path: 'assigneeId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate('projectId', 'name imageUrl');
};

// 更新任务
export const updateTask = async (taskId: string, updates: {
  name?: string;
  description?: string;
  status?: ETaskStatus;
  assigneeId?: string;
  projectId?: string;
  dueDate?: Date;
  position?: number;
}) => {
  await connectToDatabase();
  
  const updateData: TaskUpdateData = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
  if (updates.position !== undefined) updateData.position = updates.position;
  
  if (updates.assigneeId) {
    updateData.assigneeId = new mongoose.Types.ObjectId(updates.assigneeId);
  }
  
  if (updates.projectId) {
    updateData.projectId = new mongoose.Types.ObjectId(updates.projectId);
  }
  
  return await Task.findByIdAndUpdate(
    taskId,
    { $set: updateData },
    { new: true }
  )
    .populate('assigneeId', 'userId role')
    .populate({
      path: 'assigneeId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate('projectId', 'name imageUrl');
};

// 删除任务
export const deleteTask = async (taskId: string) => {
  await connectToDatabase();
  
  return await Task.findByIdAndDelete(taskId);
};

// 批量更新任务位置
export const bulkUpdateTaskPositions = async (updates: Array<{ $id: string; status: ETaskStatus; position: number }>) => {
  await connectToDatabase();
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    for (const update of updates) {
      await Task.findByIdAndUpdate(
        update.$id,
        { 
          $set: { 
            status: update.status, 
            position: update.position 
          } 
        },
        { session }
      );
    }
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 检查用户是否有访问任务的权限
export const checkTaskAccess = async (taskId: string, userId: string): Promise<boolean> => {
  await connectToDatabase();
  
  const task = await Task.findById(taskId);
  if (!task) {
    return false;
  }
  
  const member = await Member.findOne({
    workspaceId: task.workspaceId,
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  return !!member;
};
