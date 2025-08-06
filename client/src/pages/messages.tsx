import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Search } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import MessageThread from "@/components/MessageThread";
import { format } from "date-fns";
import type { Message, User, Lawyer } from "@shared/schema";

export default function Messages() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const user = authService.getUser();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
  });

  const { data: lawyers = [] } = useQuery({
    queryKey: ['/api/lawyers'],
    enabled: user?.role === 'client',
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string; caseId?: string }) => {
      return apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setMessageText("");
    },
  });

  // Group messages by conversation
  const conversations = messages.reduce((acc: any, message: Message) => {
    const otherUserId = message.senderId === user?._id ? message.receiverId : message.senderId;
    if (!acc[otherUserId]) {
      acc[otherUserId] = [];
    }
    acc[otherUserId].push(message);
    return acc;
  }, {});

  // Fetch contacts based on user role
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/users', { role: 'client' }],
    enabled: user?.role === 'lawyer',
  });

  // Get available contacts (lawyers for clients, clients for lawyers)
  const getAvailableContacts = () => {
    if (user?.role === 'client') {
      return lawyers.map((lawyer: Lawyer) => ({
        _id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        role: 'lawyer',
        specialization: lawyer.specialization,
      }));
    } else if (user?.role === 'lawyer') {
      // For lawyers, show clients they can chat with
      return clients.map((client: User) => ({
        _id: client._id,
        name: client.name,
        email: client.email,
        role: 'client',
        city: client.city,
      }));
    }
    return [];
  };

  const getContactInfo = (userId: string) => {
    const contacts = getAvailableContacts();
    return contacts.find((contact: any) => contact._id === userId);
  };

  const getLastMessage = (userId: string) => {
    const conversation = conversations[userId];
    if (!conversation || conversation.length === 0) return null;
    return conversation.sort((a: Message, b: Message) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    )[0];
  };

  const getUnreadCount = (userId: string) => {
    const conversation = conversations[userId];
    if (!conversation) return 0;
    return conversation.filter((msg: Message) => 
      !msg.read && msg.receiverId === user?._id
    ).length;
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedContact,
      content: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredContacts = getAvailableContacts().filter((contact: any) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversationList = Object.keys(conversations).map(userId => {
    const contact = getContactInfo(userId);
    const lastMessage = getLastMessage(userId);
    const unreadCount = getUnreadCount(userId);
    
    return {
      userId,
      contact,
      lastMessage,
      unreadCount,
    };
  });

  if (messagesLoading) {
    return <div className="p-6">Loading messages...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Messages</h2>
        <p className="text-gray-600">
          {user?.role === 'client' && "Communicate with your lawyers"}
          {user?.role === 'lawyer' && "Communicate with your clients"}
          {user?.role === 'police' && "View case communications"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Contacts Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[600px] overflow-y-auto">
            <div className="space-y-1">
              {conversationList.length === 0 && filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <>
                  {/* Existing Conversations */}
                  {conversationList.map(({ userId, contact, lastMessage, unreadCount }) => {
                    if (!contact) return null;
                    
                    return (
                      <div
                        key={userId}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                          selectedContact === userId 
                            ? 'border-l-legal-blue bg-blue-50' 
                            : 'border-l-transparent'
                        }`}
                        onClick={() => setSelectedContact(userId)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {contact.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {contact.name}
                              </p>
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 capitalize">
                              {contact.role}
                            </p>
                            {lastMessage && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {lastMessage.content.length > 30 
                                  ? `${lastMessage.content.substring(0, 30)}...`
                                  : lastMessage.content
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Available Contacts (no conversation yet) */}
                  {filteredContacts
                    .filter((contact: any) => !conversations[contact._id])
                    .map((contact: any) => (
                      <div
                        key={contact._id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                          selectedContact === contact._id 
                            ? 'border-l-legal-blue bg-blue-50' 
                            : 'border-l-transparent'
                        }`}
                        onClick={() => setSelectedContact(contact._id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {contact.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.name}
                            </p>
                            <p className="text-xs text-gray-600 capitalize">
                              {contact.role}
                            </p>
                            {contact.specialization && (
                              <p className="text-xs text-gray-500">
                                {contact.specialization.join(', ')}
                              </p>
                            )}
                            {contact.city && (
                              <p className="text-xs text-gray-500">
                                {contact.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {getContactInfo(selectedContact)?.name.split(' ').map((n: string) => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {getContactInfo(selectedContact)?.name || 'Unknown Contact'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 capitalize">
                        {getContactInfo(selectedContact)?.role || 'User'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <MessageThread
                      messages={conversations[selectedContact] || []}
                      currentUserId={user?._id || ''}
                    />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-3">
                      <Input
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="bg-legal-blue hover:bg-blue-700 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Select a contact to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
