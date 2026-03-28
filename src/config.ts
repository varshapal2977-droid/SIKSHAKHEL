// ============================================================================
// Sikshakhel - Gamified EdTech PWA for Rural Primary Education
// Classes 1-3 | Maths & EVS | NCERT Aligned
// ============================================================================

export interface SiteConfig {
  title: string;
  description: string;
  language: string;
}

export const siteConfig: SiteConfig = {
  title: "Sikshakhel - Fun Learning for Kids",
  description: "Sikshakhel is a habit-forming gamified learning app for children in Classes 1-3. Learn Maths and EVS through fun games, earn stars and badges, while parents track progress via WhatsApp.",
  language: "hi",
};

// ============================================================================
// Navigation Configuration
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
}

export interface NavigationConfig {
  logo: string;
  items: NavItem[];
}

export const navigationConfig: NavigationConfig = {
  logo: "Sikshakhel",
  items: [
    { label: "Home", href: "#hero" },
    { label: "Games", href: "#works" },
    { label: "Subjects", href: "#services" },
    { label: "Rewards", href: "#testimonials" },
    { label: "Parents", href: "#pricing" },
    { label: "Join", href: "#contact" },
  ],
};

// ============================================================================
// Hero Section Configuration
// ============================================================================

export interface HeroConfig {
  title: string;
  subtitle: string;
  backgroundImage: string;
  servicesLabel: string;
  copyright: string;
}

export const heroConfig: HeroConfig = {
  title: "Sikshakhel",
  subtitle: "सीखो खेल-खेल में! Learn with Fun!",
  backgroundImage: "/images/classroom.jpg",
  servicesLabel: "Maths | EVS | Games | Rewards",
  copyright: "© 2024 Sikshakhel - F-Society",
};

// ============================================================================
// About Section Configuration
// ============================================================================

export interface AboutConfig {
  titleLine1: string;
  titleLine2: string;
  description: string;
  image1: string;
  image1Alt: string;
  image2: string;
  image2Alt: string;
  authorImage: string;
  authorName: string;
  authorBio: string;
}

export const aboutConfig: AboutConfig = {
  titleLine1: "Every child deserves quality education",
  titleLine2: "even in rural India with limited resources...",
  description: "Sikshakhel is designed for rural families with low-end Android phones and intermittent internet. Our offline-first PWA helps children in Classes 1-3 learn Maths and EVS through short, fun game sessions. Parents receive daily WhatsApp updates showing progress, streaks, and rankings - turning learning into a daily habit!",
  image1: "/images/math-game.jpg",
  image1Alt: "Fun math learning game",
  image2: "/images/evs-game.jpg",
  image2Alt: "EVS learning adventure",
  authorImage: "/images/mascot-owl.png",
  authorName: "Guru Ji",
  authorBio: "Your friendly owl teacher who guides children through fun learning adventures! Guru Ji celebrates every achievement and keeps kids motivated with stars, badges, and exciting rewards.",
};

// ============================================================================
// Works Section Configuration (Learning Games)
// ============================================================================

export interface WorkItem {
  id: number;
  title: string;
  category: string;
  image: string;
}

export interface WorksConfig {
  title: string;
  subtitle: string;
  projects: WorkItem[];
}

export const worksConfig: WorksConfig = {
  title: "Fun Learning Games",
  subtitle: "50+ interactive games covering NCERT syllabus for Classes 1-3",
  projects: [
    { id: 1, title: "Number Bonds", category: "Maths - Class 1", image: "/images/hero-boy.png" },
    { id: 2, title: "Addition Adventure", category: "Maths - Class 2", image: "/images/hero-girl.png" },
    { id: 3, title: "Place Value Quest", category: "Maths - Class 3", image: "/images/math-game.jpg" },
    { id: 4, title: "Nature Explorer", category: "EVS - All Classes", image: "/images/evs-game.jpg" },
    { id: 5, title: "Subtraction Safari", category: "Maths - Class 2", image: "/images/mascot-owl.png" },
    { id: 6, title: "Shape Detective", category: "Maths - Class 1", image: "/images/classroom.jpg" },
  ],
};

// ============================================================================
// Services Section Configuration (Subjects)
// ============================================================================

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface ServicesConfig {
  title: string;
  subtitle: string;
  services: ServiceItem[];
}

