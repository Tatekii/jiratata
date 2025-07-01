// Test setup for Vitest
import { vi } from 'vitest'

// Mock environment variables
Object.defineProperty(process, 'env', {
  value: {
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/jiratata-test',
    JWT_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
})

// Global test utilities
// global.vi = vi

// Mock MongoDB connection
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}))

// Mock Mongoose models
vi.mock('@/models', () => ({
  User: {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  },
  Workspace: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
  Member: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    countDocuments: vi.fn(),
    deleteMany: vi.fn(),
  },
  Task: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    countDocuments: vi.fn(),
    deleteMany: vi.fn(),
  },
  Project: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

// Mock server-only package to allow testing
vi.mock('server-only', () => ({}))
