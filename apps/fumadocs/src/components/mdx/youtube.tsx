"use client";

export function YouTube({ id }: { id: string }) {
  return (
    <div className="my-6 aspect-video w-full">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full rounded-lg"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
      />
    </div>
  );
}
