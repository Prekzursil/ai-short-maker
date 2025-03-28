import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { VideoItem } from "./VideoItem";
import { ScrollArea } from "./ui/scroll-area";
import type { VideoItem as VideoItemType } from "@/types/video";

interface VideoListProps {
  videos: VideoItemType[];
  onVideosReorder: (videos: VideoItemType[]) => void;
  onVideoRemove: (id: string) => void;
  onVideoSelect: (video: VideoItemType) => void;
  isProcessing?: boolean;
}

export function VideoList({
  videos,
  onVideosReorder,
  onVideoRemove,
  onVideoSelect,
  isProcessing,
}: VideoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((video) => video.id === active.id);
      const newIndex = videos.findIndex((video) => video.id === over.id);
      onVideosReorder(arrayMove(videos, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] rounded-lg border p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={videos} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {videos.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No videos added yet
                </div>
              ) : (
                videos.map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onRemove={onVideoRemove}
                    onSelect={onVideoSelect}
                    isProcessing={isProcessing}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
      <div className="text-sm text-muted-foreground">
        {videos.length} video{videos.length !== 1 ? "s" : ""} in list
      </div>
    </div>
  );
}
