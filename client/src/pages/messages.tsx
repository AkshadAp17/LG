import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Circle,
  CheckCheck,
  Clock,
  Users,
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Message, User } from "@shared/schema";

export default function Messages() {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const user = authService.getUser();

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!selectedContact,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setNewMessage("");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedContact._id || '',
      content: newMessage,
    });
  };

  const filteredContacts = contacts.filter(contact => 
    contact._id !== user?._id &&
    (contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     contact.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getConversationMessages = () => {
    if (!selectedContact) return [];
    return messages.filter(msg => 
      (msg.senderId === user?._id && msg.receiverId === selectedContact._id) ||
      (msg.senderId === selectedContact._id && msg.receiverId === user?._id)
    ).sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  };

  const getLastMessage = (contactId: string) => {
    const contactMessages = messages.filter(msg => 
      (msg.senderId === user?._id && msg.receiverId === contactId) ||
      (msg.senderId === contactId && msg.receiverId === user?._id)
    );
    return contactMessages.sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    )[0];
  };

  const conversationMessages = getConversationMessages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-purple-100 text-lg">
          Communicate securely with your legal team and clients
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Contacts Sidebar */}
        <Card className="border-0 shadow-lg lg:col-span-1">
          <CardContent className="p-0">
            {/* Search Header */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="h-[600px]">
              <div className="p-2">
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No contacts found</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const lastMessage = getLastMessage(contact._id || '');
                    const isSelected = selectedContact?._id === contact._id;
                    
                    return (
                      <div
                        key={contact._id}
                        onClick={() => setSelectedContact(contact)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-50 border-l-4 border-l-purple-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className={`${
                              contact.role === 'lawyer' ? 'bg-green-100 text-green-600' :
                              contact.role === 'client' ? 'bg-blue-100 text-blue-600' :
                              'bg-purple-100 text-purple-600'
                            } font-semibold`}>
                              {contact.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                            {lastMessage && (
                              <span className="text-xs text-gray-500">
                                {new Date(lastMessage.timestamp || 0).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">
                              {lastMessage 
                                ? (lastMessage.senderId === user?._id ? 'You: ' : '') + lastMessage.content
                                : 'No messages yet'
                              }
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs capitalize ${
                                contact.role === 'lawyer' ? 'text-green-600 border-green-200' :
                                contact.role === 'client' ? 'text-blue-600 border-blue-200' :
                                'text-purple-600 border-purple-200'
                              }`}
                            >
                              {contact.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardContent className="p-0 h-full flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${
                          selectedContact.role === 'lawyer' ? 'bg-green-100 text-green-600' :
                          selectedContact.role === 'client' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        } font-semibold`}>
                          {selectedContact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                          <span className="text-sm text-gray-600 capitalize">
                            {selectedContact.role} • Online
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone size={18} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video size={18} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={18} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      conversationMessages.map((message) => {
                        const isOwnMessage = message.senderId === user?._id;
                        
                        return (
                          <div
                            key={message._id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center justify-end mt-2 space-x-1 ${
                                isOwnMessage ? 'text-purple-200' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {new Date(message.timestamp || 0).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isOwnMessage && (
                                  <CheckCheck size={14} className="text-purple-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-end space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip size={18} />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="min-h-[44px] max-h-32 resize-none border-0 bg-white shadow-sm"
                        rows={1}
                      />
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Smile size={18} />
                    </Button>
                    
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-4"
                    >
                      {sendMessageMutation.isPending ? (
                        <Clock size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-500">Choose a contact from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}