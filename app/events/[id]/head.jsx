import eventsData from "@/app/_data/eventsData.json";

export async function generateMetadata({ params }) {
  const event = eventsData.find((e) => e.id === Number(params.id));

  if (!event) {
    return { title: "Événement non trouvé | Farm To Fork" };
  }

  return {
    title: `${event.title} | Farm To Fork`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      type: "article",
    },
  };
}
