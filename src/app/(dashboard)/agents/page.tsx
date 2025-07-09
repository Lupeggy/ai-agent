import { Suspense } from "react";
import { dehydrate } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { ClientPage } from "./client-page";
import { AgentViewLoading } from "@/modules/agents/ui/views/agents-view";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user is authenticated
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());

  return (
    <Suspense fallback={<AgentViewLoading />}>
      <ClientPage dehydratedState={dehydrate(queryClient)} />
    </Suspense>
  );
};

export default Page;