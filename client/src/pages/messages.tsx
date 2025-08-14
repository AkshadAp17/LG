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
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const user = authService.getUser();

  // Fetch all contacts first
  const { data: allContacts = [], isLoading: contactsLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter contacts based on user role - police only see lawyers
  const contacts = user?.role === 'police' 
    ? allContacts.filter(contact => contact.role === 'lawyer')
    : allContacts;

  // Get user's cases to show assigned lawyers
  const { data: userCases = [] } = useQuery<any[]>({
    queryKey: ['/api/cases'],
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

  // Get assigned lawyers for this user's cases
  const getAssignedLawyers = () => {
    if (user?.role !== 'client') return [];
    return userCases
      .filter((c: any) => c.lawyerId)
      .map((c: any) => ({ 
        lawyerId: c.lawyerId, 
        caseTitle: c.title,
        caseStatus: c.status 
      }));
  };

  const assignedLawyers = getAssignedLawyers();
  const assignedLawyerIds = assignedLawyers.map((l: any) => l.lawyerId);

  // Filter and sort contacts - prioritize assigned lawyers for clients
  const filteredContacts = contacts
    .filter(contact => {
      // Exclude self
      if (contact._id === user?._id) return false;
      
      // Apply search filter
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // For clients, show lawyers they have cases with + all lawyers
      if (user?.role === 'client') {
        return matchesSearch && contact.role === 'lawyer';
      }
      
      // For lawyers, show clients they have cases with + all clients
      if (user?.role === 'lawyer') {
        return matchesSearch && contact.role === 'client';
      }
      
      // For police, only show lawyers (already filtered above)
      return matchesSearch;
    })
    .sort((a, b) => {
      // For clients, sort assigned lawyers to the top
      if (user?.role === 'client') {
        const aIsAssigned = assignedLawyerIds.includes(a._id);
        const bIsAssigned = assignedLawyerIds.includes(b._id);
        if (aIsAssigned && !bIsAssigned) return -1;
        if (!aIsAssigned && bIsAssigned) return 1;
      }
      return a.name.localeCompare(b.name);
    });

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
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl p-6 shadow-2xl border border-purple-300/20">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-500/20 p-3 rounded-lg backdrop-blur-sm">
            <MessageSquare className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Secure Messaging
            </h1>
            <p className="text-purple-200 text-lg flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">End-to-end encrypted</span>
              </div>
              <span>•</span>
              <span>Legal team communication</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Contacts Sidebar */}
        <Card className="border border-purple-200/50 shadow-xl bg-gradient-to-b from-white to-purple-50/30 lg:col-span-1 backdrop-blur-sm h-[600px] max-w-full overflow-hidden">
          <CardContent className="p-0">
            {/* Search Header */}
            <div className="p-4 border-b border-purple-200/50 bg-gradient-to-r from-purple-50 to-white">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
                  data-testid="input-search-conversations"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-purple-700 font-medium">
                  {filteredContacts.length} conversation{filteredContacts.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">ONLINE</span>
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="h-[calc(100%-120px)] max-w-full overflow-x-hidden">
              <div className="p-2 max-w-full overflow-hidden"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#8B5CF6 #E5E7EB'
                }}>
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
                    const isAssignedLawyer = user?.role === 'client' && assignedLawyerIds.includes(contact._id);
                    const assignedCase = assignedLawyers.find((l: any) => l.lawyerId === contact._id);
                    
                    return (
                      <div
                        key={contact._id}
                        onClick={() => setSelectedContact(contact)}
                        className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-200 mx-2 mb-2 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 text-white border border-purple-400' 
                            : 'hover:bg-white hover:shadow-md border border-transparent hover:border-purple-200'
                        } ${isAssignedLawyer ? 'ring-2 ring-green-400 bg-green-50/80' : ''}`}
                        data-testid={`contact-${contact._id}`}
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
                          {isAssignedLawyer && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate max-w-[140px] md:max-w-none">{contact.name}</h3>
                            {lastMessage && (
                              <span className="text-xs text-gray-500">
                                {lastMessage.timestamp ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true }) : 'Just now'}
                              </span>
                            )}
                          </div>
                          
                          {isAssignedLawyer && assignedCase && (
                            <div className="mb-1">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                Assigned • {assignedCase.caseTitle}
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 truncate max-w-[120px] md:max-w-none">
                              {lastMessage 
                                ? (lastMessage.senderId === user?._id ? 'You: ' : '') + lastMessage.content
                                : 'No messages yet'
                              }
                            </span>
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
        <Card className="border border-purple-200/50 shadow-xl bg-white lg:col-span-2 backdrop-blur-sm h-[600px] relative">
          <CardContent className="p-0 h-full flex flex-col overflow-hidden">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-2 border-b border-purple-200/50 bg-gradient-to-r from-white to-purple-50/30 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-purple-200">
                          <AvatarFallback className={`${
                            selectedContact.role === 'lawyer' ? 'bg-green-100 text-green-600' :
                            selectedContact.role === 'client' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          } font-bold text-lg`}>
                            {selectedContact.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{selectedContact.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Circle className="w-3 h-3 fill-green-500 text-green-500 animate-pulse" />
                          <span className="text-sm text-gray-600 capitalize font-medium">
                            {selectedContact.role} • Active now
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="hover:bg-purple-100 hover:text-purple-600" data-testid="button-call">
                        <Phone size={18} />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-purple-100 hover:text-purple-600" data-testid="button-video">
                        <Video size={18} />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-purple-100 hover:text-purple-600" data-testid="button-more">
                        <MoreVertical size={18} />
                      </Button>
                      <div className="ml-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        SECURE
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="h-[420px] p-4" onScrollCapture={(e) => {
                  // Handle scroll to see if user is at bottom
                  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                  const isAtBottom = scrollHeight - scrollTop === clientHeight;
                }}>
                  <div className="space-y-2">
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
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/20'
                                : 'bg-white border border-gray-200 text-gray-900 shadow-gray-200/50'
                            }`}>
                              <div className="text-sm">{message.content}</div>
                              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                isOwnMessage ? 'text-purple-200' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {message.timestamp ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : 'Just now'}
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
                
                {/* Scroll to bottom button */}
                <div className="absolute bottom-20 right-4 z-10">
                  <Button 
                    size="sm"
                    className="rounded-full w-10 h-10 bg-purple-600 hover:bg-purple-700 shadow-lg"
                    onClick={scrollToBottom}
                  >
                    ↓
                  </Button>
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-purple-200/50 bg-gradient-to-r from-white to-purple-50/20">
                  <div className="flex items-end space-x-4 bg-white border-2 border-purple-200 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <Button variant="ghost" size="sm" className="hover:bg-purple-100 hover:text-purple-600 rounded-xl p-3" data-testid="button-attach">
                      <Paperclip size={20} />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <textarea
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          // Auto-resize functionality
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="w-full min-h-[36px] max-h-20 resize-none border-0 bg-gray-50 rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-purple-300 focus:outline-none font-medium placeholder:text-gray-500 text-gray-900 text-sm leading-normal transition-all duration-200"
                        rows={1}
                        data-testid="textarea-message"
                      />
                    </div>
                    
                    <Button variant="ghost" size="sm" className="hover:bg-purple-100 hover:text-purple-600 rounded-xl p-3" data-testid="button-emoji">
                      <Smile size={20} />
                    </Button>
                    
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-12 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Clock size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
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