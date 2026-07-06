import { LibraryView } from "@/components/montageiv/LibraryView";

export default function FavorisPage() {
  return (
    <LibraryView
      title="Favoris"
      subtitle="Vos créations marquées d'une étoile."
      favorite
    />
  );
}
