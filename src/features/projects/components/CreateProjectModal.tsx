"use client"

import { ResponsiveModal } from "@/components/ResponsiveModal"
import useCreateProjectModal from "../hooks/useCreateProjectModal"
import CreateProjectForm from "./CreateProjectForm"

const CreateProjectModal = () => {
	const { isOpen, setIsOpen, close } = useCreateProjectModal()

	return (
		<ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
			<CreateProjectForm onCancel={close} />
		</ResponsiveModal>
	)
}

export default CreateProjectModal