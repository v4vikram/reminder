"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon, MessageCircleIcon, TrashIcon, WalletIcon } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/notify";
import { formatDate, formatPhone, formatRupees } from "@/lib/format";
import { useSession } from "@/features/auth/queries";
import { useDeactivateMember, useMember } from "@/features/members/queries";
import { dueStatusLabel, dueStatusVariant } from "@/features/members/utils";
import { useMemberPayments, useRecordPayment } from "@/features/payments/queries";
import type { PaymentMethod } from "@/features/payments/types";
import { useFeePlans } from "@/features/fee-plans/queries";
import { PlanPicker } from "@/features/fee-plans/components/plan-picker";
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
import { Input } from "@/components/ui/input";
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
  const { activeGym } = useSession();
  const router = useRouter();
  // useParams rather than the async `params` prop: this is a client component,
  // so the hook gives the value directly without unwrapping a promise.
  const { memberId } = useParams<{ memberId: string }>();
  const gymId = activeGym!.id;

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [months, setMonths] = useState("1");
  const [amount, setAmount] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const member = useMember(gymId, memberId);
  const payments = useMemberPayments(gymId, memberId);
  const { data: plans } = useFeePlans(gymId);
  const recordPayment = useRecordPayment(gymId, memberId);
  const deactivate = useDeactivateMember(gymId);

  const fee = member.data?.feeAmount ?? null;

  /**
   * Reset the form whenever the sheet opens, defaulting to one month at the
   * member's fee - the common case then needs no typing at all.
   */
  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (open) {
      setMonths("1");
      setAmount(fee !== null ? String(fee) : "");
      setMethod("CASH");
    }
  }

  function handleRecordPayment() {
    recordPayment.mutate(
      {
        months: Number(months),
        ...(amount !== "" ? { amount: Number(amount) } : {}),
        method,
      },
      {
        onSuccess: () => {
          notify.success("Payment recorded", "Due date aage badh gayi");
          setSheetOpen(false);
        },
        onError: (err) =>
          notify.error(
            err instanceof ApiError ? err.message : "Could not record the payment",
          ),
      },
    );
  }

  function handleDeactivate() {
    deactivate.mutate(memberId, {
      onSuccess: () => {
        notify.success("Member hata diya", "History safe hai");
        router.replace("/members");
      },
      onError: (err) =>
        notify.error(
          err instanceof ApiError ? err.message : "Could not remove the member",
        ),
    });
  }

  if (member.isPending) {
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
        <Button
          nativeButton={false}
          render={<Link href="/members" />}
          variant="outline"
          className="mt-4 h-12"
        >
          Back to members
        </Button>
      </div>
    );
  }

  const m = member.data;

  return (
    <div className="space-y-4 px-4 pt-6">
      <header className="flex items-center gap-2">
        <Button
          nativeButton={false}
          render={<Link href="/members" aria-label="Back to members" />}
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{m.name}</h1>
          <p className="text-sm text-muted-foreground">{formatPhone(m.phone)}</p>
        </div>
      </header>

      {/* Arrears first and in full: how many months, for which span, how much.
          The old screen showed one due date and one month's fee, which hid the
          real size of the debt. */}
      {m.pending ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-1 py-4">
            <p className="tabular text-lg font-semibold text-destructive">
              {m.pending.months} {m.pending.months === 1 ? "month" : "months"} pending
              {m.pending.amount !== null ? ` · ${formatRupees(m.pending.amount)}` : ""}
            </p>
            <p className="tabular text-sm text-muted-foreground">
              {formatDate(m.pending.from)} – {formatDate(m.pending.to)}
            </p>
            {m.pending.amount === null ? (
              <p className="text-xs text-muted-foreground">
                Monthly fees set nahi hai, isliye total nahi nikal sakta.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
          <Row
            label="Monthly fees"
            value={m.feeAmount === null ? "Set nahi hai" : formatRupees(m.feeAmount)}
          />
          <Row label="Next due" value={formatDate(m.nextDueDate)} />
          <Row label="Joined" value={formatDate(m.joinDate)} />
          {m.notes ? <Row label="Notes" value={m.notes} /> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger render={<Button size="lg" className="h-12" />}>
            <WalletIcon className="size-4" />
            Paid
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Payment record karo</SheetTitle>
              <SheetDescription>
                Due date {formatDate(m.nextDueDate)} se {months}{" "}
                {Number(months) === 1 ? "mahina" : "mahine"} aage badh jayegi.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4">
              {plans && plans.length > 0 ? (
                <div className="space-y-2">
                  <Label>Plan</Label>
                  {/* One tap fills both duration and amount - the whole point of
                      keeping the gym's tiers as data. */}
                  <PlanPicker
                    plans={plans}
                    selectedMonths={Number(months)}
                    onSelect={(plan) => {
                      setMonths(String(plan.months));
                      setAmount(String(plan.amount));
                    }}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="months">Months</Label>
                  <Input
                    id="months"
                    value={months}
                    onChange={(e) =>
                      setMonths(e.target.value.replace(/[^0-9]/g, "") || "1")
                    }
                    inputMode="numeric"
                    className="tabular h-12 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="400"
                    inputMode="numeric"
                    className="tabular h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment method</Label>
                {/* Plain buttons rather than a toggle group: one tap, four large
                    targets, and no dependence on an array-valued API. */}
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
            </div>

            <SheetFooter>
              <Button
                onClick={handleRecordPayment}
                disabled={recordPayment.isPending || amount === ""}
                size="lg"
                className="h-12 w-full"
              >
                {recordPayment.isPending ? <Spinner className="size-4" /> : null}
                Confirm payment
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Button
          nativeButton={false}
          render={<Link href="/reminders" />}
          variant="outline"
          size="lg"
          className="h-12"
        >
          <MessageCircleIcon className="size-4" />
          Reminder
        </Button>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Payment history</h2>
        {payments.isPending ? (
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
                      <p className="tabular font-medium">
                        {formatRupees(p.amount)}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          {p.months} {p.months === 1 ? "month" : "months"}
                        </span>
                      </p>
                      <p className="tabular text-xs text-muted-foreground">
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
        <AlertDialogTrigger
          render={<Button variant="ghost" className="h-12 w-full text-destructive" />}
        >
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
            <AlertDialogAction onClick={handleDeactivate} className="h-12">
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
      <span className="tabular text-right font-medium">{value}</span>
    </div>
  );
}
