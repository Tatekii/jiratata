// MongoDB版本，移除AppWrite依赖
// import { Models } from "node-appwrite"
import { FC, PropsWithChildren, useContext, createContext } from "react"
import { TWorkspace } from "@/features/types"

// 兼容的文档列表类型
interface DocumentList<T> {
	total: number
	documents: T[]
}

interface IProps extends PropsWithChildren {
	workspaces: DocumentList<TWorkspace>
}

const WorkspaceContext = createContext<DocumentList<TWorkspace>>({ total: 0, documents: [] })

const WorkspacesProvider: FC<IProps> = ({ workspaces, children }) => {
	return <WorkspaceContext.Provider value={workspaces}>{children}</WorkspaceContext.Provider>
}

export const useWorkspaceContext = () => useContext(WorkspaceContext)

export default WorkspacesProvider
