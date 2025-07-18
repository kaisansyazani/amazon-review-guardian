
export interface Review {
  id: string;
  text: string;
  rating: number;
  date: string;
  author: string;
  classification: 'genuine' | 'paid' | 'bot' | 'malicious';
  confidence: number;
  explanation: string;
  hasImage?: boolean;
  hasVideo?: boolean;
  isVerifiedPurchase?: boolean;
}
