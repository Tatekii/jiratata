/**
 * 类型转换适配器
 * 处理MongoDB文档与前端类型间的转换
 */
import { Document } from 'mongoose';

// 将MongoDB文档转换为前端兼容格式
export function mongoToFrontendDoc(doc: Document): Record<string, unknown> {
  const plain = doc.toObject();
  return {
    ...plain,
    $id: plain._id?.toString() || '',
    $createdAt: plain.createdAt?.toISOString() || '',
    $updatedAt: plain.updatedAt?.toISOString() || '',
    _id: plain._id?.toString() || '',
  };
}

// 批量转换MongoDB文档
export function mongoToFrontendDocs(docs: Document[]): Record<string, unknown>[] {
  return docs.map(mongoToFrontendDoc);
}

// 移除前端专用字段，准备发送到MongoDB
export function frontendToMongoData<T extends Record<string, unknown>>(data: T): Omit<T, '$id' | '$createdAt' | '$updatedAt'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $id, $createdAt, $updatedAt, ...mongoData } = data;
  return mongoData;
}