export const servicesConfig: ServicesConfig = {
  title: "What Kids Learn",
  subtitle: "NCERT-aligned curriculum designed for Classes 1-3",
  services: [
    { 
      id: "01", 
      title: "Mathematics", 
      description: "Number bonds, addition, subtraction, place value, shapes, and more! Interactive games make math fun with instant feedback and visual learning aids.", 
      image: "/images/math-game.jpg" 
    },
    { 
      id: "02", 
      title: "EVS - Environmental Studies", 
      description: "Learn about plants, animals, family, food, water, and the environment around us. Perfect for curious young minds exploring their world.", 
      image: "/images/evs-game.jpg" 
    },
    { 
      id: "03", 
      title: "Hindi Language", 
      description: "All instructions and voice prompts in Hindi! Kids learn in their mother tongue while building foundational literacy skills.", 
      image: "/images/classroom.jpg" 
    },
    { 
      id: "04", 
      title: "Daily Habits", 
      description: "Build consistent learning habits with streaks, daily missions, and rewards. Just 5-10 minutes a day creates lasting educational impact!", 
      image: "/images/rewards.jpg" 
    },
  ],
};

// ============================================================================
// Testimonials Section Configuration (Rewards & Gamification)
// ============================================================================

export interface TestimonialItem {
  id: number;
  name: string;
  title: string;
  quote: string;
  image: string;
}

export interface TestimonialsConfig {
  title: string;
  testimonials: TestimonialItem[];
}

export const testimonialsConfig: TestimonialsConfig = {
  title: "Earn Rewards & Build Streaks!",
  testimonials: [
    { 
      id: 1, 
      name: "Daily Streaks", 
      title: "🔥 Keep the fire burning!", 
      quote: "Complete lessons every day to build your streak! The longer your streak, the bigger the rewards. Can you reach 30 days? 100 days? The sky's the limit!", 
      image: "/images/hero-boy.png" 
    },
    { 
      id: 2, 
      name: "Star Collection", 
      title: "⭐ Collect them all!", 
      quote: "Earn stars for every correct answer! Collect 3 stars per level by answering perfectly. Save stars to unlock cool avatars, backgrounds, and special badges!", 
      image: "/images/hero-girl.png" 
    },
    { 
      id: 3, 
      name: "Achievement Badges", 
      title: "🏆 Be a champion!", 
      quote: "Unlock special badges for milestones - First Perfect Score, Week Warrior, Math Master, Nature Expert, and more! Show off your collection to friends and family!", 
      image: "/images/rewards.jpg" 
    },
  ],
};

// ============================================================================
// Pricing Section Configuration (Subscription Plans)
// ============================================================================

export interface PricingPlan {
  id: number;
  name: string;
  price: number;
  unit: string;
  featured: boolean;
  features: string[];
}

export interface PricingConfig {
  title: string;
  subtitle: string;
  ctaButtonText: string;
  plans: PricingPlan[];
}

export const pricingConfig: PricingConfig = {
  title: "Affordable Learning for Every Family",
  subtitle: "Micro-payment plans designed for rural India. No expensive subscriptions!",
  ctaButtonText: "Get Started",
  plans: [
    { 
      id: 1, 
      name: "Daily Pass", 
      price: 5, 
      unit: "per day", 
      featured: false, 
      features: [
        "Access all Maths games",
        "5 EVS lessons",
        "Basic progress tracking",
        "Daily streak counter"
      ] 
    },
    { 
      id: 2, 
      name: "Weekly Pass", 
      price: 29, 
      unit: "per week", 
      featured: true, 
      features: [
        "All Daily Pass benefits",
        "Unlimited game access",
        "Parent WhatsApp reports",
        "Bonus star rewards",
        "Special weekly badges"
      ] 
    },
    { 
      id: 3, 
      name: "Monthly Premium", 
      price: 99, 
      unit: "per month", 
      featured: false, 
      features: [
        "All Weekly Pass benefits",
        "PDF progress reports",
        "Village leaderboard",
        "Premium avatar unlocks",
        "Priority customer support"
      ] 
    },
  ],
};

// ============================================================================
// FAQ Section Configuration
// ============================================================================

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQConfig {
  title: string;
  faqs: FAQItem[];
}

export const faqConfig: FAQConfig = {
  title: "Parents' Questions",
  faqs: [
    { 
      question: "How does Sikshakhel work?", 
      answer: "Sikshakhel is a Progressive Web App (PWA) that works on any Android phone browser. Children play short 3-5 minute learning games daily, earning stars and building streaks. Parents receive WhatsApp updates showing progress, time spent, and rankings among village children." 
    },
    { 
      question: "Does it work without internet?", 
      answer: "Yes! Sikshakhel is designed to work offline. Once you load the app with internet, games and lessons are cached locally. Progress is saved on the device and synced when internet is available. Perfect for areas with poor connectivity!" 
    },
    { 
      question: "What subjects are covered?", 
      answer: "We cover NCERT syllabus for Mathematics (number bonds, addition, subtraction, place value) and Environmental Studies (plants, animals, family, food, water) for Classes 1-3. All content is in Hindi with voice prompts." 
    },
    { 
      question: "How do I track my child's progress?", 
      answer: "Parents receive daily WhatsApp messages showing: topics completed, time spent learning, streak count, stars earned, and ranking among other children in your village. Weekly PDF reports are also available with Premium plans." 
    },
    { 
      question: "Is it safe for children?", 
      answer: "Absolutely! Sikshakhel has no ads, no external links, and no in-app purchases that children can accidentally make. All content is child-safe and educational. Parental consent is required for all payments." 
    },
  ],
};

