import {imgPath, Icons} from '../assets';

export const downloadItems = [
  {
    id: 'd1',
    title: 'Live long',
    subtitle: 'Lorem ipsum dolor sit amet',
    thumbnail: imgPath.login, 
    duration: '3:45',
    size: '4.2 MB',
    downloadDate: '2024-01-15',
  },
  {
    id: 'd2',
    title: 'Sunset Romance',
    subtitle: 'Lorem ipsum dolor sit amet',
    thumbnail: imgPath.Splash,
    duration: '2:30',
    size: '3.1 MB',
    downloadDate: '2024-01-14',
  },
  {
    id: 'd3',
    title: 'Hilltop Dreams',
    subtitle: 'Lorem ipsum dolor sit amet',
    thumbnail: imgPath.logo,
    duration: '4:12',
    size: '5.8 MB',
    downloadDate: '2024-01-13',
  },
  {
    id: 'd4',
    title: 'Heart Bokeh',
    subtitle: 'Lorem ipsum dolor sit amet',
    thumbnail: imgPath.login,
    duration: '2:58',
    size: '3.9 MB',
    downloadDate: '2024-01-12',
  },
  {
    id: 'd5',
    title: 'Holding Hands',
    subtitle: 'Lorem ipsum dolor sit amet',
    thumbnail: imgPath.Splash,
    duration: '3:22',
    size: '4.5 MB',
    downloadDate: '2024-01-11',
  },
  {
    id: 'd6',
    title: 'Red Rose',
    subtitle: 'Lorem ipsum dolor sit amet',
    thumbnail: imgPath.logo,
    duration: '2:45',
    size: '3.7 MB',
    downloadDate: '2024-01-10',
  },
];

export const likedTracks = [
  {id: 't1', title: 'Dailamo Dailamo', artist: 'Sangeetha Rajeshwaran, Vijay Antony'},
  {id: 't2', title: 'Saara Kaattrae', artist: 'S.P. Balasubrahmanyam'},
  {id: 't3', title: 'Marundhaani', artist: 'Nakash Aziz , Anthony Daasan'},
  {id: 't4', title: 'Oru Devadhai', artist: 'Roopkumar Rathod', active: true},
  {id: 't5', title: 'Marundhaani', artist: 'Naksh Aziz , Anthony Daasan'},
  {id: 't6', title: 'Marundhaani', artist: 'Naksh Aziz , Anthony Daasan'},
  {id: 't7', title: 'Marundhaani', artist: 'Naksh Aziz , Anthony Daasan'},
  {id: 't8', title: 'Marundhaani', artist: 'Naksh Aziz , Anthony Daasan'},
];

export const topTabs = [
  {id: 'recommendation', title: 'Recommendation'},
  {id: 'trending', title: 'Trending'},
  {id: 'categories', title: 'Categories'},
  {id: 'beauty', title: 'Beauty'},
  {id: 'business', title: 'Business'},
];

export const recommendations = [
  {
    id: 'rec-1',
    title: 'Friday Party',
    subtitle: 'Party mood',
    cover: imgPath.login,
  },
  {
    id: 'rec-2',
    title: 'Saturday Party',
    subtitle: 'Party mood',
    cover: imgPath.Splash,
  },
  {
    id: 'rec-3',
    title: 'Chill Vibes',
    subtitle: 'Lo-fi',
    cover: imgPath.logo,
  },
];

export const recentPlays = [
  {
    id: 'rp-1',
    title: 'Mehaboooba',
    artist: 'Ananya Bhat',
    duration: '2:50',
    total: '3:50',
    thumb: imgPath.login,
  },
  {
    id: 'rp-2',
    title: 'Adiyee',
    artist: 'Dhibu Ninan',
    duration: '1:50',
    total: '3:50',
    thumb: imgPath.Splash,
  },
  {
    id: 'rp-3',
    title: 'Adi Penne',
    artist: 'Stephen',
    duration: '2:50',
    total: '3:50',
    thumb: imgPath.logo,
  },
];

export let profileData = {
  name: 'Vikashini vini',
  email: 'vikashini@example.com',
  subscription: 'Premium',
  totalDownloads: 156,
  totalLikes: 89,
  joinDate: '2023-06-15',
};

export const updateProfile = (newData) => {
  Object.assign(profileData, newData);
};

export const bottomTabData = [
  {
    id: 'home',
    title: 'Home',
    icon: Icons.home,
    activeIcon: Icons.Chome,
  },
  {
    id: 'likes',
    title: 'Likes',
    icon: Icons.heart,
    activeIcon: Icons.Cheart,
  },
  {
    id: 'playing',
    title: 'Playing',
    icon: Icons.vector,
    activeIcon: Icons.Cvector,
  },
  {
    id: 'downloads',
    title: 'Downloads',
    icon: Icons.download,
    activeIcon: Icons.Cdownload,
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: Icons.user,
    activeIcon: Icons.Cuser,
  },
];

export const authData = {
  loginPlaceholder: {
    email: 'Enter your email',
    password: 'Enter your password',
  },
  registerPlaceholder: {
    name: 'Enter your name',
    email: 'Enter your email',
    password: 'Enter your password',
    confirmPassword: 'Confirm your password',
  },
};

export const appSettings = {
  theme: 'dark',
  language: 'en',
  autoPlay: true,
  downloadQuality: 'high',
  notifications: true,
  offlineMode: false,
};

export const categories = [
  {id: 'c1', name: 'Pop', count: 125},
  {id: 'c2', name: 'Rock', count: 98},
  {id: 'c3', name: 'Hip Hop', count: 76},
  {id: 'c4', name: 'Classical', count: 54},
  {id: 'c5', name: 'Jazz', count: 43},
  {id: 'c6', name: 'Electronic', count: 67},
  {id: 'c7', name: 'Country', count: 32},
  {id: 'c8', name: 'R&B', count: 89},
];

export const playlists = [
  {
    id: 'p1',
    name: 'My Favorites',
    description: 'Songs I love the most',
    songCount: 25,
    cover: imgPath.login,
    isPublic: false,
  },
  {
    id: 'p2',
    name: 'Workout Mix',
    description: 'High energy songs for workouts',
    songCount: 18,
    cover: imgPath.Splash,
    isPublic: true,
  },
  {
    id: 'p3',
    name: 'Chill Vibes',
    description: 'Relaxing music for downtime',
    songCount: 32,
    cover: imgPath.logo,
    isPublic: true,
  },
];

export const searchHistory = [
  'Ed Sheeran',
  'Shape of You',
  'Perfect',
  'Thinking Out Loud',
  'Photograph',
  'Castle on the Hill',
  'Galway Girl',
  'Happier',
];

export const trendingSongs = [
  {
    id: 'tr1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    plays: '2.5M',
    rank: 1,
    thumbnail: imgPath.login,
  },
  {
    id: 'tr2',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    plays: '2.1M',
    rank: 2,
    thumbnail: imgPath.Splash,
  },
  {
    id: 'tr3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    plays: '1.9M',
    rank: 3,
    thumbnail: imgPath.logo,
  },
  {
    id: 'tr4',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    plays: '1.7M',
    rank: 4,
    thumbnail: imgPath.login,
  },
  {
    id: 'tr5',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    plays: '1.5M',
    rank: 5,
    thumbnail: imgPath.Splash,
  },
];
