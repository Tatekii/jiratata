#!/usr/bin/env ts-node
/**
 * MongoDB 初始化脚本
 * 用于创建数据库、集合和索引
 */

import mongoose from 'mongoose';
import { MONGODB_URI } from '../src/config';

// 导入所有模型以确保索引被创建
import '../src/models';

async function initMongoDB() {
  try {
    console.log('正在连接到 MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 连接成功');

    // 创建所有必要的索引
    console.log('正在创建数据库索引...');
    
    // 用户集合索引
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✓ 用户邮箱唯一索引已创建');

    // 工作区集合索引
    await mongoose.connection.db.collection('workspaces').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('workspaces').createIndex({ inviteCode: 1 }, { unique: true });
    console.log('✓ 工作区索引已创建');

    // 成员集合索引
    await mongoose.connection.db.collection('members').createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
    await mongoose.connection.db.collection('members').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('members').createIndex({ workspaceId: 1 });
    console.log('✓ 成员索引已创建');

    // 项目集合索引
    await mongoose.connection.db.collection('projects').createIndex({ workspaceId: 1 });
    console.log('✓ 项目索引已创建');

    // 任务集合索引
    await mongoose.connection.db.collection('tasks').createIndex({ workspaceId: 1 });
    await mongoose.connection.db.collection('tasks').createIndex({ projectId: 1 });
    await mongoose.connection.db.collection('tasks').createIndex({ projectId: 1, status: 1 });
    await mongoose.connection.db.collection('tasks').createIndex({ assigneeId: 1, status: 1 });
    await mongoose.connection.db.collection('tasks').createIndex({ dueDate: 1 });
    console.log('✓ 任务索引已创建');

    console.log('\n🎉 MongoDB 初始化完成！');
    console.log('\n数据库信息:');
    console.log(`- 数据库名称: ${mongoose.connection.name}`);
    console.log(`- 连接状态: ${mongoose.connection.readyState === 1 ? '已连接' : '未连接'}`);
    
    // 列出所有集合
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`- 集合数量: ${collections.length}`);
    if (collections.length > 0) {
      console.log('- 现有集合:', collections.map(c => c.name).join(', '));
    }

  } catch (error) {
    console.error('MongoDB 初始化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB 连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initMongoDB().catch(console.error);
}

export { initMongoDB };
