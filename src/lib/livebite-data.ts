export type Creator = {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  subs: string;
  category: string;
  dish: string;
  price: number;
  cover: string;
  viewers: number;
  ordersLeft: number;
  ordersTotal: number;
  countdown: string;
  rating: number;
  bio: string;
  story: string;
  socials: { ig: string; tt: string };
  menu: MenuItem[];
};

export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  emoji: string;
  left: number;
  total: number;
};

export const CATEGORIES = [
  "All Drops",
  "Smash Burgers",
  "Artisan Pizza",
  "Pop-Up Bakery",
  "Vegan Hits",
  "Tacos",
];

export const CREATORS: Creator[] = [
  {
    id: "chefmarco",
    handle: "@ChefMarco",
    name: "Marco Reyes",
    avatar: "https://i.pravatar.cc/120?img=13",
    subs: "48.2k",
    category: "Tacos",
    dish: "Birria Tacos w/ Consommé",
    price: 14,
    cover:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80",
    viewers: 1243,
    ordersLeft: 18,
    ordersTotal: 50,
    countdown: "42:18",
    rating: 4.9,
    bio: "Third-gen taquero from Jalisco. Slow-braised birria, live every Friday.",
    story:
      "Marco learned birria from his grandmother in Guadalajara. Every drop is 6 hours of slow-cooked chuck roast, hand-pressed tortillas, and his family's guajillo consommé.",
    socials: { ig: "chefmarco.mx", tt: "chefmarco" },
    menu: [
      { id: "m1", name: "Birria Tacos (3)", desc: "Slow-braised beef, melted cheese, side of consommé", price: 14, emoji: "🌮", left: 18, total: 50 },
      { id: "m2", name: "Quesabirria Combo", desc: "Two quesabirrias + rice + beans", price: 17, emoji: "🧀", left: 9, total: 30 },
      { id: "m3", name: "Consommé Cup", desc: "16oz rich guajillo broth", price: 5, emoji: "🥣", left: 22, total: 40 },
    ],
  },
  {
    id: "smashburgerking",
    handle: "@SmashBurgerKing",
    name: "Devon Park",
    avatar: "https://i.pravatar.cc/120?img=68",
    subs: "112k",
    category: "Smash Burgers",
    dish: "Double Smash w/ American",
    price: 13,
    cover:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80",
    viewers: 2841,
    ordersLeft: 7,
    ordersTotal: 40,
    countdown: "12:04",
    rating: 4.8,
    bio: "Backyard smash purist. 80/20 chuck, one flip, no shortcuts.",
    story: "Devon started smashing burgers on a Blackstone in his driveway. Now he runs Brooklyn's most-watched burger drop.",
    socials: { ig: "smashburgerking", tt: "smashburgerking" },
    menu: [
      { id: "s1", name: "The Double", desc: "Two smashed patties, American, house sauce, brioche", price: 13, emoji: "🍔", left: 7, total: 40 },
      { id: "s2", name: "Bacon Smash", desc: "Double smash + candied bacon + smoked cheddar", price: 15, emoji: "🥓", left: 12, total: 30 },
      { id: "s3", name: "Fry Basket", desc: "Crispy shoestring, rosemary salt", price: 6, emoji: "🍟", left: 24, total: 50 },
    ],
  },
  {
    id: "pizzaluca",
    handle: "@PizzaLuca",
    name: "Luca Bianchi",
    avatar: "https://i.pravatar.cc/120?img=52",
    subs: "76.5k",
    category: "Artisan Pizza",
    dish: "72hr Cold-Ferment Margherita",
    price: 18,
    cover:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80",
    viewers: 987,
    ordersLeft: 22,
    ordersTotal: 35,
    countdown: "1:04:22",
    rating: 4.9,
    bio: "Neapolitan-trained. Wood-fired in a converted horse trailer.",
    story: "Luca imports Caputo 00 and San Marzanos. Every pie is fired 90 seconds at 900°F.",
    socials: { ig: "pizzaluca", tt: "pizzaluca" },
    menu: [
      { id: "p1", name: "Margherita DOP", desc: "San Marzano, fior di latte, basil, EVOO", price: 18, emoji: "🍕", left: 22, total: 35 },
      { id: "p2", name: "Diavola", desc: "Spicy soppressata, chili honey, mozzarella", price: 21, emoji: "🌶️", left: 10, total: 20 },
    ],
  },
  {
    id: "sourdoughsam",
    handle: "@SourdoughSam",
    name: "Samira Okafor",
    avatar: "https://i.pravatar.cc/120?img=45",
    subs: "34.1k",
    category: "Pop-Up Bakery",
    dish: "Miso Chocolate Chip Cookie Box",
    price: 16,
    cover:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&q=80",
    viewers: 612,
    ordersLeft: 31,
    ordersTotal: 60,
    countdown: "28:47",
    rating: 5.0,
    bio: "Naturally leavened everything. Weekend pop-ups only.",
    story: "Sam bakes out of a tiny commercial kitchen in Oakland. Her miso cookies sell out in under 20 minutes every drop.",
    socials: { ig: "sourdoughsam", tt: "sourdoughsam" },
    menu: [
      { id: "b1", name: "Miso Cookie Box (6)", desc: "Brown butter, white miso, dark chocolate chunks", price: 16, emoji: "🍪", left: 31, total: 60 },
      { id: "b2", name: "Sourdough Loaf", desc: "72hr cold-fermented country boule", price: 12, emoji: "🍞", left: 8, total: 20 },
    ],
  },
  {
    id: "veganvibes",
    handle: "@VeganVibes",
    name: "Iris Chen",
    avatar: "https://i.pravatar.cc/120?img=32",
    subs: "89.3k",
    category: "Vegan Hits",
    dish: "Buffalo Cauli Bowl",
    price: 15,
    cover:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
    viewers: 1489,
    ordersLeft: 14,
    ordersTotal: 45,
    countdown: "51:33",
    rating: 4.7,
    bio: "Plant-based comfort food, zero compromise on flavor.",
    story: "Iris left a fine-dining line to build a vegan comfort-food brand fans watch every night.",
    socials: { ig: "veganvibes", tt: "veganvibes" },
    menu: [
      { id: "v1", name: "Buffalo Cauli Bowl", desc: "Crispy cauliflower, ranch, quinoa, greens", price: 15, emoji: "🥦", left: 14, total: 45 },
      { id: "v2", name: "Smoky Jackfruit Taco (2)", desc: "House slaw, chipotle crema (vegan)", price: 12, emoji: "🌮", left: 19, total: 40 },
    ],
  },
  {
    id: "ramenrei",
    handle: "@RamenRei",
    name: "Rei Tanaka",
    avatar: "https://i.pravatar.cc/120?img=8",
    subs: "58.7k",
    category: "All Drops",
    dish: "Tonkotsu Ramen",
    price: 17,
    cover:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80",
    viewers: 2103,
    ordersLeft: 5,
    ordersTotal: 25,
    countdown: "18:11",
    rating: 4.9,
    bio: "18-hour tonkotsu broth. Every bowl matters.",
    story: "Rei trained in Fukuoka. His broth simmers for 18 hours before each stream.",
    socials: { ig: "ramenrei", tt: "ramenrei" },
    menu: [
      { id: "r1", name: "Classic Tonkotsu", desc: "Rich pork broth, chashu, ajitama, negi", price: 17, emoji: "🍜", left: 5, total: 25 },
      { id: "r2", name: "Spicy Miso", desc: "Fermented chili miso, corn, butter", price: 18, emoji: "🌶️", left: 11, total: 20 },
    ],
  },
];

