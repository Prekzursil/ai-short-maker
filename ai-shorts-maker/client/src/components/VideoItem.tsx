import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  GripVertical,
  FileVideo,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import type { VideoItem } from "@/types/video";
import { format, formatDistanceToNow } from "date-fns";

interface VideoItemProps {
  video: VideoItem;
  onRemove: (id: string) => void;
  onSelect: (video: VideoItem) => void;
  isProcessing?: boolean;
}

export function VideoItem({
  video,
  onRemove,
  onSelect,
  isProcessing,
}: VideoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getLastModifiedText = () => {
    if (!video.lastModified) return "";
    const date = new Date(video.lastModified);
    const distance = formatDistanceToNow(date, { addSuffix: true });
    const fullDate = format(date, "MMM d, yyyy h:mm a");
    return `Last modified ${distance} (${fullDate})`;
  };

  // Entire item (except remove control) is clickable for selection
  const handleContainerClick = (e: React.MouseEvent) => {
    onSelect(video);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 bg-card/50 backdrop-blur-sm rounded-lg border shadow-sm cursor-pointer",
        "transition-all duration-200 hover:shadow-md hover:scale-[1.01]",
        isDragging && "opacity-50",
        isProcessing && "opacity-70 pointer-events-none",
        video.selected && "ring-2 ring-primary"
      )}
      onClick={handleContainerClick}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing hover:text-primary transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Drag to reorder</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {video.type === "local" ? (
        <FileVideo className="h-5 w-5 text-primary" />
      ) : (
        <LinkIcon className="h-5 w-5 text-primary" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {video.title || video.name}
          </span>
          {video.loading && (
            <Badge variant="secondary" className="animate-pulse">
              Loading...
            </Badge>
          )}
        </div>
        {video.lastModified && (
          <div className="text-xs text-muted-foreground mt-1">
            {getLastModifiedText()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {!isProcessing && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(video.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove Video</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
