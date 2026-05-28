"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProgress, type ProgressSnapshot } from "@/lib/gamification";

// Single read endpoint for the UI. Anonymous users get null — the UI
// hides the gamification card in that case (streaks only make sense
// for signed-in users with continuous history).

export async function getProgressAction(): Promise<ProgressSnapshot | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return getProgress(session.user.id);
}