// ============================================================================
// Blog Section Configuration (Success Stories & Updates)
// ============================================================================

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  image: string;
  category: string;
}

export interface BlogConfig {
  title: string;
  subtitle: string;
  allPostsLabel: string;
  readMoreLabel: string;
  readTimePrefix: string;
  posts: BlogPost[];
}

export const blogConfig: BlogConfig = {
  title: "Success Stories",
  subtitle: "See how Sikshakhel is transforming education in rural India",
  allPostsLabel: "All Stories",
  readMoreLabel: "Read More",
  readTimePrefix: "Read ",
  posts: [
    { 
      id: 1, 
      title: "Rahul's 50-Day Streak Journey", 
      excerpt: "Meet Rahul from a village in Uttar Pradesh who completed 50 days of continuous learning. His math scores improved from 40% to 85% in just two months!", 
      readTime: "3 min", 
      date: "Mar 20, 2024", 
      image: "/images/hero-boy.png", 
      category: "Success Story" 
    },
    { 
      id: 2, 
      title: "How WhatsApp Reports Help Parents", 
      excerpt: "Parents love receiving daily updates! Sunita ji shares how seeing her daughter's progress every evening motivates the whole family to support learning.", 
      readTime: "4 min", 
      date: "Mar 15, 2024", 
      image: "/images/happy-parent.jpg", 
      category: "Parent Story" 
    },
    { 
      id: 3, 
      title: "New Games Added: Subtraction Safari", 
      excerpt: "We're excited to launch 10 new subtraction games! Help your child master borrowing and regrouping with fun animal-themed adventures.", 
      readTime: "2 min", 
      date: "Mar 10, 2024", 
      image: "/images/math-game.jpg", 
      category: "Update" 
    },
  ],
};

// ============================================================================
// Contact Section Configuration
// ============================================================================

export interface ContactFormOption {
  value: string;
  label: string;
}

export interface ContactConfig {
  title: string;
  subtitle: string;
  nameLabel: string;
  emailLabel: string;
  projectTypeLabel: string;
  projectTypePlaceholder: string;
  projectTypeOptions: ContactFormOption[];
  messageLabel: string;
  submitButtonText: string;
  image: string;
}

export const contactConfig: ContactConfig = {
  title: "Start Your Child's Learning Journey",
  subtitle: "Join thousands of families across rural India making education fun and affordable!",
  nameLabel: "Parent's Name *",
  emailLabel: "Mobile Number *",
  projectTypeLabel: "Child's Class",
  projectTypePlaceholder: "Select class...",
  projectTypeOptions: [
    { value: "class1", label: "Class 1" },
    { value: "class2", label: "Class 2" },
    { value: "class3", label: "Class 3" },
  ],
  messageLabel: "Your Message (Optional)",
  submitButtonText: "Start Free Trial",
  image: "/images/parent-dashboard.jpg",
};

// ============================================================================
// Footer Configuration
// ============================================================================

export interface FooterLink {
  label: string;
  href: string;
  icon?: string;
}

export interface FooterConfig {
  marqueeText: string;
  marqueeHighlightChars: string[];
  navLinks1: FooterLink[];
  navLinks2: FooterLink[];
  ctaText: string;
  ctaHref: string;
  copyright: string;
  tagline: string;
}

export const footerConfig: FooterConfig = {
  marqueeText: "Every Child Deserves Quality Education",
  marqueeHighlightChars: ["C", "E"],
  navLinks1: [
    { label: "Home", href: "#hero" },
    { label: "Games", href: "#works" },
    { label: "Subjects", href: "#services" },
    { label: "Rewards", href: "#testimonials" },
  ],
  navLinks2: [
    { label: "WhatsApp", href: "#", icon: "MessageCircle" },
    { label: "YouTube", href: "#", icon: "Youtube" },
    { label: "Instagram", href: "#", icon: "Instagram" },
  ],
  ctaText: "Start Free Trial",
  ctaHref: "#contact",
  copyright: "© 2024 Sikshakhel by F-Society. All rights reserved.",
  tagline: "Making education accessible for every child",
};
