"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { useSession } from "@/features/auth/queries";
import { useCreateMember } from "@/features/members/queries";
import { MemberForm } from "@/features/members/components/member-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NewMemberPage() {
  const { activeGym } = useSession();
  const router = useRouter();
  const createMember = useCreateMember(activeGym!.id);

  return (
    <div className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-2">
        <Button
          nativeButton={false}
          render={<Link href="/members" aria-label="Back to members" />}
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Naya member</h1>
      </header>

      <Card>
        <CardContent className="py-5">
          <MemberForm
            submitting={createMember.isPending}
            error={createMember.error}
            onSubmit={(input) =>
              createMember.mutate(input, {
                onSuccess: () => {
                  notify.success("Member added");
                  router.replace("/members");
                },
                onError: (err) => {
                  // Field-level problems render inside the form; a duplicate
                  // phone arrives as CONFLICT with no details, so it needs a toast.
                  if (err instanceof ApiError && err.details.length === 0) {
                    notify.error(err.message);
                  }
                },
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
