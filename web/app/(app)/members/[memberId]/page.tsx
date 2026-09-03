"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon, MessageCircleIcon, TrashIcon, WalletIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import {
  dueStatusLabel,
  dueStatusVariant,
  formatDate,
  formatPhone,
  formatRupees,
} from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { Member, Paginated, Payment, PaymentMethod } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const METHODS: PaymentMethod[] = ["CASH", "UPI", "CARD", "OTHER"];

export default function MemberDetailPage() {
  const { activeGym } = useAuth();
  const router = useRouter();
  // useParams rather than the async `params` prop: this is a client component,
  // so the hook gives the value directly without unwrapping a promise.
  const { memberId } = useParams<{ memberId: string }>();
  const gymId = activeGym!.id;

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paying, setPaying] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const member = useResource<Member>(
    () => api.get<Member>(`/gyms/${gymId}/members/${memberId}`),
    `member:${gymId}:${memberId}`,
  );

  const payments = useResource<Paginated<Payment>>(
    () => api.get<Paginated<Payment>>(`/gyms/${gymId}/members/${memberId}/payments`),
    `payments:${gymId}:${memberId}`,
  );

  async function recordPayment() {
    setPaying(true);
    try {
      await api.post(`/gyms/${gymId}/members/${memberId}/payments`, { method });
      notify.success("Payment recorded", "Due date aage badh gayi");
      setSheetOpen(false);
      // Both change: the member's due date advances and history gains a row.
      await Promise.all([member.reload(), payments.reload()]);
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Could not record the payment");
    } finally {
      setPaying(false);
    }
  }

  async function deactivate() {
    try {
      await api.delete(`/gyms/${gymId}/members/${memberId}`);
      notify.success("Member hata diya", "History safe hai");
      router.replace("/members");
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "Could not remove the member");
    }
  }

  if (member.loading) {
    return (
      <div className="space-y-4 px-4 pt-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (member.error || !member.data) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-muted-foreground">
          {member.error?.message ?? "Member not found"}
        </p>
        <Button render={<Link href="/members" />} variant="outline" className="mt-4 h-12">Back to members</Button>
      </div>
    );
  }

  const m = member.data;

  return (
    <div className="space-y-4 px-4 pt-6">
      <header className="flex items-center gap-2">
        <Button render={<Link href="/members" aria-label="Back to members" />} variant="ghost" size="icon" className="size-11 shrink-0">
            <ChevronLeftIcon className="size-5" />
          </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{m.name}</h1>
          <p className="text-sm text-muted-foreground">{formatPhone(m.phone)}</p>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={dueStatusVariant[m.dueStatus]}>
              {m.dueStatus === "overdue"
                ? `${m.daysOverdue} din overdue`
                : dueStatusLabel[m.dueStatus]}
            </Badge>
          </div>
          <Separator />
          <Row label="Monthly fees" value={formatRupees(m.feeAmount)} />
          <Row label="Next due" value={formatDate(m.nextDueDate)} />
          <Row label="Joined" value={formatDate(m.joinDate)} />
          {m.notes ? <Row label="Notes" value={m.notes} /> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="lg" className="h-12" />}>
              <WalletIcon className="size-4" />
              Paid
            </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Payment record karo</SheetTitle>
              <SheetDescription>
                {formatRupees(m.feeAmount)} · due date {formatDate(m.nextDueDate)} se ek
                mahina aage badh jayegi.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-2 px-4">
              <Label>Payment method</Label>
              <div className="grid grid-cols-4 gap-2">
                {METHODS.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={method === option ? "default" : "outline"}
                    onClick={() => setMethod(option)}
                    className="h-12"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <SheetFooter>
              <Button onClick={recordPayment} disabled={paying} size="lg" className="h-12 w-full">
                {paying ? <Spinner className="size-4" /> : null}
                Confirm payment
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Button render={<Link href="/reminders" />} variant="outline" size="lg" className="h-12">
            <MessageCircleIcon className="size-4" />
            Reminder
          </Button>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Payment history</h2>
        {payments.loading ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : payments.data?.items.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Abhi tak koi payment record nahi hui.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {payments.data?.items.map((p) => (
              <li key={p.id}>
                <Card>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{formatRupees(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.periodStart && p.periodEnd
                          ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
                          : formatDate(p.paidAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">{p.method}</Badge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" className="h-12 w-full text-destructive" />}>
            <TrashIcon className="size-4" />
            Member hatao
          </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.name} ko hatana hai?</AlertDialogTitle>
            <AlertDialogDescription>
              Member list se hat jayega, par uski payment history safe rahegi. Dobara
              join kare to wapas la sakte ho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12">Rehne do</AlertDialogCancel>
            <AlertDialogAction onClick={deactivate} className="h-12">
              Hatao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
