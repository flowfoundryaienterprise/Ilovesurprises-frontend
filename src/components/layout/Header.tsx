import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  User,
  MapPin,
  ChevronDown,
  Sparkles,
  X,
  Star,
  Truck,
  Gift,
  Flame,
  LogOut,
  PackageCheck,
  Heart,
  Users,
  Store,
  Menu,
  Home as HomeIcon,
  LayoutGrid,
  Info,
  Headphones,
  ArrowRight,
  Phone,
  Mail,
  Mic,
  Volume2,
  Megaphone,
  Gem,
  Zap,
} from 'lucide-react';
import type { UserProfile, Product } from '../../types';
import { productService } from '../../services/productService';
import {
  NAVIGATION_CATEGORIES,
  type NavigationCategory,
  type SubCategoryItem,
} from '../../data/navigationCategories';

export interface HeaderProps {
  cartCount?: number;
  cartSubtotal?: number;
  user?: UserProfile | null;
  activeView?:
    | 'home'
    | 'shop'
    | 'collection'
    | 'categories'
    | 'product-details'
    | 'checkout'
    | 'order-confirmation'
    | 'account'
    | 'affiliate'
    | 'about'
    | 'contact'
    | 'rewards'
    | 'admin'
    | 'appraisal'
    | 'refund-policy'
    | 'terms'
    | 'official-rules'
    | 'shipping-policy'
    | 'privacy'
    | 'faqs';
  onOpenCart?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'forgot') => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onNavigate?: (
    route:
      | 'home'
      | 'shop'
      | 'categories'
      | 'affiliate'
      | 'about'
      | 'contact'
      | 'rewards'
      | 'admin'
      | 'appraisal'
      | 'refund-policy'
      | 'terms'
      | 'official-rules'
      | 'shipping-policy'
      | 'privacy'
      | 'faqs'
  ) => void;
  onNavigateToAccount?: (tab?: 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings' | 'affiliate') => void;
  onNavigateToAffiliate?: () => void;
  onOpenSubscription?: () => void;
  onNavigateToAdmin?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
  onSelectCollection?: (handle: string) => void;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  targetSectionId: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_LINKS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', targetSectionId: 'hero', icon: HomeIcon },
  { id: 'shop', label: 'Shop', href: '/shop', targetSectionId: 'featured', icon: ShoppingBag },
  { id: 'categories', label: 'Categories', href: '/categories', targetSectionId: 'categories', icon: LayoutGrid },
  { id: 'appraisal', label: 'Appraisal', href: '/appraise-your-jewelry', targetSectionId: 'appraisal', icon: Gem },
  { id: 'rewards', label: 'VIP Rewards', href: '/rewards', targetSectionId: 'rewards', icon: Star },
  { id: 'affiliate', label: 'Affiliate', href: '/affiliate', targetSectionId: 'affiliate', icon: Users },
  { id: 'about', label: 'About', href: '/about', targetSectionId: 'about', icon: Info },
  { id: 'contact', label: 'Contact', href: '/contact', targetSectionId: 'contact', icon: Headphones },
];

const availableLocations = [
  { name: 'New York', zip: '10001', state: 'NY', eta: '2-3 Days', tag: 'Fast Dispatch' },
  { name: 'Los Angeles', zip: '90001', state: 'CA', eta: '2-3 Days', tag: 'Fast Dispatch' },
  { name: 'Chicago', zip: '60601', state: 'IL', eta: '2 Days', tag: 'Next Day Available' },
  { name: 'Austin', zip: '78701', state: 'TX', eta: '2 Days', tag: 'Express Hub' },
  { name: 'Miami', zip: '33101', state: 'FL', eta: '2-3 Days', tag: 'Fast Dispatch' },
  { name: 'Seattle', zip: '98101', state: 'WA', eta: '3 Days', tag: 'Standard Transit' },
];

const POPULAR_TAGS = [
  'Cash Candles',
  'Diamond Jewelry',
  'Cola Soda Candle',
  'Bath Bomb Cash',
  'Citrus Fizz',
  'Wax Melts',
];

export interface SearchTypingSuggestion {
  prefix: string;
  highlight: string;
  query: string;
}

const SEARCH_SUGGESTIONS: SearchTypingSuggestion[] = [
  { prefix: 'Search for', highlight: 'Luxury Fizzy Cash Bath Bombs', query: 'Cash Bath Bombs' },
  { prefix: 'Search for', highlight: 'Cash Candles ($2-$2,500 Inside)', query: 'Cash Candles' },
  { prefix: 'Search for', highlight: 'Diamond Ring Reveal Candles', query: 'Diamond Ring Candles' },
  { prefix: 'Search for', highlight: 'Goat Milk Real Cash Soaps', query: 'Goat Milk Cash Money Soaps' },
  { prefix: 'Search for', highlight: 'Scented Aroma Wax Melts', query: 'Wax Melts' },
  { prefix: 'Search for', highlight: 'Belgian Chocolates with Cash', query: 'Chocolates' },
  { prefix: 'Search for', highlight: 'Zodiac Birthdate Candles', query: 'Zodiac Candles' },
  { prefix: 'Search for', highlight: 'Sensory Gourmet Slimes', query: 'Slimes' },
  { prefix: 'Search for', highlight: 'Certified Gemstone Jewelry', query: 'Jewelry' },
  { prefix: 'Search for', highlight: 'Cereal Bowl Scented Candles', query: 'Cereal Bowl Candles' },
];

