/**
 * 路由工具函数 - 统一管理应用内的路由构建和匹配逻辑
 */

// 路由模板定义 - 用于内部匹配，不直接用于Link组件
const ROUTE_TEMPLATES = {
  WORKSPACE: '/workspaces/[workspaceId]',
  WORKSPACE_TASKS: '/workspaces/[workspaceId]/tasks',
  WORKSPACE_PROJECTS: '/workspaces/[workspaceId]/projects',
  WORKSPACE_MEMBERS: '/workspaces/[workspaceId]/members',
  WORKSPACE_SETTINGS: '/workspaces/[workspaceId]/settings',
  PROJECT: '/workspaces/[workspaceId]/projects/[projectId]',
  PROJECT_SETTINGS: '/workspaces/[workspaceId]/projects/[projectId]/settings',
  TASK: '/workspaces/[workspaceId]/tasks/[taskId]',
} as const

type RouteParams = {
  workspaceId?: string
  projectId?: string
  taskId?: string
}

/**
 * 构建路由URL - 确保所有参数都被正确替换
 * @param template 路由模板
 * @param params 参数对象
 * @returns 构建好的URL
 */
export function buildRoute(template: string, params: RouteParams): string {
  let route = template
  
  if (params.workspaceId) {
    route = route.replace('[workspaceId]', params.workspaceId)
  }
  
  if (params.projectId) {
    route = route.replace('[projectId]', params.projectId)
  }
  
  if (params.taskId) {
    route = route.replace('[taskId]', params.taskId)
  }
  
  // 确保没有未替换的参数
  if (route.includes('[') || route.includes(']')) {
    console.warn(`Route template "${template}" has unresolved parameters:`, route)
  }
  
  return route
}

/**
 * 检查当前路径是否匹配指定的路由模式
 * @param pathname 当前路径
 * @param template 路由模板
 * @param params 参数对象
 * @param exact 是否精确匹配，默认true
 * @returns 是否匹配
 */
export function isRouteActive(
  pathname: string, 
  template: string, 
  params: RouteParams, 
  exact: boolean = true
): boolean {
  const builtRoute = buildRoute(template, params)
  
  if (exact) {
    return pathname === builtRoute
  }
  
  // 支持前缀匹配，用于多语言路由
  return pathname.endsWith(builtRoute)
}

/**
 * 项目相关的路由工具
 */
export const projectRoutes = {
  /**
   * 构建项目详情页路由
   */
  detail: (workspaceId: string, projectId: string) => 
    buildRoute(ROUTE_TEMPLATES.PROJECT, { workspaceId, projectId }),
    
  /**
   * 构建项目设置页路由
   */
  settings: (workspaceId: string, projectId: string) => 
    buildRoute(ROUTE_TEMPLATES.PROJECT_SETTINGS, { workspaceId, projectId }),
    
  /**
   * 检查是否在项目相关页面
   */
  isActive: (pathname: string, workspaceId: string, projectId: string, exact: boolean = true) => 
    isRouteActive(pathname, ROUTE_TEMPLATES.PROJECT, { workspaceId, projectId }, exact),
}

/**
 * 任务相关的路由工具
 */
export const taskRoutes = {
  /**
   * 构建任务详情页路由
   */
  detail: (workspaceId: string, taskId: string) => 
    buildRoute(ROUTE_TEMPLATES.TASK, { workspaceId, taskId }),
    
  /**
   * 检查是否在任务页面
   */
  isActive: (pathname: string, workspaceId: string, taskId: string, exact: boolean = true) => 
    isRouteActive(pathname, ROUTE_TEMPLATES.TASK, { workspaceId, taskId }, exact),
}

/**
 * 工作区相关的路由工具
 */
export const workspaceRoutes = {
  /**
   * 构建工作区首页路由
   */
  home: (workspaceId: string) => 
    buildRoute(ROUTE_TEMPLATES.WORKSPACE, { workspaceId }),
    
  /**
   * 构建工作区任务页路由
   */
  tasks: (workspaceId: string) => 
    buildRoute(ROUTE_TEMPLATES.WORKSPACE_TASKS, { workspaceId }),
    
  /**
   * 构建工作区项目页路由
   */
  projects: (workspaceId: string) => 
    buildRoute(ROUTE_TEMPLATES.WORKSPACE_PROJECTS, { workspaceId }),
    
  /**
   * 构建工作区成员页路由
   */
  members: (workspaceId: string) => 
    buildRoute(ROUTE_TEMPLATES.WORKSPACE_MEMBERS, { workspaceId }),
    
  /**
   * 构建工作区设置页路由
   */
  settings: (workspaceId: string) => 
    buildRoute(ROUTE_TEMPLATES.WORKSPACE_SETTINGS, { workspaceId }),
}
