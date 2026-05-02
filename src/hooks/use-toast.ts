import { toast } from "sonner";

export function useAppToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    loading: (msg: string) => toast.loading(msg),
    promise: toast.promise,
  };
}
