"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { dueStatusLabel, dueStatusVariant, formatDate, formatRupees } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { Member, Paginated } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | "overdue" | "due_soon" | "upcoming";

export default function MembersPage() {
  const { activeGym } = useAuth();
  const gymId = activeGym!.id;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data, loading } = useResource<Paginated<Member>>(
    () =>
      api.get<Paginated<Member>>(`/gyms/${gymId}/members`, {
        ...(filter === "all" ? {} : { dueFilter: filter }),
        ...(search.trim() ? { search: search.trim() } : {}),
        limit: 100,
      }),
    `members:${gymId}:${filter}:${search}`,
  );

  return (
    <div className="space-y-4 px-4 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} ${data.total === 1 ? "member" : "members"}` : " "}
          </p>
        </div>
        <Button render={<Link href="/members/new" />} size="sm" className="h-11">
            <PlusIcon className="size-4" />
            Add
          </Button>
      </header>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {/* text-base keeps the font at 16px; anything smaller makes iOS Safari
            zoom the whole page when the field is focused. */}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Naam ya phone se dhoondo"
          className="h-12 pl-9 text-base"
          autoComplete="off"
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="due_soon">Soon</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && data?.items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <UsersIcon className="size-8 text-muted-foreground" />
            <p className="font-medium">
              {search ? "Koi member nahi mila" : "Abhi koi member nahi"}
            </p>
            {!search && (
              <Button render={<Link href="/members/new" />} size="sm" className="mt-2 h-11">Pehla member add karo</Button>
            )}
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {data?.items.map((member) => (
          <li key={member.id}>
            <Link href={`/members/${member.id}`} className="block">
              <Card className="transition-colors active:bg-accent">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(member.nextDueDate)} · {formatRupees(member.feeAmount)}
                    </p>
                  </div>
                  <Badge variant={dueStatusVariant[member.dueStatus]} className="shrink-0">
                    {member.dueStatus === "overdue"
                      ? `${member.daysOverdue}d`
                      : dueStatusLabel[member.dueStatus]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
