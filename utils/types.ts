export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  rating: Rating;
  title: string;
  comment: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  image: string;
  reviewCount: number;
  averageRating: number;
}

export interface RatingStatistics {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface Company {
  id: string;
  name: string;
  location: string;
  password: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  servicePoints: ServicePoint[];
  checkList: CheckListItem[];
  ratings: CompanyRating[];
  comments: Comment[];
  userPreferredCheckList: UserPreferredItem[];
  suggestions: Suggestion[];
  createdAt: Date;
}

export interface ServicePoint {
  id: string;
  name: string;
  description: string;
  department: string;
  isActive: boolean;
}

export interface CheckListItem {
  id: string;
  title: string;
  description: string;
  department: string;
  isRequired: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface CompanyRating {
  id: string;
  userId: string;
  userName: string;
  servicePointId: string;
  rating: number;
  date: Date;
  reviewText?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  date: Date;
  servicePointId?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface UserPreferredItem {
  id: string;
  userId: string;
  userName: string;
  checkListItemId: string;
  preference: 'essential' | 'important' | 'nice-to-have';
  feedback: string;
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  date: Date;
}