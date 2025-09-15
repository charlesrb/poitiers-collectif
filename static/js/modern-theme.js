// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Animer les cards de la sidebar
    document.querySelectorAll('.sidebar-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(card);
    });

    // Smooth scroll pour les liens internes
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header background au scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (window.scrollY > 100) {
            if (isDark) {
                header.style.background = 'rgba(15, 23, 42, 0.95)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
            header.style.backdropFilter = 'blur(25px)';
        } else {
            if (isDark) {
                header.style.background = 'rgba(15, 23, 42, 0.85)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.85)';
            }
            header.style.backdropFilter = 'blur(20px)';
        }
    });

    // Focus amélioration pour l'accessibilité
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = document.getElementById('theme-icon');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    if (mobileThemeIcon) mobileThemeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
});

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const themeIcon = document.getElementById('theme-icon');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    
    document.documentElement.setAttribute('data-theme', newTheme);
    if (themeIcon) themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    if (mobileThemeIcon) mobileThemeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Sauvegarder la préférence
    localStorage.setItem('theme', newTheme);
    
    // Trigger scroll event pour mettre à jour le header
    window.dispatchEvent(new Event('scroll'));
}

// Toggle menu mobile
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const btn = document.querySelector('.mobile-menu-btn');
    mobileNav.classList.toggle('active');
    btn.classList.toggle('active');
}

// Initialiser la recherche mobile
window.addEventListener('DOMContentLoaded', (event) => {
    // Initialiser la recherche mobile si elle existe
    if (document.getElementById('mobile-search')) {
        new PagefindUI({ 
            element: "#mobile-search",
            showSubResults: true,
            showEmptyFilters: false,
            resetStyles: false,
            translations: {
                placeholder: "Rechercher...",
                clear_search: "Effacer",
                load_more: "Voir plus",
                search_label: "Recherche",
                filters_label: "Filtres",
                zero_results: "Aucun résultat pour [SEARCH_TERM]",
                many_results: "[COUNT] résultats pour [SEARCH_TERM]",
                one_result: "1 résultat pour [SEARCH_TERM]",
                alt_search: "Aucun résultat pour [SEARCH_TERM]. Voici les résultats pour [DIFFERENT_TERM]",
                search_suggestion: "Essayez de chercher [DIFFERENT_TERM]",
                searching: "Recherche de [SEARCH_TERM]..."
            }
        });
    }
});

// Performance: Lazy load des images
document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// Service Worker pour la mise en cache (PWA ready)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}