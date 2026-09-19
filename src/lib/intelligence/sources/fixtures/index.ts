import type { SourceAdapter } from "@/lib/intelligence/sources/adapter";
import { uaeFixtureDocuments } from "./uae";

export const uaeFixtureAdapter: SourceAdapter = {
  id: "uae-dev-fixtures",
  label: "UAE development fixtures (replace before production)",
  fetchDocuments: async () => uaeFixtureDocuments,
};