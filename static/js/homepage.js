// Homepage JavaScript - Poitiers Collectif

document.addEventListener('DOMContentLoaded', () => {
    // Animation des compteurs
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const speed = 200;

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const increment = target / speed;

            const updateCounter = () => {
                const current = +counter.innerText;
                if (current < target) {
                    counter.innerText = Math.ceil(current + increment);
                    setTimeout(updateCounter, 1);
                } else {
                    counter.innerText = target;
                }
            };

            updateCounter();
        });
    }

    // Intersection Observer pour les animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Si c'est la section stats, lancer l'animation des compteurs
                if (entry.target.classList.contains('stats-section')) {
                    setTimeout(animateCounters, 500);
                }
                
                // Animation des cards avec délai échelonné
                if (entry.target.classList.contains('values-grid')) {
                    const cards = entry.target.querySelectorAll('.value-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
                
                if (entry.target.classList.contains('news-grid')) {
                    const cards = entry.target.querySelectorAll('.news-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 150);
                    });
                }
                
                if (entry.target.classList.contains('events-grid')) {
                    const cards = entry.target.querySelectorAll('.event-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateX(0)';
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observer les éléments à animer
    document.querySelectorAll('.stat-item, .stats-section, .values-grid, .news-grid, .events-grid').forEach(item => {
        observer.observe(item);
    });

    // Initialiser les cards pour l'animation
    document.querySelectorAll('.value-card, .news-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
    });

    document.querySelectorAll('.event-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-30px)';
        card.style.transition = 'all 0.6s ease-out';
    });

    // Smooth scroll pour les liens internes
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Parallax effect pour le hero (optionnel)
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero-modern');
        
        if (hero && scrolled < window.innerHeight) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
        
        ticking = false;
    }

    function requestParallax() {
        if (!ticking && window.innerWidth > 768) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // Activer le parallax seulement sur desktop
    if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.addEventListener('scroll', requestParallax);
    }

    // Lazy loading des images de fond
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.bg) {
                        img.style.backgroundImage = `url(${img.dataset.bg})`;
                        img.classList.remove('lazy-bg');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('.lazy-bg').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Animation du scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.transform = 'translateX(-50%) translateY(20px)';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
            }
        });
    }

    // Gestion des erreurs de chargement d'images
    document.querySelectorAll('.news-image img').forEach(img => {
        img.addEventListener('error', function() {
            this.parentElement.innerHTML = '<span style="font-size: 2rem;">📰</span>';
        });
    });

    // Animation des boutons au clic
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-dark').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Créer l'effet ripple
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Monitoring des performances (optionnel)
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Log des métriques de performance pour debugging
                if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                }
                if (entry.entryType === 'first-input') {
                    console.log('FID:', entry.processingStart - entry.startTime);
                }
                if (entry.entryType === 'layout-shift') {
                    console.log('CLS:', entry.value);
                }
            }
        });

        observer.observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});
    }

    // Gestion du thème et des préférences utilisateur (héritée de modern-theme.js)
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (savedTheme !== document.documentElement.getAttribute('data-theme')) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    // Préchargement des pages importantes
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Précharger les pages importantes quand le navigateur est inactif
            const importantLinks = ['/participer', '/posts', '/events'];
            importantLinks.forEach(link => {
                const linkElement = document.createElement('link');
                linkElement.rel = 'prefetch';
                linkElement.href = link;
                document.head.appendChild(linkElement);
            });
        });
    }

    console.log('🚀 Homepage Poitiers Collectif initialisée avec succès !');
});

// CSS pour l'effet ripple
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        pointer-events: none;
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);