export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string;
  birth_date: string;
  zodiac_sign: string;
}
