import { Review, RatingStatistics, UserProfile, Company } from './types';

// Mock users
export const users: UserProfile[] = [
  {
    id: 'user1',
    name: 'Alex Johnson',
    image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    reviewCount: 12,
    averageRating: 4.2,
  },
  {
    id: 'user2',
    name: 'Morgan Smith',
    image: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150',
    reviewCount: 8,
    averageRating: 3.9,
  },
  {
    id: 'user3',
    name: 'Taylor Brown',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    reviewCount: 5,
    averageRating: 4.8,
  },
  {
    id: 'user4',
    name: 'Jordan Davis',
    image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
    reviewCount: 15,
    averageRating: 4.1,
  },
  {
    id: 'user5',
    name: 'Casey Wilson',
    image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150',
    reviewCount: 3,
    averageRating: 3.7,
  },
];

// Mock reviews
export const reviews: Review[] = [
  {
    id: 'review1',
    userId: 'user1',
    userName: 'Alex Johnson',
    userImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    title: 'Absolutely love this product!',
    comment: 'This exceeded all my expectations. The quality is outstanding and it works perfectly for what I needed. Highly recommend to anyone considering this.',
    createdAt: '2024-05-01T10:24:00Z',
    helpful: 42,
    verified: true,
  },
  {
    id: 'review2',
    userId: 'user2',
    userName: 'Morgan Smith',
    userImage: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 4,
    title: 'Great product with minor issues',
    comment: 'Overall, I\'m very satisfied with my purchase. The product works as advertised with only a few minor hiccups that don\'t affect the main functionality.',
    createdAt: '2024-04-28T14:35:00Z',
    helpful: 18,
    verified: true,
  },
  {
    id: 'review3',
    userId: 'user3',
    userName: 'Taylor Brown',
    userImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    title: 'Perfect solution for my needs',
    comment: 'This product has completely transformed my workflow. Everything about it is intuitive and well-designed. I\'m thoroughly impressed with every aspect.',
    createdAt: '2024-04-20T09:17:00Z',
    helpful: 27,
    verified: true,
  },
  {
    id: 'review4',
    userId: 'user4',
    userName: 'Jordan Davis',
    userImage: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 3,
    title: 'Decent product but expected more',
    comment: 'It gets the job done, but I was expecting more features for the price point. The build quality is good, but the software could use some improvements.',
    createdAt: '2024-04-15T16:42:00Z',
    helpful: 14,
    verified: true,
  },
  {
    id: 'review5',
    userId: 'user5',
    userName: 'Casey Wilson',
    userImage: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 2,
    title: 'Disappointed with performance',
    comment: 'Unfortunately, this product didn\'t meet my expectations. It\'s slow and unreliable at times.Customer service was helpful but couldn\'t resolve all my issues.',
    createdAt: '2024-04-10T11:08:00Z',
    helpful: 8,
    verified: false,
  },
  {
    id: 'review6',
    userId: 'user1',
    userName: 'Alex Johnson',
    userImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 4,
    title: 'Good value for money',
    comment: 'This product offers excellent value. It may not have all the premium features, but it handles the essentials very well. Would recommend for most users.',
    createdAt: '2024-04-05T13:29:00Z',
    helpful: 21,
    verified: true,
  },
  {
    id: 'review7',
    userId: 'user3',
    userName: 'Taylor Brown',
    userImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 5,
    title: 'Outstanding quality and design',
    comment: 'I\'m amazed by the attention to detail in this product. Everything from the packaging to the user experience has been carefully considered. Worth every penny!',
    createdAt: '2024-04-01T08:15:00Z',
    helpful: 35,
    verified: true,
  },
  {
    id: 'review8',
    userId: 'user5',
    userName: 'Casey Wilson',
    userImage: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 3,
    title: 'Mixed feelings about this one',
    comment: 'There are aspects I really like about this product, and others that need improvement. The core functionality works well, but the user interface could be more intuitive.',
    createdAt: '2024-03-28T10:45:00Z',
    helpful: 12,
    verified: false,
  },
];

// Rating statistics
export const ratingStats: RatingStatistics = {
  average: 3.9,
  total: 8,
  distribution: {
    5: 3,
    4: 2,
    3: 2,
    2: 1,
    1: 0,
  },
};

