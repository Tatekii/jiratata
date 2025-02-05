"use client";

import { ResponsiveModal } from "@/components/ResponsiveModal";
import useEditTaskModal from "../hooks/useEditTaskModal";
import EditTaskFormWrapper from "./EditTaskFormWrapper";


export const EditTaskModal = () => {
  const { taskId, close } = useEditTaskModal();

  return (
    <ResponsiveModal open={!!taskId} onOpenChange={close}>
      {taskId && (
        <EditTaskFormWrapper id={taskId} onCancel={close} />
      )}
    </ResponsiveModal>
  );
};
