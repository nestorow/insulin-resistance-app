"use client";

import { useEffect } from "react";
import { runTrackingMigration } from "@/lib/tracking-storage";

// Mounted once in the root layout: runs the one-time localStorage cleanup
// (drops out-of-range historical values from the symptom + marker logs).
// Renders nothing.
export default function MigrateLocalData() {
  useEffect(() => {
    runTrackingMigration();
  }, []);
  return null;
}
