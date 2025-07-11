import { usePathname } from "next/navigation"
import { useMemo } from "react"

/**
 * 自定义hook用于智能路由匹配
 * 支持精确匹配、前缀匹配和模式匹配
 */
export function useRouteMatch() {
  const pathname = usePathname()
  
  return useMemo(() => ({
    /**
     * 精确匹配
     */
    exact: (route: string) => pathname === route,
    
    /**
     * 前缀匹配，忽略语言前缀
     */
    startsWith: (route: string) => pathname.endsWith(route),
    
    /**
     * 包含匹配
     */
    includes: (segment: string) => pathname.includes(segment),
    
    /**
     * 正则匹配
     */
    regex: (pattern: RegExp) => pattern.test(pathname),
    
    /**
     * 多路径匹配
     */
    anyOf: (routes: string[]) => routes.some(route => pathname.endsWith(route)),
    
    /**
     * 项目页面匹配（包括项目详情和设置页）
     */
    isProjectPage: (workspaceId: string, projectId: string) => {
      const projectBase = `/workspaces/${workspaceId}/projects/${projectId}`
      return pathname.includes(projectBase)
    },
    
    /**
     * 获取当前路径信息
     */
    getPathInfo: () => {
      const segments = pathname.split('/').filter(Boolean)
      return {
        segments,
        isWorkspacePage: segments.includes('workspaces'),
        workspaceId: segments[segments.indexOf('workspaces') + 1] || null,
        projectId: segments.includes('projects') ? segments[segments.indexOf('projects') + 1] || null : null,
        taskId: segments.includes('tasks') ? segments[segments.indexOf('tasks') + 1] || null : null,
      }
    }
  }), [pathname])
}

/**
 * 项目相关的路由匹配hook
 */
export function useProjectRouteMatch(workspaceId: string) {
  const { isProjectPage, getPathInfo } = useRouteMatch()
  
  return useMemo(() => ({
    /**
     * 检查是否为指定项目的激活状态
     */
    isProjectActive: (projectId: string) => {
      const pathInfo = getPathInfo()
      return pathInfo.projectId === projectId
    },
    
    /**
     * 检查是否在项目相关页面（包括子页面）
     */
    isInProject: (projectId: string) => isProjectPage(workspaceId, projectId),
    
    /**
     * 获取当前激活的项目ID
     */
    getCurrentProjectId: () => getPathInfo().projectId,
  }), [workspaceId, isProjectPage, getPathInfo])
}
