import { LibraryView } from "@/components/montageiv/LibraryView";

export default function HistoriquePage() {
  return (
    <LibraryView
      title="Historique"
      subtitle="Recherchez, filtrez, renommez, dupliquez, supprimez ou restaurez vos générations."
      deleted={false}
    />
  );
}
