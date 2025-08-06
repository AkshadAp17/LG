import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { Message } from "@shared/schema";

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
}

export default function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const sortedMessages = messages.sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return aTime - bTime;
  });

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMessages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUserId;
        const showTimestamp = index === 0 || 
          (message.timestamp && sortedMessages[index - 1].timestamp &&
           new Date(message.timestamp).getTime() - new Date(sortedMessages[index - 1].timestamp!).getTime() > 300000); // 5 minutes

        return (
          <div key={message._id} className="space-y-2">
            {showTimestamp && (
              <div className="text-center">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {message.timestamp ? format(new Date(message.timestamp), 'MMM d, yyyy h:mm a') : 'Now'}
                </span>
              </div>
            )}
            
            <div className={`flex items-start space-x-3 ${isOwnMessage ? 'justify-end' : ''}`}>
              {!isOwnMessage && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {message.senderId.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                <div
                  className={`inline-block px-4 py-3 rounded-lg max-w-xs lg:max-w-md ${
                    isOwnMessage
                      ? 'bg-legal-blue text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                </div>
                <div className={`mt-1 text-xs text-gray-500 ${isOwnMessage ? 'text-right' : ''}`}>
                  {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : 'Now'}
                  {!message.read && !isOwnMessage && (
                    <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              </div>

              {isOwnMessage && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-legal-blue text-white">
                    You
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
