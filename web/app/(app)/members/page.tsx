"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useSession } from "@/features/auth/queries";
import { useMembers } from "@/features/members/queries";
import { MemberCard } from "@/features/members/components/member-card";
import type { DueStatus } from "@/features/members/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | DueStatus;

export default function MembersPage() {
  const { activeGym } = useSession();
  const gymId = activeGym!.id;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data, isPending } = useMembers(gymId, {
    ...(filter === "all" ? {} : { dueFilter: filter }),
    ...(search.trim() ? { search: search.trim() } : {}),
    limit: 100,
  });

  return (
    <div className="space-y-4 px-4 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} ${data.total === 1 ? "member" : "members"}` : " "}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/members/new" />} size="sm" className="h-11">
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

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {!isPending && data?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <UsersIcon className="size-8 text-muted-foreground" />
            <p className="font-medium">
              {search ? "Koi member nahi mila" : "Abhi koi member nahi"}
            </p>
            {!search ? (
              <Button nativeButton={false} render={<Link href="/members/new" />} size="sm" className="mt-2 h-11">
                Pehla member add karo
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <ul className="space-y-3">
        {data?.items.map((member) => (
          <li key={member.id}>
            <MemberCard member={member} />
          </li>
        ))}
      </ul>
    </div>
  );
}