export const Header: React.FC<HeaderProps> = ({
  cartCount = 0,
  cartSubtotal: _cartSubtotal = 0,
  user = null,
  activeView,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onSearch,
  onNavigate,
  onNavigateToAccount,
  onNavigateToAffiliate,
  onOpenSubscription,
  onNavigateToAdmin,
  onSelectProduct,
  onSelectCategory,
  onSelectCollection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const activeSearchIdRef = useRef(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const [typedPlaceholderText, setTypedPlaceholderText] = useState('');
  const [isTypingDeleting, setIsTypingDeleting] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentLoc] = useState(availableLocations[0]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClosingMobileMenu, setIsClosingMobileMenu] = useState(false);
  const mobileMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_activeNavId, setActiveNavId] = useState<string>('home');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState<string | null>(null);
  const [displayedMegaCategory, setDisplayedMegaCategory] = useState<string | null>(null);
  const megaMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  // Real-time flash sale announcement countdown timer
  const [topCountdownSecs, setTopCountdownSecs] = useState(() => {
    const now = Date.now();
    const cycleDuration = 6 * 3600 * 1000;
    return Math.floor((cycleDuration - (now % cycleDuration)) / 1000);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTopCountdownSecs((prev) => (prev > 1 ? prev - 1 : 6 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const topTimerHours = String(Math.floor(topCountdownSecs / 3600)).padStart(2, '0');
  const topTimerMinutes = String(Math.floor((topCountdownSecs % 3600) / 60)).padStart(2, '0');
  const topTimerSeconds = String(topCountdownSecs % 60).padStart(2, '0');

  // Typewriter Search Bar Animation: Types letters out, holds, then backspaces to next
  useEffect(() => {
    if (isDesktopSearchFocused || isMobileSearchFocused || searchQuery.trim().length > 0) return;

    const currentItem = SEARCH_SUGGESTIONS[searchPlaceholderIndex];
    const targetText = currentItem?.highlight || '';

    let timeout: ReturnType<typeof setTimeout>;

    if (!isTypingDeleting) {
      if (typedPlaceholderText.length < targetText.length) {
        timeout = setTimeout(() => {
          setTypedPlaceholderText(targetText.slice(0, typedPlaceholderText.length + 1));
        }, 45); // Typing speed
      } else {
        timeout = setTimeout(() => {
          setIsTypingDeleting(true);
        }, 2200); // Hold time when full word typed
      }
    } else {
      if (typedPlaceholderText.length > 0) {
        timeout = setTimeout(() => {
          setTypedPlaceholderText(targetText.slice(0, typedPlaceholderText.length - 1));
        }, 22); // Fast backspace
      } else {
        timeout = setTimeout(() => {
          setIsTypingDeleting(false);
          setSearchPlaceholderIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
        }, 150);
      }
    }

    return () => clearTimeout(timeout);
  }, [typedPlaceholderText, isTypingDeleting, searchPlaceholderIndex, isDesktopSearchFocused, isMobileSearchFocused, searchQuery]);

  const handleMegaEnter = (catId: string) => {
    if (megaMenuTimerRef.current) {
      clearTimeout(megaMenuTimerRef.current);
      megaMenuTimerRef.current = null;
    }
    if (megaMenuCloseTimerRef.current) {
      clearTimeout(megaMenuCloseTimerRef.current);
      megaMenuCloseTimerRef.current = null;
    }
    setActiveMegaCategory(catId);
    setDisplayedMegaCategory(catId);
  };

  const handleMegaLeave = () => {
    if (megaMenuTimerRef.current) {
      clearTimeout(megaMenuTimerRef.current);
    }
    megaMenuTimerRef.current = setTimeout(() => {
      setActiveMegaCategory(null);
      if (megaMenuCloseTimerRef.current) {
        clearTimeout(megaMenuCloseTimerRef.current);
      }
      megaMenuCloseTimerRef.current = setTimeout(() => {
        setDisplayedMegaCategory(null);
      }, 350);
    }, 100);
  };

  const handleMegaMenuPanelEnter = () => {
    if (megaMenuTimerRef.current) {
      clearTimeout(megaMenuTimerRef.current);
      megaMenuTimerRef.current = null;
    }
    if (megaMenuCloseTimerRef.current) {
      clearTimeout(megaMenuCloseTimerRef.current);
      megaMenuCloseTimerRef.current = null;
    }
    if (displayedMegaCategory && !activeMegaCategory) {
      setActiveMegaCategory(displayedMegaCategory);
    }
  };

  const handleCategoryClick = (cat: NavigationCategory) => {
    if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
    if (megaMenuCloseTimerRef.current) clearTimeout(megaMenuCloseTimerRef.current);
    setActiveMegaCategory(null);
    setDisplayedMegaCategory(null);
    closeMobileMenu();
    if (cat.isDirectLink) {
      if (cat.slug === 'home') {
        setSearchQuery('');
        onNavigate?.('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (cat.slug === 'affiliate') {
        if (onNavigateToAffiliate) {
          onNavigateToAffiliate();
        } else {
          onNavigate?.('affiliate');
        }
      } else if (cat.slug === 'contact') {
        onNavigate?.('contact');
      } else if (cat.slug === 'appraise-your-jewelry' || cat.id === 'appraisal') {
        onNavigate?.('appraisal');
      }
      return;
    }

    if (onSelectCollection && cat.slug && cat.slug !== 'shop') {
      onSelectCollection(cat.slug);
      return;
    }

    if (onSelectCategory) {
      onSelectCategory(cat.viewAllCategory || cat.name);
    } else {
      onNavigate?.('shop');
    }
  };

  const handleSubCategoryClick = (_cat: NavigationCategory, sub: SubCategoryItem) => {
    if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
    if (megaMenuCloseTimerRef.current) clearTimeout(megaMenuCloseTimerRef.current);
    setActiveMegaCategory(null);
    setDisplayedMegaCategory(null);
    closeMobileMenu();

    if (onSelectCollection && sub.slug) {
      onSelectCollection(sub.slug);
      return;
    }

    if (onSelectCategory) {
      onSelectCategory(sub.name);
    } else if (onSearch) {
      onSearch(sub.name);
    } else {
      onNavigate?.('shop');
    }
  };

  // Unified 144Hz-optimized passive scroll handler with requestAnimationFrame throttling
  useEffect(() => {
    let ticking = false;
    let rafId = 0;

    const updateScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY > 15;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));

      const headerOffset = 140;
      for (let i = NAV_LINKS.length - 1; i >= 0; i--) {
        const item = NAV_LINKS[i];
        const el = document.getElementById(item.targetSectionId);
        if (el) {
          const top = el.offsetTop - headerOffset;
          if (scrollY >= top) {
            setActiveNavId((prev) => (prev !== item.id ? item.id : prev));
            break;
          }
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafId = window.requestAnimationFrame(updateScroll);
      }
    };

    updateScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Track if current visitor or logged-in user is an active subscribed consultant
  const [isConsultantSubscribed, setIsConsultantSubscribed] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !user) return false;
    return (
      user.role === 'representative' ||
      localStorage.getItem('ils_consultant_subscribed') === 'true'
    );
  });

  useEffect(() => {
    const checkStatus = () => {
      if (!user) {
        setIsConsultantSubscribed(false);
        return;
      }
      const isSub = (
        user.role === 'representative' ||
        localStorage.getItem('ils_consultant_subscribed') === 'true'
      );
      setIsConsultantSubscribed(isSub);
    };
    checkStatus();
    window.addEventListener('ils_consultant_subscribed', checkStatus);
    window.addEventListener('ilovesurprises_user_updated', checkStatus);
    window.addEventListener('storage', checkStatus);
    return () => {
      window.removeEventListener('ils_consultant_subscribed', checkStatus);
      window.removeEventListener('ilovesurprises_user_updated', checkStatus);
      window.removeEventListener('storage', checkStatus);
    };
  }, [user]);

  // Keyboard shortcut: Ctrl+K or Cmd+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const desktopNavRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const desktopSearchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Asynchronous catalog search with race condition prevention and debouncing
  useEffect(() => {
    const q = searchQuery.trim();
    const searchId = ++activeSearchIdRef.current;

    if (!q) {
      productService.getFeaturedProducts(8).then((featured) => {
        if (searchId === activeSearchIdRef.current) {
          setMatchingProducts(featured);
          setIsSearching(false);
        }
      });
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      productService
        .searchProducts(q, 8)
        .then((results) => {
          if (searchId === activeSearchIdRef.current) {
            setMatchingProducts(results);
            setIsSearching(false);
          }
        })
        .catch((err) => {
          if (searchId === activeSearchIdRef.current) {
            console.warn('Navbar search error:', err);
            setIsSearching(false);
          }
        });
    }, 220);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Open Mobile Menu safely with smooth entry transition
  const openMobileMenu = () => {
    if (mobileMenuCloseTimerRef.current) {
      clearTimeout(mobileMenuCloseTimerRef.current);
      mobileMenuCloseTimerRef.current = null;
    }
    setIsClosingMobileMenu(false);
    setIsMobileMenuOpen(true);
    setIsMobileSearchOpen(false);
    setIsSearchOpen(false);
  };

  // Close Mobile Menu with smooth sliding exit transition
  const closeMobileMenu = useCallback((immediate = false) => {
    if (immediate) {
      if (mobileMenuCloseTimerRef.current) {
        clearTimeout(mobileMenuCloseTimerRef.current);
        mobileMenuCloseTimerRef.current = null;
      }
      setIsMobileMenuOpen(false);
      setIsClosingMobileMenu(false);
      return;
    }
    if (isClosingMobileMenu || !isMobileMenuOpen) return;
    setIsClosingMobileMenu(true);
    mobileMenuCloseTimerRef.current = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsClosingMobileMenu(false);
      mobileMenuCloseTimerRef.current = null;
    }, 280);
  }, [isClosingMobileMenu, isMobileMenuOpen]);

  // Prevent background scroll while mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen || isClosingMobileMenu) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen, isClosingMobileMenu]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (mobileMenuCloseTimerRef.current) {
        clearTimeout(mobileMenuCloseTimerRef.current);
      }
    };
  }, []);

  // Close Voice Modal safely
  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  };

  // Handle device hardware return/back button (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      if (isVoiceModalOpen) {
        closeVoiceModal();
      }
      if (isSearchOpen) {
        setIsSearchOpen(false);
      }
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSearchOpen, isMobileMenuOpen, isVoiceModalOpen, isListening]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        setActiveMegaCategory(null);
      }
      const isInsideDesktopSearch = desktopSearchContainerRef.current?.contains(e.target as Node);
      const isInsideMobileSearch = mobileSearchContainerRef.current?.contains(e.target as Node);
      if (!isInsideDesktopSearch && !isInsideMobileSearch) {
        setIsSearchOpen(false);
        setIsDesktopSearchFocused(false);
        setIsMobileSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility: Close mobile drawer, search popup, and voice modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        closeVoiceModal();
        closeMobileMenu();
        setIsUserMenuOpen(false);
        setActiveMegaCategory(null);
      }
      // Quick search shortcut (/)
      if (e.key === '/' && !isSearchOpen && !isVoiceModalOpen && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          if (window.innerWidth >= 1024) {
            desktopSearchInputRef.current?.focus();
          } else {
            mobileSearchInputRef.current?.focus();
          }
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isSearchOpen, isVoiceModalOpen, closeMobileMenu]);

  // Auto-focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        if (window.innerWidth >= 1024) {
          desktopSearchInputRef.current?.focus();
        } else {
          mobileSearchInputRef.current?.focus();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Helper to scroll to and highlight a product or section
  const scrollToProductOrFeatured = (productId?: string) => {
    setTimeout(() => {
      if (productId) {
        const productEl = document.getElementById(`product-${productId}`);
        if (productEl) {
          const navOffset = 90;
          const elementTop = productEl.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, elementTop - navOffset),
            behavior: 'smooth',
          });
          productEl.classList.add('ring-4', 'ring-[#D30915]', 'scale-[1.02]', 'transition-all');
          setTimeout(() => {
            productEl.classList.remove('ring-4', 'ring-[#D30915]', 'scale-[1.02]');
          }, 2400);
          return;
        }
      }

      const targetEl = document.getElementById('featured');
      if (targetEl) {
        const navOffset = 90;
        const elementTop = targetEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementTop - navOffset),
          behavior: 'smooth',
        });
      }
    }, 120);
  };

  // Execute Search action
  const executeSearch = (queryToSearch?: string) => {
    let q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) {
      // Fallback: If user submits empty search, query current rotating suggestion
      const currentSuggestion = SEARCH_SUGGESTIONS[searchPlaceholderIndex];
      q = currentSuggestion?.query || 'Cash Candles';
      setSearchQuery(q);
    }

    setIsSearchOpen(false);
    setIsDesktopSearchFocused(false);
    setIsMobileSearchFocused(false);
    closeVoiceModal();
    closeMobileMenu();

    // If an exact matching product is in the current search results, open it directly
    const exactMatch = matchingProducts.find(
      (p) => p.name.toLowerCase() === q.toLowerCase()
    );
    if (exactMatch && onSelectProduct) {
      onSelectProduct(exactMatch);
      return;
    }

    // Otherwise trigger onSearch (opens Shop page with search query)
    onSearch?.(q);
  };

  // Web Speech API Voice Search Handler (With YouTube-style Animation Modal)
  const startVoiceSearch = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    setIsVoiceModalOpen(true);
    setVoiceFeedback('Listening...');

    if (!SpeechRecognition) {
      setVoiceFeedback('Voice recognition is not supported in this browser. Try on Chrome, Edge, or Android.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening... Say something');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setSearchQuery(transcript);
          setVoiceFeedback(transcript);

          const isFinal = event.results?.[0]?.isFinal;
          if (isFinal) {
            onSearch?.(transcript);
            setTimeout(() => {
              executeSearch(transcript);
            }, 600);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceFeedback('Microphone permission denied.');
        } else {
          setVoiceFeedback("Didn't catch that. Tap the mic to try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedback('Microphone is busy. Please try again.');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    setIsSearchOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    productService.getFeaturedProducts(8).then((prods) => {
      setMatchingProducts(prods);
    });
  };

  const handleSelectProduct = (product: Product) => {
    setIsSearchOpen(false);
    setIsDesktopSearchFocused(false);
    setIsMobileSearchFocused(false);
    desktopSearchInputRef.current?.blur();
    mobileSearchInputRef.current?.blur();
    closeMobileMenu();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      scrollToProductOrFeatured(product.id);
    }
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag);
  };

  const renderSearchDropdown = (isMobileDropdown = false) => (
    <div
      className={`absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl rounded-[20px] border border-[#eedfe8] shadow-[0_20px_50px_rgba(50,31,63,0.18)] p-3 sm:p-4 z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 ease-out isolate ${isMobileDropdown ? 'w-full' : ''
        }`}
      role="region"
      aria-label="Search suggestions"
    >
      {/* Quick Trending Searches */}
      <div className="pt-0.5">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
          <Sparkles className="w-3 h-3 text-[#D30915]" />
          <span>Popular Searches:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectTag(tag);
              }}
              onClick={() => handleSelectTag(tag)}
              className="px-2.5 py-1 rounded-[8px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Loading Skeleton Shimmer - Shown WHILE searching real catalog */}
      {searchQuery.trim() && isSearching && (
        <div className="mt-3 pt-2.5 border-t border-[#f4edf2] space-y-2" aria-live="polite">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#8a858f]">
            <span className="w-2 h-2 rounded-full bg-[#D30915] animate-ping" />
            <span>Searching Real Catalog...</span>
          </div>
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="p-1.5 flex items-center gap-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-[8px] bg-stone-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-stone-200 rounded w-3/4" />
                <div className="h-2.5 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Genuine No Results State - ONLY shown when completed search genuinely returns 0 products */}
      {searchQuery.trim() && !isSearching && matchingProducts.length === 0 && (
        <div className="mt-3 pt-3 border-t border-[#f4edf2] text-center py-3">
          <p className="text-xs font-bold text-[#141219] m-0">No matching products found</p>
          <p className="text-[11px] text-[#716d77] m-0 mt-0.5">
            We couldn&apos;t find any products matching &quot;{searchQuery}&quot;
          </p>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeSearch(searchQuery);
            }}
            onClick={() => executeSearch(searchQuery)}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#D30915] hover:underline cursor-pointer"
          >
            Search &quot;{searchQuery}&quot; in Full Catalog →
          </button>
        </div>
      )}

      {/* 3. Live Quick Results if search query present and search completed */}
      {searchQuery.trim() && !isSearching && matchingProducts.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#f4edf2] max-h-[250px] overflow-y-auto space-y-1.5 pr-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-1 flex items-center justify-between">
            <span>Matching Products</span>
            <span className="text-[#D30915] font-bold">{matchingProducts.length} items</span>
          </div>
          {matchingProducts.slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectProduct(p);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectProduct(p);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectProduct(p);
                }
              }}
              className="w-full text-left p-1.5 sm:p-2 rounded-[10px] hover:bg-[#fff1f2] flex items-center justify-between transition-colors cursor-pointer group select-none border-0 bg-transparent"
            >
              <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-9 h-9 rounded-[8px] object-cover shrink-0 border border-[#eee0e8]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#141219] group-hover:text-[#D30915] truncate m-0">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-[#716d77] m-0">
                    ${p.price.toFixed(2)} • {p.category} • {p.surpriseType === 'cash' ? '💵 Cash Reveal' : '💎 Real Jewelry'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#D30915] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pointer-events-none" />
            </button>
          ))}
        </div>
      )}

      {/* 4. Default Featured Suggestions if search query is empty */}
      {!searchQuery.trim() && matchingProducts.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#f4edf2] max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-1 flex items-center justify-between">
            <span>Trending Reveals</span>
            <span className="text-[#D30915] font-bold">Featured</span>
          </div>
          {matchingProducts.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectProduct(p);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectProduct(p);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectProduct(p);
                }
              }}
              className="w-full text-left p-1.5 sm:p-2 rounded-[10px] hover:bg-[#fff1f2] flex items-center justify-between transition-colors cursor-pointer group select-none border-0 bg-transparent"
            >
              <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-9 h-9 rounded-[8px] object-cover shrink-0 border border-[#eee0e8]"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#141219] group-hover:text-[#D30915] truncate m-0">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-[#716d77] m-0">
                    ${p.price.toFixed(2)} • {p.category}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#D30915] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pointer-events-none" />
            </button>
          ))}
        </div>
      )}

      {/* Close hint */}
      <div className="mt-2.5 pt-2 border-t border-[#f4edf2] flex items-center justify-between text-[10px] text-[#8a858f]">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[9px]">Esc</kbd> to close</span>
        <button
          type="button"
          onClick={() => setIsSearchOpen(false)}
          className="text-[#D30915] font-bold hover:underline cursor-pointer"
        >
          Close Search
        </button>
      </div>
    </div>
  );

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault();
    setActiveNavId(item.id);
    closeMobileMenu();
    setIsSearchOpen(false);

    if (item.id === 'shop') {
      onNavigate?.('shop');
      return;
    } else if (item.id === 'categories') {
      onNavigate?.('categories');
      return;
    } else if (item.id === 'affiliate') {
      if (onNavigateToAffiliate) {
        onNavigateToAffiliate();
      } else {
        onNavigate?.('affiliate');
      }
      return;
    } else if (item.id === 'rewards') {
      onNavigate?.('rewards');
      return;
    } else if (item.id === 'appraisal') {
      onNavigate?.('appraisal');
      return;
    } else if (item.id === 'about') {
      onNavigate?.('about');
      return;
    } else if (item.id === 'contact') {
      onNavigate?.('contact');
      return;
    } else if (item.id === 'home') {
      setSearchQuery('');
      onNavigate?.('home');
      return;
    }

    if (activeView && activeView !== 'home') {
      onNavigate?.('home');
    }

    if (window.history.pushState) {
      window.history.pushState(null, '', item.href);
    }

    setTimeout(() => {
      const targetEl = document.getElementById(item.targetSectionId);
      if (targetEl) {
        const navOffset = 80;
        const elementTop = targetEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementTop - navOffset),
          behavior: 'smooth',
        });
      } else if (item.id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <>
      {/* 1. Top Announcement Ribbon with Live Urgency Countdown Timer */}
      <div className="block bg-[#FCF2F4] border-b border-[#F4E3EC] text-[11px] font-semibold text-[#141219] py-1.5 px-3 sm:px-4 relative z-30">
        <div className="max-w-[1460px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#141219] truncate min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D30915] text-white font-black text-[9.5px] uppercase tracking-wider shadow-2xs shrink-0">
              <Zap className="w-2.5 h-2.5 fill-white animate-pulse" />
              <span>Flash Sale</span>
            </span>
            <span className="font-extrabold text-[#D30915] font-mono tracking-tight shrink-0">
              Ends in {topTimerHours}h : {topTimerMinutes}m : {topTimerSeconds}s
            </span>
            <span className="text-[#e2d5de] hidden sm:inline">|</span>
            <span className="truncate hidden sm:inline">
              Free Shipping $75+ • Guaranteed Real Cash ($2-$2,500) or Jewelry in Every Item
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[#141219] shrink-0 ml-2">
            <button
              type="button"
              onClick={() => onNavigate?.('rewards')}
              className="flex items-center gap-1.5 hover:text-[#D30915] transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>Surprise Club Rewards</span>
            </button>
            <span className="text-[#e2d5de]">|</span>
            <button
              type="button"
              onClick={() => onNavigate?.('appraisal')}
              className="flex items-center gap-1.5 hover:text-[#D30915] transition-colors cursor-pointer"
            >
              <Gem className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Appraise Jewelry</span>
            </button>
            <span className="text-[#e2d5de]">|</span>
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
              <span>Free Shipping $75+</span>
            </div>
            <span className="text-[#e2d5de]">|</span>
            <a
              href="/affiliate"
              onClick={(e) => {
                e.preventDefault();
                if (user && isConsultantSubscribed) {
                  if (onNavigateToAffiliate) {
                    onNavigateToAffiliate();
                  } else {
                    handleNavClick(e, {
                      id: 'affiliate',
                      label: 'Affiliate',
                      href: '/affiliate',
                      targetSectionId: 'affiliate',
                      icon: Users,
                    });
                  }
                } else if (onOpenSubscription) {
                  onOpenSubscription();
                } else if (onNavigateToAffiliate) {
                  onNavigateToAffiliate();
                } else {
                  handleNavClick(e, {
                    id: 'affiliate',
                    label: 'Affiliate',
                    href: '/affiliate',
                    targetSectionId: 'affiliate',
                    icon: Users,
                  });
                }
              }}
              className="text-[#D30915] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-[#D30915] fill-[#D30915] shrink-0" />
              {user && isConsultantSubscribed ? (
                <span>My Storefront</span>
              ) : (
                <span>Earn 20% Reps</span>
              )}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Flying / Floating Main Brand & Navigation Header Bar */}
      <header className={`sticky top-0 z-40 w-full max-w-full pointer-events-none pt-2 sm:pt-2.5 pb-2.5 sm:pb-3 px-2 sm:px-4 lg:px-6 transition-all duration-300 ${isScrolled ? '' : 'bg-[#FCF2F4]'
        }`}>
        {/* Top Edge Blur Strip: blurs content in the top gap above the navbar while scrolling */}
        <div
          className={`absolute inset-x-0 top-0 h-3 sm:h-4 pointer-events-none -z-10 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'
            }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.85) 0%, transparent 100%)',
          }}
        />

        {/* Floating Navbar Card (Solid White, No Blur Back) */}
        <div className="relative pointer-events-auto w-full max-w-[1460px] mx-auto rounded-[20px] sm:rounded-[24px] bg-white border border-[#eedfe8] shadow-[0_4px_25px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.02)] px-4 sm:px-6 py-2 transition-all">
          <div className="relative flex items-center justify-between gap-2.5 sm:gap-3 xl:gap-5">

            {/* Left Block: Brand Logo */}
            <div className="flex items-center shrink-0 min-w-0">
              <a
                href="/"
                onClick={(e) => {
                  setSearchQuery('');
                  handleNavClick(e, {
                    id: 'home',
                    label: 'Home',
                    href: '/',
                    targetSectionId: 'hero',
                    icon: HomeIcon,
                  });
                }}
                className="flex items-center shrink-0 group focus:outline-none select-none"
                aria-label="ILoveSurprises Home"
              >
                <img
                  src="/assets/ilovesurprises/logo/logo-16k.png"
                  alt="I Love Surprises Logo"
                  width={8192}
                  height={2728}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-[48px] min-[360px]:h-[52px] min-[390px]:h-[55px] min-[420px]:h-[58px] sm:h-[54px] md:h-[58px] lg:h-[62px] xl:h-[66px] w-auto max-w-[195px] min-[360px]:max-w-[210px] min-[390px]:max-w-[225px] min-[420px]:max-w-[240px] sm:max-w-[210px] md:max-w-[235px] lg:max-w-[240px] xl:max-w-[275px] object-contain transition-transform duration-300 group-hover:scale-102"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                />
              </a>
            </div>

            {/* Desktop Center: Large Pill-Shaped Search Bar */}
            <div ref={desktopSearchContainerRef} className="hidden lg:flex flex-1 justify-center max-w-md min-[1280px]:max-w-xl 2xl:max-w-2xl mx-1.5 min-[1280px]:mx-auto relative min-w-0 z-50 pointer-events-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeSearch();
                }}
                className="relative flex items-center w-full h-[42px] xl:h-[44px] rounded-full bg-[#f8f9fa] border border-[#e5e7eb] hover:border-[#D30915]/50 focus-within:border-[#D30915] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D30915]/15 transition-all pl-4 pr-1.5 shadow-2xs overflow-hidden"
              >
                <Search className="w-4 h-4 text-[#8a8f98] group-focus-within:text-[#D30915] shrink-0 mr-2.5 transition-colors z-10" />
                <div className="relative flex-1 h-full flex items-center overflow-hidden">
                  <input
                    ref={desktopSearchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      setIsDesktopSearchFocused(true);
                      setIsSearchOpen(true);
                    }}
                    onBlur={() => setIsDesktopSearchFocused(false)}
                    placeholder={isDesktopSearchFocused ? 'Search candles, jewelry, bath treats...' : ''}
                    className="w-full h-full text-[13.5px] text-[#141219] placeholder:text-[#8a858f] bg-transparent outline-none border-0 font-medium tracking-tight relative z-10"
                    aria-label="Search for candles, jewelry, bath bombs..."
                  />

                  {/* Typing Animated Rotating Placeholder */}
                  {!searchQuery && (
                    <div
                      className={`absolute inset-0 flex items-center pointer-events-none select-none transition-opacity duration-200 z-5 ${isDesktopSearchFocused ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                      <div className="flex items-center text-[13.5px] truncate text-[#716d77]">
                        <span className="shrink-0 font-normal mr-1.5">{SEARCH_SUGGESTIONS[searchPlaceholderIndex].prefix}</span>
                        <span className="font-medium text-[#716d77] tracking-tight truncate">
                          {typedPlaceholderText}
                        </span>
                        <span className="inline-block w-[1.5px] h-[14px] bg-[#D30915] animate-typing-cursor shrink-0 ml-0.5 self-center" />
                      </div>
                    </div>
                  )}
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-full text-[#8a858f] hover:text-[#141219] hover:bg-gray-100 active:scale-90 transition-all mr-1 cursor-pointer z-10"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className="p-1.5 rounded-full text-[#8a8f98] hover:text-[#D30915] hover:bg-gray-100 active:scale-90 transition-all cursor-pointer z-10 mr-1"
                  title="Search by voice"
                  aria-label="Search by voice"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="w-[34px] h-[34px] xl:w-[36px] xl:h-[36px] aspect-square rounded-full bg-[#D30915] hover:bg-[#b60711] text-white flex items-center justify-center shrink-0 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                  title="Search"
                  aria-label="Submit Search"
                >
                  <Search className="w-4 h-4 text-white stroke-[2.5]" />
                </button>
              </form>

              {/* Desktop Live Search Dropdown */}
              {isSearchOpen && renderSearchDropdown(false)}
            </div>

            {/* Right Header Actions: Login, Join for $20/mo Button, Cart & Hamburger */}
            <div className="relative z-30 flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 min-w-0">

              {/* When NOT logged in: Login Button matching Reference */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="hidden sm:flex items-center gap-1.5 h-[38px] px-2.5 min-[1200px]:px-3.5 rounded-full hover:bg-gray-100 text-[13px] xl:text-[14px] font-bold text-[#141219] hover:text-[#D30915] active:scale-95 transition-all cursor-pointer select-none shrink-0"
                >
                  <User className="w-4 h-4 text-[#141219]" />
                  <span>Login</span>
                </button>
              ) : (
                /* When LOGGED IN: User Profile Pill (Desktop & Tablet only) */
                <div ref={userMenuRef} className="hidden sm:block relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 h-[36px] sm:h-[38px] p-1 sm:p-1.5 pr-2.5 rounded-[13px] sm:rounded-[14px] bg-[#fffafc] border border-[#fecdd3] hover:border-[#D30915] shadow-2xs hover:shadow-[0_2px_8px_rgba(211,9,21,0.12)] active:scale-95 transition-all cursor-pointer text-left"
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                  >
                    <img
                      src={user.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover border border-[#D30915]"
                    />

                    <div className="leading-tight hidden 2xl:block">
                      <span className="block text-[13.5px] xl:text-[14px] font-bold text-[#141219] truncate max-w-[95px]">
                        {user.name.split(' ')[0]}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-3 h-3 text-[#716d77] transition-transform ${isUserMenuOpen ? 'rotate-180 text-[#D30915]' : ''
                        }`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-[20px] border border-[#eee7ed] shadow-[0_16px_40px_rgba(50,31,63,0.15)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-2 mb-2 bg-[#fff8fb] rounded-[14px] border border-[#f5e4ec]">
                        <strong className="block text-xs font-black text-[#141219] truncate">
                          {user.name}
                        </strong>
                        <span className="text-[10px] text-[#716d77] block truncate">{user.email}</span>
                        <span className="inline-block mt-1 text-[9px] font-black uppercase text-[#D30915] bg-white px-2 py-0.5 rounded-full border border-[#fecdd3]">
                          {user.role === 'representative' ? '★ Active Representative' : '💎 VIP Member'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs font-bold text-[#55505a]">
                        {user.role === 'representative' && (
                          <a
                            href="/affiliate"
                            onClick={(e) => {
                              setIsUserMenuOpen(false);
                              handleNavClick(e, {
                                id: 'affiliate',
                                label: 'Affiliate',
                                href: '/affiliate',
                                targetSectionId: 'affiliate',
                                icon: Users,
                              });
                            }}
                            className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors whitespace-nowrap"
                          >
                            <Users className="w-3.5 h-3.5 text-[#D30915]" />
                            <span>Rep Portal Dashboard</span>
                          </a>
                        )}

                        <a
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            if (onNavigateToAccount) {
                              onNavigateToAccount('profile');
                            } else {
                              onNavigate?.('home');
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors whitespace-nowrap"
                        >
                          <User className="w-3.5 h-3.5 text-[#D30915]" />
                          <span>My Account & Profile</span>
                        </a>

                        <a
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            if (onNavigateToAccount) {
                              onNavigateToAccount('orders');
                            } else {
                              onNavigate?.('home');
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors whitespace-nowrap"
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>My Surprise Orders</span>
                        </a>

                        <a
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            if (onNavigateToAccount) {
                              onNavigateToAccount('addresses');
                            } else {
                              onNavigate?.('home');
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors whitespace-nowrap"
                        >
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          <span>Saved Addresses</span>
                        </a>

                        <a
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            if (onNavigateToAccount) {
                              onNavigateToAccount('wishlist');
                            } else {
                              onNavigate?.('home');
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors whitespace-nowrap"
                        >
                          <Heart className="w-3.5 h-3.5 text-[#D30915]" />
                          <span>My Wishlist</span>
                        </a>

                        <a
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            if (onNavigateToAccount) {
                              onNavigateToAccount('settings');
                            } else {
                              onNavigate?.('home');
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors whitespace-nowrap"
                        >
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          <span>Account Settings</span>
                        </a>

                        <a
                          href="/admin"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            if (onNavigateToAdmin) {
                              onNavigateToAdmin();
                            } else {
                              onNavigate?.('admin');
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] bg-[#fffbfd] hover:bg-[#fff1f2] text-[#D30915] font-black transition-colors whitespace-nowrap"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
                          <span>Admin Suite Portal</span>
                        </a>

                        <div className="pt-1.5 border-t border-[#f4edf2]">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              try {
                                localStorage.removeItem('ils_consultant_subscribed');
                                localStorage.removeItem('ils_consultant_username');
                                localStorage.removeItem('ils_consultant_name');
                              } catch { }
                              setIsConsultantSubscribed(false);
                              window.dispatchEvent(new CustomEvent('ils_consultant_subscribed', { detail: { subscribed: false } }));
                              onLogout?.();
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-[10px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1. Mobile Search Icon Button (Mobile Only) */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen((prev) => !prev);
                  if (!isMobileSearchOpen) {
                    setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
                  }
                }}
                className={`lg:hidden w-[40px] h-[40px] rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-2xs shrink-0 active:scale-95 ${isMobileSearchOpen
                    ? 'bg-[#fff0f3] border-[#D30915] text-[#D30915]'
                    : 'bg-[#fffafb] border-[#f0e4ec] text-[#141219] hover:text-[#D30915] hover:border-[#D30915]'
                  }`}
                aria-label="Search products"
                title="Search"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Mobile Only: Top Navbar Cart Icon between Search Icon and Navbar Lines */}
              <button
                type="button"
                onClick={onOpenCart}
                className="lg:hidden relative w-[40px] h-[40px] rounded-full bg-[#fffafb] hover:bg-[#fff1f2] border border-[#f0e4ec] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
                aria-label={`Shopping cart with ${cartCount} items`}
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5 text-[#D30915] shrink-0" />
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D30915] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150"
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* 2. Join $20/month CTA Button OR My Storefront when Subscribed (Desktop sm+ only) */}
              {user && isConsultantSubscribed ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToAffiliate) {
                      onNavigateToAffiliate();
                    } else {
                      onNavigate?.('affiliate');
                    }
                  }}
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 h-[38px] px-2.5 min-[1240px]:px-3 xl:px-3.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[12px] min-[1240px]:text-[13px] xl:text-[14px] font-bold shadow-2xs hover:shadow-[0_4px_16px_rgba(5,150,105,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer whitespace-nowrap select-none shrink-0"
                  title="Go to My Consultant Storefront Portal"
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <span className="hidden min-[1240px]:inline">My Storefront</span>
                  <span className="min-[1240px]:hidden">Storefront</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSubscription) {
                      onOpenSubscription();
                    } else if (onNavigateToAffiliate) {
                      onNavigateToAffiliate();
                    } else {
                      onNavigate?.('affiliate');
                    }
                  }}
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 h-[38px] px-2.5 min-[1240px]:px-3.5 xl:px-4 rounded-full bg-[#D30915] hover:bg-[#b60711] text-white text-[12px] min-[1240px]:text-[13px] xl:text-[14px] font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer whitespace-nowrap select-none shrink-0"
                  title="Join $20/month"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="hidden min-[1240px]:inline">Join $20/month</span>
                  <span className="min-[1240px]:hidden">Join $20/mo</span>
                </button>
              )}

              {/* 3. Shopping Cart Button: Hidden on mobile navbar, visible on desktop (lg+) */}
              <button
                type="button"
                onClick={onOpenCart}
                className="hidden lg:flex relative items-center justify-center h-[38px] px-2.5 min-[1240px]:px-3 xl:px-4 rounded-full bg-[#FDF0F3] hover:bg-[#FEEBF0] text-[#141219] hover:text-[#D30915] active:scale-95 transition-all cursor-pointer select-none shrink-0 gap-1.5"
                aria-label={`Shopping cart with ${cartCount} items`}
                title="Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 text-[#D30915] shrink-0" />
                <span className="inline text-[12.5px] min-[1240px]:text-[13px] xl:text-[14px] font-bold tracking-tight text-[#141219]">
                  Cart
                </span>
                <span className="text-[12.5px] min-[1240px]:text-[13px] xl:text-[13.5px] font-bold text-[#716d77] ml-0.5">
                  {cartCount}
                </span>
              </button>

              {/* 4. Mobile 3-Lines Hamburger Menu Button */}
              <button
                type="button"
                onClick={openMobileMenu}
                className="lg:hidden w-[40px] h-[40px] rounded-full bg-[#fffafb] hover:bg-[#fff1f2] border border-[#f0e4ec] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] active:scale-95 transition-all cursor-pointer focus:outline-none flex items-center justify-center shadow-2xs shrink-0"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
                title="Menu"
              >
                <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.5]" />
              </button>

            </div>
          </div>

          {/* Row 1.5 (Mobile Only): Expandable Full-Width Search Bar */}
          {isMobileSearchOpen && (
            <div ref={mobileSearchContainerRef} className="lg:hidden w-full pt-2 pb-0.5 relative z-50 pointer-events-auto animate-in fade-in slide-in-from-top-1 duration-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeSearch();
                }}
                className="relative flex items-center w-full h-[40px] rounded-full bg-white border border-[#e5dfe5] hover:border-[#D30915]/50 focus-within:border-[#D30915] focus-within:ring-2 focus-within:ring-[#D30915]/15 transition-all px-3.5 shadow-2xs overflow-hidden"
              >
                <Search className="w-4 h-4 text-[#716d77] shrink-0 mr-2 transition-colors z-10" />
                <div className="relative flex-1 h-full flex items-center overflow-hidden">
                  <input
                    ref={mobileSearchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      setIsMobileSearchFocused(true);
                      setIsSearchOpen(true);
                    }}
                    onBlur={() => setIsMobileSearchFocused(false)}
                    placeholder={isMobileSearchFocused ? 'Search candles, jewelry...' : ''}
                    className="w-full h-full text-xs text-[#141219] placeholder:text-[#8a858f] bg-transparent outline-none border-0 font-medium relative z-10"
                    aria-label="Search for candles, jewelry, bath bombs..."
                  />

                  {/* Typing Animated Rotating Placeholder */}
                  {!searchQuery && (
                    <div
                      className={`absolute inset-0 flex items-center pointer-events-none select-none transition-opacity duration-200 z-5 ${isMobileSearchFocused ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                      <div className="flex items-center text-xs truncate text-[#716d77]">
                        <span className="shrink-0 font-normal mr-1">{SEARCH_SUGGESTIONS[searchPlaceholderIndex].prefix}</span>
                        <span className="font-medium text-[#716d77] truncate">
                          {typedPlaceholderText}
                        </span>
                        <span className="inline-block w-[1.5px] h-[12px] bg-[#D30915] animate-typing-cursor shrink-0 ml-0.5 self-center" />
                      </div>
                    </div>
                  )}
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-full text-[#8a858f] hover:text-[#141219] hover:bg-gray-100 active:scale-90 transition-all mr-0.5 cursor-pointer z-10"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className="p-1.5 rounded-full text-[#8a858f] hover:text-[#D30915] hover:bg-[#fff0f3] active:scale-90 transition-all cursor-pointer z-10"
                  title="Search by voice"
                  aria-label="Search by voice"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Mobile Live Search Dropdown */}
              {isSearchOpen && renderSearchDropdown(true)}
            </div>
          )}

          {/* Row 2: Desktop Horizontal Category Navigation */}
          <nav
            ref={desktopNavRef}
            className="hidden lg:flex items-center justify-between border-t border-[#f4ebf0] mt-1.5 pt-1.5 px-0.5 relative min-w-0 max-w-full"
            aria-label="Main Category Navigation"
          >
            {/* Left: Product Categories Cluster */}
            <div className="flex items-center gap-0.5 min-[1120px]:gap-0.5 min-[1220px]:gap-1 xl:gap-1.5 2xl:gap-2.5 flex-nowrap min-w-0 py-0.5">
              {/* Home Pill */}
              <button
                type="button"
                onMouseEnter={handleMegaLeave}
                onClick={() => {
                  const homeCat = NAVIGATION_CATEGORIES.find((c) => c.slug === 'home');
                  if (homeCat) handleCategoryClick(homeCat);
                }}
                className="flex items-center gap-1 xl:gap-1.5 px-1.5 min-[1180px]:px-2 xl:px-2.5 2xl:px-3 py-0.5 min-[1180px]:py-1 rounded-full bg-[#FDECEF] hover:bg-[#fcdde3] text-[#D30915] text-[11px] min-[1180px]:text-[12px] xl:text-[13px] 2xl:text-[13.5px] font-bold transition-all cursor-pointer whitespace-nowrap select-none shrink-0 active:scale-95"
              >
                <HomeIcon className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
                <span>Home</span>
              </button>

              {/* Product Category Buttons */}
              {NAVIGATION_CATEGORIES.filter(
                (c) =>
                  !c.hideInDesktopNav &&
                  c.slug !== 'home' &&
                  c.slug !== 'affiliate' &&
                  c.slug !== 'appraise-your-jewelry' &&
                  c.id !== 'appraisal' &&
                  c.slug !== 'contact'
              ).map((cat) => {
                const hasSub = Boolean(cat.columns && cat.columns.length > 0);
                const isMegaActive = activeMegaCategory === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="relative group shrink-0"
                    onMouseEnter={() => (hasSub ? handleMegaEnter(cat.id) : handleMegaLeave())}
                    onMouseLeave={handleMegaLeave}
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className={`group flex items-center gap-0.5 min-[1180px]:gap-1 px-1 min-[1180px]:px-1.5 xl:px-2 py-0.5 rounded-full text-[11px] min-[1150px]:text-[11.5px] min-[1220px]:text-[12px] xl:text-[13px] 2xl:text-[13.5px] font-bold transition-all cursor-pointer whitespace-nowrap select-none shrink-0 ${isMegaActive
                          ? 'text-[#D30915] bg-[#fff0f3]'
                          : 'text-[#141219] hover:text-[#D30915] hover:bg-[#fff9fb]'
                        }`}
                      aria-expanded={isMegaActive}
                    >
                      {cat.slug === 'candles' ? (
                        <>
                          <span className="hidden min-[1180px]:inline">{cat.name}</span>
                          <span className="min-[1180px]:hidden">Candles</span>
                        </>
                      ) : cat.slug === 'bath-bombs' ? (
                        <>
                          <span className="hidden min-[1280px]:inline">{cat.name}</span>
                          <span className="min-[1280px]:hidden">Bath Bombs</span>
                        </>
                      ) : cat.slug === 'wax-melts' ? (
                        <>
                          <span className="hidden min-[1340px]:inline">{cat.name}</span>
                          <span className="min-[1340px]:hidden">Melts & Treats</span>
                        </>
                      ) : cat.slug === 'mystery-boxes' ? (
                        <>
                          <span className="hidden min-[1220px]:inline">{cat.name}</span>
                          <span className="min-[1220px]:hidden">Mystery</span>
                        </>
                      ) : (
                        <span>{cat.name}</span>
                      )}
                      {cat.badge && (
                        <span className="hidden min-[1380px]:inline-block text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#FF3366] text-white ml-0.5">
                          {cat.badge}
                        </span>
                      )}
                      {hasSub && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#716d77] transition-transform duration-200 group-hover:text-[#D30915] ${isMegaActive ? 'rotate-180 text-[#D30915]' : ''
                            }`}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right: Utility Links Cluster (Divider + Affiliate Program + Appraise Jewelry) */}
            <div className="flex items-center gap-0.5 min-[1180px]:gap-1 xl:gap-1.5 2xl:gap-2 shrink-0 ml-1 pl-1 min-[1180px]:ml-1.5 min-[1180px]:pl-1.5 xl:ml-2.5 xl:pl-2.5 border-l border-[#e2d5de]">
              {NAVIGATION_CATEGORIES.filter(
                (c) =>
                  !c.hideInDesktopNav &&
                  (c.slug === 'affiliate' || c.slug === 'appraise-your-jewelry' || c.id === 'appraisal')
              ).map((cat) => {
                const isRouteActive =
                  (cat.slug === 'affiliate' && activeView === 'affiliate') ||
                  (cat.slug === 'appraise-your-jewelry' && activeView === 'appraisal');

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={handleMegaLeave}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex items-center gap-0.5 min-[1180px]:gap-1 xl:gap-1.5 px-1 min-[1180px]:px-1.5 xl:px-2 py-0.5 rounded-full text-[11px] min-[1150px]:text-[11.5px] min-[1220px]:text-[12px] xl:text-[13px] 2xl:text-[13.5px] font-bold transition-all cursor-pointer whitespace-nowrap select-none shrink-0 ${isRouteActive
                        ? 'text-[#D30915] bg-[#fff0f3]'
                        : 'text-[#141219] hover:text-[#D30915] hover:bg-[#fff9fb]'
                      }`}
                  >
                    {cat.slug === 'affiliate' && (
                      <Megaphone className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
                    )}
                    {(cat.slug === 'appraise-your-jewelry' || cat.id === 'appraisal') && (
                      <Gem className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
                    )}
                    {cat.slug === 'affiliate' ? (
                      <>
                        <span className="hidden min-[1260px]:inline">{cat.name}</span>
                        <span className="min-[1260px]:hidden">Affiliate</span>
                      </>
                    ) : (cat.slug === 'appraise-your-jewelry' || cat.id === 'appraisal') ? (
                      <>
                        <span className="hidden min-[1260px]:inline">{cat.name}</span>
                        <span className="min-[1260px]:hidden">Appraise</span>
                      </>
                    ) : (
                      <span>{cat.name}</span>
                    )}
                  </button>
                );
              })}
            </div>

          {/* Desktop Mega Menu Dropdown */}
          {displayedMegaCategory && (() => {
            const cat = NAVIGATION_CATEGORIES.find((c) => c.id === displayedMegaCategory);
            if (!cat || !cat.columns || cat.columns.length === 0) return null;
            const isMegaOpen = Boolean(activeMegaCategory);

            return (
              <div
                className="absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-none"
                style={{
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: isMegaOpen ? 1 : 0,
                  transform: isMegaOpen ? 'translateY(0)' : 'translateY(12px)',
                  pointerEvents: isMegaOpen ? 'auto' : 'none',
                  overflow: 'visible',
                  width: '100%',
                }}
                onMouseEnter={handleMegaMenuPanelEnter}
                onMouseLeave={handleMegaLeave}
              >
                {/* Parent Mega Menu Container */}
                <div
                  className="w-full bg-white rounded-b-[20px] border border-stone-200 border-t-0 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] relative"
                  style={{
                    width: '100%',
                    maxWidth: 'min(1280px, 100%)',
                    left: 0,
                    right: 0,
                    margin: '0 auto',
                    padding: '16px 20px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    borderRadius: '0 0 16px 16px',
                  }}
                >
                  {/* Top Bar: Clean, Straight Category Title & View All */}
                  <div className="flex items-center justify-between gap-4 pb-2.5 mb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D30915]" />
                      <span className="font-extrabold text-xs uppercase tracking-wider text-stone-900 whitespace-nowrap">
                        {cat.name} Collections
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="group/all inline-flex items-center gap-1.5 text-xs font-bold text-[#D30915] hover:text-[#B60711] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{cat.viewAllLabel || `View All ${cat.name}`}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/all:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Content Grid: 100% straight columns */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        cat.columns && cat.columns.length === 3
                          ? 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(160px, 240px)'
                          : 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(160px, 240px)',
                      gap: '14px',
                      alignItems: 'start',
                    }}
                  >
                    {/* Primary Subcategory Columns */}
                    {cat.columns.map((col, idx) => (
                      <div key={idx} className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-stone-100 min-w-0">
                          <div className="w-1.5 h-3 rounded-full bg-[#D30915] shrink-0" />
                          <h4 className="text-stone-900 uppercase m-0 text-xs font-bold tracking-wider whitespace-nowrap">
                            {col.heading}
                          </h4>
                        </div>
                        <ul className="space-y-0.5 p-0 m-0 list-none">
                          {col.items.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => handleSubCategoryClick(cat, item)}
                                className="w-full text-left group/sub flex items-center justify-between gap-2 py-1 text-[13px] xl:text-[13.5px] font-medium text-stone-700 hover:text-[#D30915] transition-colors cursor-pointer min-w-0"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover/sub:bg-[#D30915] group-hover/sub:scale-125 transition-all shrink-0" />
                                  <span className="group-hover/sub:translate-x-0.5 transition-transform truncate">
                                    {item.name}
                                  </span>
                                </div>
                                {item.badge && (
                                  <span className="text-[9.5px] xl:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 shrink-0 whitespace-nowrap">
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* For 1-column categories: Clean straight "Shop by Surprise" column */}
                    {cat.columns.length === 1 && (
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-stone-100 min-w-0">
                          <div className="w-1.5 h-3 rounded-full bg-amber-500 shrink-0" />
                          <h4 className="text-stone-900 uppercase m-0 text-xs font-bold tracking-wider whitespace-nowrap">
                            Shop by Surprise
                          </h4>
                        </div>
                        <ul className="space-y-0.5 p-0 m-0 list-none">
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMegaCategory(null);
                                setDisplayedMegaCategory(null);
                                onSearch?.('Cash ' + cat.name);
                              }}
                              className="w-full text-left group/sub flex items-center justify-between gap-2 py-1 text-[13px] xl:text-[13.5px] font-medium text-stone-700 hover:text-[#D30915] transition-colors cursor-pointer min-w-0"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover/sub:scale-125 transition-all shrink-0" />
                                <span className="group-hover/sub:translate-x-0.5 transition-transform truncate">
                                  Cash Inside Reveals
                                </span>
                              </div>
                              <span className="text-[9.5px] xl:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                                💵 Cash
                              </span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMegaCategory(null);
                                setDisplayedMegaCategory(null);
                                onSearch?.('Jewelry ' + cat.name);
                              }}
                              className="w-full text-left group/sub flex items-center justify-between gap-2 py-1 text-[13px] xl:text-[13.5px] font-medium text-stone-700 hover:text-[#D30915] transition-colors cursor-pointer min-w-0"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover/sub:scale-125 transition-all shrink-0" />
                                <span className="group-hover/sub:translate-x-0.5 transition-transform truncate">
                                  Jewelry Inside Reveals
                                </span>
                              </div>
                              <span className="text-[9.5px] xl:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0 whitespace-nowrap">
                                💎 Jewelry
                              </span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(cat)}
                              className="w-full text-left group/sub flex items-center justify-between gap-2 py-1 text-[13px] xl:text-[13.5px] font-medium text-stone-700 hover:text-[#D30915] transition-colors cursor-pointer min-w-0"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover/sub:scale-125 transition-all shrink-0" />
                                <span className="group-hover/sub:translate-x-0.5 transition-transform truncate">
                                  Best Seller Reveals
                                </span>
                              </div>
                              <span className="text-[9.5px] xl:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 whitespace-nowrap">
                                ★ Popular
                              </span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(cat)}
                              className="w-full text-left group/sub flex items-center justify-between gap-3 py-1 text-[13.5px] font-medium text-stone-700 hover:text-[#D30915] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 group-hover/sub:scale-125 transition-all shrink-0" />
                                <span className="group-hover/sub:translate-x-0.5 transition-transform whitespace-nowrap">
                                  Gift Sets &amp; Bundles
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 shrink-0 whitespace-nowrap">
                                🎁 Gift
                              </span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Right Spotlight Promo Card (Displays Full Product Image on Clean White Background) */}
                    {cat.spotlight && (
                      <div className="flex flex-col min-w-0 shrink-0 w-full max-w-[240px]">
                        <div
                          onClick={() => {
                            setActiveMegaCategory(null);
                            setDisplayedMegaCategory(null);
                            if (onSelectCategory) {
                              onSelectCategory(cat.spotlight!.targetCategory);
                            } else {
                              onNavigate?.('shop');
                            }
                          }}
                          className="group/promo relative flex flex-col bg-white border border-stone-200 hover:border-stone-400 transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer w-full max-w-[240px] rounded-[12px] overflow-hidden box-border"
                        >
                          {/* Image Container: Pure white background, no pink gradient or overlay badges */}
                          <div
                            className="relative w-full flex items-center justify-center bg-white overflow-hidden"
                            style={{
                              width: '100%',
                              height: '175px',
                              maxHeight: '185px',
                              borderRadius: '12px 12px 0 0',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={cat.spotlight.image}
                              alt={cat.spotlight.title}
                              className="transition-transform duration-500 group-hover/promo:scale-105"
                              style={{
                                width: '100%',
                                height: '100%',
                                maxHeight: '175px',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                display: 'block',
                                padding: '6px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          {/* Details below image: Only clean text */}
                          <div className="p-2 flex items-center justify-between gap-1.5 bg-white border-t border-stone-100 min-w-0">
                            <strong className="font-bold text-xs text-stone-900 group-hover/promo:text-[#D30915] transition-colors truncate">
                              {cat.spotlight.title}
                            </strong>
                            <span className="text-[10.5px] font-bold text-[#D30915] flex items-center gap-1 shrink-0 whitespace-nowrap">
                              Shop <ArrowRight className="w-3 h-3 group-hover/promo:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </nav>
      </div>
    </header>

      {/* 3. Full-Screen Mobile Navigation Drawer Portal */}
      {typeof document !== 'undefined' && (isMobileMenuOpen || isClosingMobileMenu) && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end overflow-hidden">
          {/* Backdrop overlay with blur */}
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-all ${
              isClosingMobileMenu ? 'animate-backdrop-out' : 'animate-backdrop-in'
            }`}
            onClick={() => closeMobileMenu()}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className={`relative w-[85%] max-w-[340px] h-full bg-white shadow-2xl z-10 flex flex-col justify-between overflow-y-auto border-l border-[#eee7ed] ${
              isClosingMobileMenu ? 'animate-drawer-out' : 'animate-drawer-in'
            }`}
          >
          {/* Drawer Top Header */}
          <div>
            <div className="p-4 border-b border-[#f4edf2] flex items-center justify-between bg-gradient-to-r from-[#fff5f5] to-[#ffffff]">
              <a
                href="/"
                onClick={(e) =>
                  handleNavClick(e, {
                    id: 'home',
                    label: 'Home',
                    href: '/',
                    targetSectionId: 'hero',
                    icon: HomeIcon,
                  })
                }
                className="flex items-center shrink min-w-0"
                aria-label="Home"
              >
                <img
                  src="/assets/ilovesurprises/logo/logo-16k.png"
                  alt="I Love Surprises Logo"
                  width={8192}
                  height={2728}
                  loading="lazy"
                  decoding="async"
                  className="h-[42px] min-[360px]:h-[46px] min-[390px]:h-[50px] min-[420px]:h-[52px] sm:h-[50px] w-auto max-w-[170px] min-[360px]:max-w-[195px] min-[390px]:max-w-[215px] min-[420px]:max-w-[230px] sm:max-w-[225px] object-contain"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                />
              </a>

              <button
                type="button"
                onClick={() => closeMobileMenu()}
                className="w-9 h-9 rounded-full bg-white border border-[#ecdbe6] hover:bg-[#fff1f2] hover:text-[#D30915] hover:border-[#fecdd3] text-[#716d77] flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xs"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Drawer Category Accordion Menu (JewelryCandles-style Mobile Architecture) */}
            <div className="p-3">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] px-2 mb-2">
                Categories &amp; Navigation
              </span>

              <div className="space-y-1.5">
                {NAVIGATION_CATEGORIES.map((cat) => {
                  const isExpanded = expandedMobileCategory === cat.id;
                  const hasSub = Boolean(cat.columns && cat.columns.length > 0);

                  if (!hasSub) {
                    const isRouteActive =
                      (cat.slug === 'home' && (activeView === 'home' || !activeView)) ||
                      (cat.slug === 'affiliate' && activeView === 'affiliate') ||
                      (cat.slug === 'contact' && activeView === 'contact') ||
                      (cat.slug === 'appraise-your-jewelry' && activeView === 'appraisal');
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
                        className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-[13px] flex items-center justify-between text-left font-bold text-sm transition-all cursor-pointer ${isRouteActive
                            ? 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] font-black shadow-2xs'
                            : 'text-[#141219] hover:bg-[#fff9fb] hover:text-[#D30915] border border-transparent'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{cat.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#beb8c2]" />
                      </button>
                    );
                  }

                  return (
                    <div key={cat.id} className="rounded-[13px] overflow-hidden border border-[#f3e7ee] bg-white transition-all shadow-2xs">
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                        className={`w-full min-h-[46px] px-3.5 py-2.5 flex items-center justify-between text-left font-bold text-sm transition-colors cursor-pointer select-none ${isExpanded ? 'bg-[#fff1f4] text-[#D30915]' : 'text-[#141219] hover:bg-[#fff9fb]'
                          }`}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          {cat.badge && (
                            <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#D30915] text-white">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#8a858f] transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#D30915]' : ''
                            }`}
                        />
                      </button>

                      {/* Accordion Expanded Subcategories */}
                      {isExpanded && (
                        <div className="px-2.5 py-2 bg-[#fdfafb] border-t border-[#f5e6ee] space-y-1">
                          {cat.columns?.flatMap((col) => col.items).map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleSubCategoryClick(cat, sub)}
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-[10px] flex items-center justify-between text-left text-xs font-semibold text-[#302936] hover:bg-[#fff0f3] hover:text-[#D30915] transition-colors cursor-pointer"
                            >
                              <span className="truncate">{sub.name}</span>
                              {sub.badge && (
                                <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-[#fff0f3] text-[#D30915] border border-[#fecdd3] shrink-0 ml-1.5">
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(cat)}
                            className="w-full min-h-[40px] mt-1.5 px-3 py-1.5 rounded-[10px] flex items-center justify-center gap-1.5 text-xs font-black text-[#D30915] bg-[#fff0f3] hover:bg-[#fedde4] transition-colors cursor-pointer border border-[#fcd5df]"
                          >
                            <span>{cat.viewAllLabel || `View All ${cat.name}`}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Express Shipping Hub Location */}
            <div className="p-3 border-t border-[#f4edf2]">
              <div className="p-2.5 rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Express Shipping Hub</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                    {currentLoc.eta}
                  </span>
                </div>
                <div className="text-xs font-black text-[#141219] truncate">
                  {currentLoc.name}, {currentLoc.state} ({currentLoc.zip})
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer: Account Actions & Support */}
          <div className="p-4 border-t border-[#f4edf2] bg-gradient-to-b from-[#fffafc] to-[#fff5f5] space-y-3">
            {/* Account Status */}
            {!user ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    if (onOpenSubscription) {
                      onOpenSubscription();
                    } else if (onNavigateToAffiliate) {
                      onNavigateToAffiliate();
                    } else {
                      onNavigate?.('affiliate');
                    }
                  }}
                  className="w-full h-[42px] px-3.5 rounded-[12px] bg-[#D30915] hover:bg-[#b60711] text-white text-xs font-black shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
                >
                  <Users className="w-4 h-4" />
                  <span>Join $20/month</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onOpenAuth?.('login');
                  }}
                  className="w-full h-[38px] px-3.5 rounded-[12px] bg-[#fff1f2] border border-[#fecdd3] hover:border-[#D30915] hover:bg-[#D30915] hover:text-white text-[#D30915] text-xs font-black shadow-2xs hover:shadow-xs active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-white rounded-[14px] border border-[#fecdd3] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#D30915] shrink-0"
                    />
                    <div className="min-w-0">
                      <strong className="block text-xs font-black text-[#141219] truncate">
                        {user.name}
                      </strong>
                      <span className="text-[10px] text-[#716d77] block truncate">{user.email}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full border border-[#fecdd3] shrink-0">
                    {user.role === 'representative' ? '20% Rep' : 'VIP'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#f4edf2] text-[11px] font-bold text-[#55505a]">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      if (onNavigateToAccount) {
                        onNavigateToAccount('profile');
                      } else {
                        onNavigate?.('home');
                      }
                    }}
                    className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <User className="w-3 h-3 text-[#D30915]" />
                    <span>Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      if (onNavigateToAccount) {
                        onNavigateToAccount('orders');
                      } else {
                        onNavigate?.('home');
                      }
                    }}
                    className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <PackageCheck className="w-3 h-3 text-emerald-600" />
                    <span>Orders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      if (onNavigateToAccount) {
                        onNavigateToAccount('addresses');
                      } else {
                        onNavigate?.('home');
                      }
                    }}
                    className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <MapPin className="w-3 h-3 text-purple-600" />
                    <span>Addresses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      if (onNavigateToAccount) {
                        onNavigateToAccount('wishlist');
                      } else {
                        onNavigate?.('home');
                      }
                    }}
                    className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <Heart className="w-3 h-3 text-[#D30915]" />
                    <span>Wishlist</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    if (onNavigateToAdmin) {
                      onNavigateToAdmin();
                    } else {
                      onNavigate?.('admin');
                    }
                  }}
                  className="w-full h-[32px] rounded-[10px] bg-[#fff1f2] text-[#D30915] hover:bg-[#ffe5ef] text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin Suite Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    try {
                      localStorage.removeItem('ils_consultant_subscribed');
                      localStorage.removeItem('ils_consultant_username');
                      localStorage.removeItem('ils_consultant_name');
                    } catch { }
                    setIsConsultantSubscribed(false);
                    window.dispatchEvent(new CustomEvent('ils_consultant_subscribed', { detail: { subscribed: false } }));
                    onLogout?.();
                  }}
                  className="w-full h-[32px] rounded-[10px] bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* Direct Support Contact Links */}
            <div className="pt-2 border-t border-[#f2e6ee] flex items-center justify-between text-[10px] font-bold text-[#716d77]">
              <a
                href="tel:18007877747"
                className="flex items-center gap-1 hover:text-[#D30915] transition-colors"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>1-800-SURPRISE</span>
              </a>
              <a
                href="mailto:support@ilovesurprises.com"
                className="flex items-center gap-1 hover:text-[#D30915] transition-colors"
              >
                <Mail className="w-3 h-3 text-[#D30915]" />
                <span>Email Help</span>
              </a>
            </div>
          </div>

        </div>
      </div>,
      document.body
    )
  }

  {/* 4. YouTube-Style Animated Voice Search Modal Overlay */ }
  {
    typeof document !== 'undefined' && isVoiceModalOpen && createPortal(
      <div className="fixed inset-0 z-[9999999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-[#f0dae7] text-center flex flex-col items-center overflow-hidden">

          {/* Close Button in Top-Right */}
          <button
            type="button"
            onClick={closeVoiceModal}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#fff5f8] hover:bg-[#D30915] text-[#716d77] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-[#fecdd3]"
            aria-label="Close voice search"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Voice Status Heading */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3] mb-2">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Search</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#141219]">
              {isListening ? 'Listening...' : 'Try saying something'}
            </h3>
            <p className="text-xs sm:text-sm text-[#716d77] mt-1 max-w-[280px]">
              Say a candle scent, jewelry surprise, or cash prize
            </p>
          </div>

          {/* YouTube Animated Ripple Pulse & Equalizer */}
          <div className="relative my-4 flex items-center justify-center w-40 h-40">
            {/* Outer Ripple Wave 1 */}
            <div
              className={`absolute w-36 h-36 rounded-full bg-[#D30915]/15 transition-all duration-1000 ${isListening ? 'animate-ping' : 'scale-90 opacity-20'
                }`}
            />

            {/* Middle Ripple Wave 2 */}
            <div
              className={`absolute w-28 h-28 rounded-full bg-[#D30915]/25 transition-all duration-700 ${isListening ? 'animate-pulse' : 'scale-90 opacity-40'
                }`}
            />

            {/* Center YouTube Mic Button */}
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(211, 9, 21,0.45)] transition-transform duration-200 cursor-pointer active:scale-95 ${isListening
                ? 'bg-gradient-to-tr from-[#D30915] via-[#ff4081] to-[#ff2a6d] scale-105'
                : 'bg-gradient-to-tr from-[#716d77] to-[#36323d] hover:bg-[#D30915]'
                }`}
              title={isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
              aria-label="Toggle voice search"
            >
              <Mic className={`w-8 h-8 ${isListening ? 'animate-bounce text-white' : 'text-white'}`} />
            </button>
          </div>

          {/* Sound Equalizer Waveform Bars */}
          {isListening && (
            <div className="flex items-center gap-1.5 h-6 mb-4">
              <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-6" />
              <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s] h-4" />
              <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.15s] h-5" />
              <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s] h-3" />
            </div>
          )}

          {/* Live Transcribed Speech Feedback */}
          <div className="w-full bg-[#fff9fb] border border-[#f5d8e4] rounded-[18px] p-3.5 min-h-[56px] flex items-center justify-center">
            <p className="text-sm font-bold text-[#141219] break-words">
              {voiceFeedback ? (
                <span className="text-[#D30915] font-black">&ldquo;{voiceFeedback}&rdquo;</span>
              ) : (
                <span className="text-[#8a858f] text-xs">Speak now... e.g. &ldquo;Classic Cola Cash Candle&rdquo;</span>
              )}
            </p>
          </div>

          {/* Quick Test Voice Tags */}
          <div className="mt-4 pt-3 border-t border-[#f4edf2] w-full">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
              Or tap a popular phrase
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['Cash Candles', 'Diamond Ring', 'Cola Soda', 'Bath Bomb Cash'].map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    setVoiceFeedback(phrase);
                    executeSearch(phrase);
                  }}
                  className="px-2.5 py-1 rounded-[10px] bg-white hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>,
      document.body
    )
  }

    </>
  );
};
