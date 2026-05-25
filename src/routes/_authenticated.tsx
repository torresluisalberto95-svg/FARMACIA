import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/app-layout";

export const Route = createFileRoute("/_authenticated")({
  component: AppLayout,
});
