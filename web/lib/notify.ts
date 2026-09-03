import { toast } from "@/components/ui/toast";

/**
 * Thin wrapper over the toast manager.
 *
 * shadcn's toast is built on Base UI, whose API is `toast.add({...})` rather
 * than the `toast.error(...)` shape people expect from sonner. Keeping that
 * detail here means screens read the same either way, and swapping the
 * underlying toast library later touches one file.
 */
export const notify = {
  success(title: string, description?: string) {
    toast.add({ title, description, type: "success" });
  },
  error(title: string, description?: string) {
    toast.add({ title, description, type: "error" });
  },
  info(title: string, description?: string) {
    toast.add({ title, description, type: "info" });
  },
};
