import { Models } from "node-appwrite"
import { FC, PropsWithChildren, useContext, createContext } from "react"

interface IProps extends PropsWithChildren {
	workspaces: Models.DocumentList<Models.Document>
}

const WorkspaceContext = createContext<Models.DocumentList<Models.Document>>({ total: 0, documents: [] })

const WorkspacesProvider: FC<IProps> = ({ workspaces, children }) => {
	return <WorkspaceContext.Provider value={workspaces}>{children}</WorkspaceContext.Provider>
}

export const useWorkspaceContext = () => useContext(WorkspaceContext)

export default WorkspacesProvider