export const CHAT_ACTIVITY = [
  "Sarah K. just ordered 2x Birria Tacos! 🌮",
  "🔥 Mike ordered a Double Smash",
  "Priya J. joined the stream",
  "Devon added a limited Bacon Smash — 12 left",
  "Order #103 is out for delivery 🛵",
  "Ali M. tipped $5 to @ChefMarco",
  "Nina R. ordered the Miso Cookie Box 🍪",
  "🚨 Only 7 doubles left!",
  "Chris P. just subscribed to @ChefMarco",
  "Batch #2 is on the flat-top 🔥",
];

export type DailyPost = {
  id: string;
  creatorId: string;
  handle: string;
  avatar: string;
  image: string;
  caption: string;
  kind: "photo" | "clip" | "drop";
  likes: number;
  comments: number;
  duration?: string;
  dropTime?: string;
  price?: number;
};

export const DAILY_FEED: DailyPost[] = [
  {
    id: "d1",
    creatorId: "chefmarco",
    handle: "@ChefMarco",
    avatar: "https://i.pravatar.cc/120?img=13",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
    caption: "Tomorrow's birria batch is marinating overnight 🌶️",
    kind: "drop",
    likes: 1284,
    comments: 92,
    dropTime: "Tomorrow · 6:00 PM",
    price: 14,
  },
  {
    id: "d2",
    creatorId: "smashburgerking",
    handle: "@SmashBurgerKing",
    avatar: "https://i.pravatar.cc/120?img=68",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
    caption: "That crust though 🔥",
    kind: "clip",
    likes: 4210,
    comments: 318,
    duration: "0:15",
  },
  {
    id: "d3",
    creatorId: "sourdoughsam",
    handle: "@SourdoughSam",
    avatar: "https://i.pravatar.cc/120?img=45",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
    caption: "Miso cookie dough — resting 48hrs",
    kind: "photo",
    likes: 872,
    comments: 41,
  },
  {
    id: "d4",
    creatorId: "pizzaluca",
    handle: "@PizzaLuca",
    avatar: "https://i.pravatar.cc/120?img=52",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    caption: "New Diavola drop — Saturday night 🍕",
    kind: "drop",
    likes: 2103,
    comments: 156,
    dropTime: "Sat · 8:00 PM",
    price: 21,
  },
  {
    id: "d5",
    creatorId: "ramenrei",
    handle: "@RamenRei",
    avatar: "https://i.pravatar.cc/120?img=8",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
    caption: "18hr tonkotsu, hitting the pot now",
    kind: "clip",
    likes: 3421,
    comments: 210,
    duration: "0:12",
  },
  {
    id: "d6",
    creatorId: "veganvibes",
    handle: "@VeganVibes",
    avatar: "https://i.pravatar.cc/120?img=32",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    caption: "New Buffalo Cauli sauce test 🌱",
    kind: "photo",
    likes: 1567,
    comments: 88,
  },
  {
    id: "d7",
    creatorId: "chefmarco",
    handle: "@ChefMarco",
    avatar: "https://i.pravatar.cc/120?img=13",
    image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800&q=80",
    caption: "Consommé test round 3 — best one yet",
    kind: "clip",
    likes: 921,
    comments: 47,
    duration: "0:15",
  },
  {
    id: "d8",
    creatorId: "sourdoughsam",
    handle: "@SourdoughSam",
    avatar: "https://i.pravatar.cc/120?img=45",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    caption: "Sunday sourdough pop-up — pre-orders open",
    kind: "drop",
    likes: 1102,
    comments: 63,
    dropTime: "Sun · 10:00 AM",
    price: 12,
  },
];

export function getCreator(id: string) {
  return CREATORS.find((c) => c.id === id) ?? CREATORS[0];
}

