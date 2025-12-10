// Smooth scroll for navigation links
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

// Function to play game
function playGame(gameId) {
    if (gameId === 'rl-pong') {
        // Open the Pong game in a new window (local AI version - no server needed!)
        window.open('../Games/RL-PongGame/frontend/index_local.html', '_blank', 'width=1200,height=800');
    }
}

// Add hover effect to game cards
document.querySelectorAll('.game-card:not(.coming-soon)').forEach(card => {
    card.addEventListener('click', function() {
        const gameId = this.getAttribute('data-game');
        if (gameId) {
            playGame(gameId);
        }
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    const codeSnippet = document.querySelector('.code-snippet');
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.7;
    }
    
    if (codeSnippet && scrolled < window.innerHeight) {
        codeSnippet.style.transform = `translateY(${scrolled * 0.15}px)`;
    }
});

// Intersection Observer for fade-in animations
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

// Observe game cards and sections
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Add active state to navbar on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
        }
    });

    // Animate neurons
    const neurons = document.querySelectorAll('.neuron');
    neurons.forEach((neuron, index) => {
        neuron.style.animationDelay = `${index * 0.2}s`;
    });
});

// Add loading state for play button
document.querySelectorAll('.play-button').forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const originalText = this.innerHTML;
        this.innerHTML = 'Loading...';
        this.style.opacity = '0.7';
        
        setTimeout(() => {
            this.innerHTML = originalText;
            this.style.opacity = '1';
        }, 1000);
    });
});

// Prevent clicks on coming soon cards
document.querySelectorAll('.game-card.coming-soon').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close any modals or return to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Console easter egg
console.log('%c🎮 AI Games Showcase', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cBuilt with ❤️ using Reinforcement Learning', 'font-size: 14px; color: #a0a0a0;');
console.log('%cWant to add your own game? Check out the Games folder!', 'font-size: 12px; color: #8b5cf6;');