// Product images
export const productImages = {
  main: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800',
  thumbnail1: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=150',
  thumbnail2: 'https://images.pexels.com/photos/7679740/pexels-photo-7679740.jpeg?auto=compress&cs=tinysrgb&w=150',
  thumbnail3: 'https://images.pexels.com/photos/7679722/pexels-photo-7679722.jpeg?auto=compress&cs=tinysrgb&w=150',
};

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    location: 'New York',
    password: 'techcorp123',
    industry: 'Technology',
    contactEmail: 'contact@techcorp.com',
    contactPhone: '+1-555-0123',
    description: 'Leading technology solutions provider',
    createdAt: new Date('2023-01-15'),
    servicePoints: [
      {
        id: 'sp1',
        name: 'Customer Support',
        description: '24/7 customer assistance',
        department: 'Support',
        isActive: true
      },
      {
        id: 'sp2',
        name: 'Technical Consultation',
        description: 'Expert technical guidance',
        department: 'Engineering',
        isActive: true
      },
      {
        id: 'sp3',
        name: 'Software Implementation',
        description: 'End-to-end software deployment',
        department: 'Implementation',
        isActive: true
      }
    ],
    checkList: [
      {
        id: 'cl1',
        title: 'Response Time',
        description: 'Maximum response time for customer queries',
        department: 'Support',
        isRequired: true,
        priority: 'high'
      },
      {
        id: 'cl2',
        title: 'Solution Documentation',
        description: 'Comprehensive documentation for all solutions',
        department: 'Documentation',
        isRequired: true,
        priority: 'high'
      },
      {
        id: 'cl3',
        title: 'Quality Assurance',
        description: 'Thorough testing before deployment',
        department: 'Quality',
        isRequired: true,
        priority: 'medium'
      }
    ],
    ratings: [
      {
        id: 'r1',
        userId: 'u1',
        userName: 'John Doe',
        servicePointId: 'sp1',
        rating: 4.5,
        date: new Date('2024-01-15'),
        reviewText: 'Excellent customer support, very responsive'
      },
      {
        id: 'r2',
        userId: 'u2',
        userName: 'Sarah Smith',
        servicePointId: 'sp2',
        rating: 5.0,
        date: new Date('2024-01-20'),
        reviewText: 'Outstanding technical expertise'
      },
      {
        id: 'r3',
        userId: 'u3',
        userName: 'Mike Johnson',
        servicePointId: 'sp3',
        rating: 4.2,
        date: new Date('2024-01-25'),
        reviewText: 'Smooth implementation process'
      }
    ],
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'John Doe',
        content: 'Great service overall, keep up the good work!',
        date: new Date('2024-01-16'),
        servicePointId: 'sp1',
        sentiment: 'positive'
      },
      {
        id: 'c2',
        userId: 'u4',
        userName: 'Lisa Wong',
        content: 'Could improve documentation clarity',
        date: new Date('2024-01-22'),
        sentiment: 'neutral'
      }
    ],
    userPreferredCheckList: [
      {
        id: 'up1',
        userId: 'u1',
        userName: 'John Doe',
        checkListItemId: 'cl1',
        preference: 'essential',
        feedback: 'Quick response time is crucial for our business'
      },
      {
        id: 'up2',
        userId: 'u2',
        userName: 'Sarah Smith',
        checkListItemId: 'cl2',
        preference: 'important',
        feedback: 'Good documentation saves a lot of time'
      }
    ],
    suggestions: [
      {
        id: 's1',
        userId: 'u3',
        userName: 'Mike Johnson',
        title: 'Mobile App Development',
        description: 'Consider developing a mobile app for better accessibility',
        category: 'Product Enhancement',
        priority: 'medium',
        status: 'pending',
        date: new Date('2024-01-28')
      },
      {
        id: 's2',
        userId: 'u4',
        userName: 'Lisa Wong',
        title: 'Video Tutorials',
        description: 'Add video tutorials for common tasks',
        category: 'Documentation',
        priority: 'low',
        status: 'reviewed',
        date: new Date('2024-01-30')
      }
    ]
  }
];