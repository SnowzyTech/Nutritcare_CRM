import { MessageCircle } from "lucide-react";

export default function ChatEmptyState() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-3 text-center md:flex">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
        <MessageCircle className="h-8 w-8" />
      </div>
      <p className="text-sm font-medium text-gray-500">
        Select a conversation to start chatting
      </p>
    </div>
  );
}
