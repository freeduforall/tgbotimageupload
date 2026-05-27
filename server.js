const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;
const photosDir = path.join(__dirname, 'photos');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/photos', express.static(photosDir));

// Store for photo metadata (in production, use a database)
let photoMetadata = [];

// API endpoint to receive photo metadata
app.post('/upload', (req, res) => {
    try {
        const metadata = req.body;
        photoMetadata.push({
            ...metadata,
            id: Date.now().toString(),
            uploadTime: new Date().toISOString()
        });
        
        console.log('Received metadata for:', metadata.fileName);
        res.status(200).json({ success: true, message: 'Metadata received' });
    } catch (error) {
        console.error('Error processing metadata:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API endpoint to get list of photos
app.get('/api/photos', (req, res) => {
    try {
        const files = fs.readdirSync(photosDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
            })
            .map(file => {
                return {
                    name: file,
                    url: `/photos/${file}`
                };
            });
        
        res.json(files);
    } catch (error) {
        console.error('Error reading photos directory:', error);
        res.status(500).json({ error: 'Unable to read photos directory' });
    }
});

// Serve the gallery page
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>priceless capture</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
            }
            
            :root {
                --primary: #6366f1;
                --primary-dark: #4f46e5;
                --secondary: #f472b6;
                --accent: #06b6d4;
                --background: #0f0f0f;
                --surface: #1a1a1a;
                --text: #ffffff;
                --text-secondary: #a1a1aa;
                --border: #27272a;
                --gradient: linear-gradient(135deg, #6366f1, #f472b6, #06b6d4);
            }
            
            body {
                font-family: 'Inter', sans-serif;
                background: var(--background);
                color: var(--text);
                min-height: 100vh;
                overflow-x: hidden;
                padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            }
            
            /* Animated background */
            .background-effects {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                overflow: hidden;
            }
            
            .gradient-orb {
                position: absolute;
                width: 400px;
                height: 400px;
                border-radius: 50%;
                background: var(--gradient);
                filter: blur(80px);
                opacity: 0.1;
                animation: float 20s infinite ease-in-out;
            }
            
            .gradient-orb:nth-child(1) {
                top: -200px;
                left: -200px;
                animation-delay: 0s;
            }
            
            .gradient-orb:nth-child(2) {
                bottom: -200px;
                right: -200px;
                animation-delay: -10s;
            }
            
            @keyframes float {
                0%, 100% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(50px, 50px) scale(1.1); }
                50% { transform: translate(0, 100px) scale(0.9); }
                75% { transform: translate(-50px, 50px) scale(1.05); }
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 12px;
            }
            
            /* Header Styles - Mobile Optimized */
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding: 30px 0 20px;
                position: relative;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                height: 3px;
                background: var(--gradient);
                border-radius: 2px;
            }
            
            .title {
                font-size: clamp(2rem, 8vw, 3.5rem);
                font-weight: 700;
                background: var(--gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 12px;
                opacity: 0;
                line-height: 1.1;
            }
            
            .subtitle {
                font-size: clamp(0.9rem, 4vw, 1.1rem);
                color: var(--text-secondary);
                font-weight: 400;
                opacity: 0;
                line-height: 1.4;
            }
            
            /* Gallery Styles - Mobile First */
            .gallery {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 12px;
                padding: 10px 0;
            }
            
            .photo-card {
                background: var(--surface);
                border-radius: 16px;
                overflow: hidden;
                border: 1px solid var(--border);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                cursor: pointer;
                opacity: 0;
                transform: translateY(30px) scale(0.95);
                touch-action: manipulation;
            }
            
            .photo-card::before {
                content: '';
                position: absolute;
                inset: 0;
                background: var(--gradient);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            
            .photo-card:active {
                transform: scale(0.98);
            }
            
            .photo-card:hover::before,
            .photo-card:focus::before {
                opacity: 0.1;
            }
            
            .photo-card:hover,
            .photo-card:focus {
                transform: translateY(-4px) scale(1.02);
                border-color: var(--primary);
                box-shadow: 
                    0 12px 24px rgba(0, 0, 0, 0.3),
                    0 0 0 1px rgba(99, 102, 241, 0.1);
            }
            
            .photo-image-container {
                position: relative;
                overflow: hidden;
                aspect-ratio: 1;
            }
            
            .photo-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                background: var(--surface);
            }
            
            .photo-card:hover .photo-image,
            .photo-card:focus .photo-image {
                transform: scale(1.08);
            }
            
            .photo-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
                padding: 20px 12px 12px;
                transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .photo-card:hover .photo-overlay,
            .photo-card:focus .photo-overlay {
                transform: translateY(0);
            }
            
            .photo-name {
                font-size: 0.85rem;
                font-weight: 600;
                color: white;
                margin-bottom: 6px;
            }
            
            .view-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                color: var(--text-secondary);
                font-size: 0.75rem;
            }
            
            /* Modal Styles - Mobile Optimized */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.98);
                z-index: 1000;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(20px);
                padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            }
            
            .modal-content {
                max-width: 95vw;
                max-height: 95vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                opacity: 0;
                transform: scale(0.9);
                touch-action: pan-x pan-y;
            }
            
            .close {
                position: absolute;
                top: max(20px, env(safe-area-inset-top));
                right: max(20px, env(safe-area-inset-right));
                color: white;
                font-size: 28px;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.15);
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                z-index: 1001;
                -webkit-touch-callout: none;
            }
            
            .close:active {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(0.95);
            }
            
            .nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.15);
                color: white;
                border: none;
                font-size: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1001;
                -webkit-touch-callout: none;
            }
            
            .nav-btn:active {
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(-50%) scale(0.95);
            }
            
            .prev {
                left: max(15px, env(safe-area-inset-left));
            }
            
            .next {
                right: max(15px, env(safe-area-inset-right));
            }
            
            .image-counter {
                position: absolute;
                bottom: max(20px, env(safe-area-inset-bottom));
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.15);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.85rem;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            /* Loading Animation */
            .loading {
                text-align: center;
                padding: 60px 20px;
                grid-column: 1 / -1;
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid var(--border);
                border-top: 3px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-text {
                color: var(--text-secondary);
                font-size: 1rem;
            }
            
            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                grid-column: 1 / -1;
            }
            
            .empty-icon {
                font-size: 3rem;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .empty-title {
                font-size: 1.3rem;
                color: var(--text);
                margin-bottom: 10px;
            }
            
            .empty-subtitle {
                color: var(--text-secondary);
                margin-bottom: 30px;
                font-size: 0.95rem;
            }
            
            .refresh-btn {
                background: var(--gradient);
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                touch-action: manipulation;
            }
            
            .refresh-btn:active {
                transform: scale(0.95);
            }
            
            /* Swipe indicators for mobile */
            .swipe-hint {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                color: var(--text-secondary);
                font-size: 0.8rem;
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 8px 16px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            /* Responsive Design - Mobile First */
            @media (min-width: 480px) {
                .container {
                    padding: 16px;
                }
                
                .gallery {
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 16px;
                }
                
                .header {
                    margin-bottom: 50px;
                    padding: 40px 0 30px;
                }
            }
            
            @media (min-width: 768px) {
                .gallery {
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                }
                
                .photo-card:hover {
                    transform: translateY(-6px) scale(1.02);
                }
                
                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-50%) scale(1.05);
                }
                
                .close:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: scale(1.05);
                }
            }
            
            @media (min-width: 1024px) {
                .gallery {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 24px;
                }
                
                .container {
                    padding: 20px;
                }
            }
            
            /* Hide scrollbar for modal touch scrolling */
            .modal-content::-webkit-scrollbar {
                display: none;
            }
            
            .modal-content {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        </style>
    </head>
    <body>
        <!-- Animated Background -->
        <div class="background-effects">
            <div class="gradient-orb"></div>
            <div class="gradient-orb"></div>
        </div>
        
        <div class="container">
            <!-- Header -->
            <header class="header">
                <h1 class="title">priceless capture</h1>
                <p class="subtitle">Immersive Photography Experience</p>
            </header>
            
            <!-- Gallery -->
            <div class="gallery" id="gallery">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading Visual Experience</div>
                </div>
            </div>
        </div>
        
        <!-- Swipe Hint -->
        <div class="swipe-hint" id="swipeHint">Swipe to navigate</div>
        
        <!-- Modal -->
        <div class="modal" id="imageModal">
            <span class="close" id="closeModal">&times;</span>
            <button class="nav-btn prev" id="prevBtn">‹</button>
            <button class="nav-btn next" id="nextBtn">›</button>
            <img class="modal-content" id="modalImage">
            <div class="image-counter" id="imageCounter"></div>
        </div>

        <script>
            // GSAP Animations
            gsap.registerPlugin(ScrollTrigger);
            
            let currentPhotos = [];
            let currentImageIndex = 0;
            let touchStartX = 0;
            let touchEndX = 0;
            
            const gallery = document.getElementById('gallery');
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');
            const closeModal = document.getElementById('closeModal');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const imageCounter = document.getElementById('imageCounter');
            const swipeHint = document.getElementById('swipeHint');
            
            // Initialize page animations
            document.addEventListener('DOMContentLoaded', function() {
                // Animate header elements
                const tl = gsap.timeline();
                tl.to('.title', { duration: 1, opacity: 1, y: 0, ease: 'power3.out' })
                  .to('.subtitle', { duration: 0.8, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.5');
                
                // Optimized background animations for mobile
                gsap.to('.gradient-orb:nth-child(1)', {
                    duration: 25,
                    x: 50,
                    y: 50,
                    scale: 1.1,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut'
                });
                
                gsap.to('.gradient-orb:nth-child(2)', {
                    duration: 30,
                    x: -50,
                    y: -50,
                    scale: 1.05,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut'
                });
                
                // Load photos
                loadPhotos();
                
                // Show swipe hint on mobile
                if (isMobile()) {
                    setTimeout(() => {
                        gsap.to(swipeHint, { duration: 0.5, opacity: 1 });
                        setTimeout(() => {
                            gsap.to(swipeHint, { duration: 0.5, opacity: 0, delay: 2 });
                        }, 3005);
                    }, 2000);
                }
            });
            
            function isMobile() {
                return window.innerWidth <= 768;
            }
            
            async function loadPhotos() {
                try {
                    gallery.innerHTML = \`
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Loading Visual Experience</div>
                        </div>
                    \`;
                    
                    const response = await fetch('/api/photos');
                    if (!response.ok) throw new Error('Network response was not ok');
                    
                    const photos = await response.json();
                    currentPhotos = photos;
                    
                    if (photos.length === 0) {
                        showEmptyState();
                        return;
                    }
                    
                    renderGallery(photos);
                    
                } catch (error) {
                    console.error('Error loading photos:', error);
                    showErrorState();
                }
            }
            
            function renderGallery(photos) {
                gallery.innerHTML = photos.map((photo, index) => \`
                    <div class="photo-card" data-index="\${index}" role="button" tabindex="0" aria-label="View image \${index + 1}">
                        <div class="photo-image-container">
                            <img src="\${photo.url}" 
                                 alt="Visual \${index + 1}" 
                                 class="photo-image"
                                 loading="lazy"
                                 onerror="handleImageError(this)">
                            <div class="photo-overlay">
                                <div class="photo-name">Visual \${index + 1}</div>
                                <div class="view-indicator">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Tap to view
                                </div>
                            </div>
                        </div>
                    </div>
                \`).join('');
                
                // Optimized animations for mobile
                const staggerTime = isMobile() ? 0.05 : 0.08;
                
                gsap.to('.photo-card', {
                    duration: 0.6,
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    stagger: staggerTime,
                    ease: 'power2.out',
                    delay: 0.2
                });
                
                // Add scroll animations only on desktop
                if (!isMobile()) {
                    ScrollTrigger.batch('.photo-card', {
                        onEnter: batch => gsap.to(batch, {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            stagger: 0.1,
                            duration: 0.6,
                            ease: 'power2.out'
                        }),
                        start: 'top 90%'
                    });
                }
                
                // Add click/touch events
                document.querySelectorAll('.photo-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        e.preventDefault();
                        const index = parseInt(card.getAttribute('data-index'));
                        openModal(index);
                    });
                    
                    // Keyboard support
                    card.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const index = parseInt(card.getAttribute('data-index'));
                            openModal(index);
                        }
                    });
                });
            }
            
            function showEmptyState() {
                gallery.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">📷</div>
                        <div class="empty-title">Gallery is Empty</div>
                        <div class="empty-subtitle">Add some images to begin the visual journey</div>
                        <button class="refresh-btn" onclick="loadPhotosWithAnimation()">
                            Explore Gallery
                        </button>
                    </div>
                \`;
            }
            
            function showErrorState() {
                gallery.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <div class="empty-title">Connection Lost</div>
                        <div class="empty-subtitle">Unable to load the visual experience</div>
                        <button class="refresh-btn" onclick="loadPhotosWithAnimation()">
                            Reconnect
                        </button>
                    </div>
                \`;
            }
            
            function handleImageError(img) {
                const svgPlaceholder = \`data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMWExYTFhIi8+CjxwYXRoIGQ9Ik0xMjAgMTIwVjE4MEgxODBWMTIwSDEyMFpNMTIwIDE4MEgxMDBWMjAwSDE4MFYxODBIMjAwVjE0MEgxODBWMTIwSDEyMFYxNDBIMTAwVjE4MEgxMjBaIiBmaWxsPSIjMjcyNzI3IiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4K\`;
                img.src = svgPlaceholder;
            }
            
            function openModal(index) {
                currentImageIndex = index;
                modal.style.display = 'flex';
                modalImage.src = currentPhotos[currentImageIndex].url;
                updateImageCounter();
                
                // Add touch events for swipe navigation
                modalImage.addEventListener('touchstart', handleTouchStart, { passive: true });
                modalImage.addEventListener('touchend', handleTouchEnd, { passive: true });
                
                // Optimized modal animation for mobile
                const animationDuration = isMobile() ? 0.4 : 0.6;
                
                gsap.fromTo('.modal-content', 
                    { opacity: 0, scale: 0.9 },
                    { duration: animationDuration, opacity: 1, scale: 1, ease: 'back.out(1.5)' }
                );
                
                gsap.fromTo(['.close', '.nav-btn', '.image-counter'],
                    { opacity: 0, y: 15 },
                    { duration: 0.3, opacity: 1, y: 0, stagger: 0.1, delay: 0.2 }
                );
            }
            
            function closeModalFunc() {
                // Remove touch events
                modalImage.removeEventListener('touchstart', handleTouchStart);
                modalImage.removeEventListener('touchend', handleTouchEnd);
                
                gsap.to('.modal-content', {
                    duration: 0.3,
                    opacity: 0,
                    scale: 0.9,
                    ease: 'power2.in',
                    onComplete: () => {
                        modal.style.display = 'none';
                    }
                });
            }
            
            function navigate(direction) {
                currentImageIndex = (currentImageIndex + direction + currentPhotos.length) % currentPhotos.length;
                
                gsap.to(modalImage, {
                    duration: 0.2,
                    opacity: 0,
                    scale: 0.95,
                    onComplete: () => {
                        modalImage.src = currentPhotos[currentImageIndex].url;
                        updateImageCounter();
                        gsap.to(modalImage, {
                            duration: 0.2,
                            opacity: 1,
                            scale: 1
                        });
                    }
                });
            }
            
            function updateImageCounter() {
                imageCounter.textContent = \`\${currentImageIndex + 1} / \${currentPhotos.length}\`;
            }
            
            function loadPhotosWithAnimation() {
                gsap.to(gallery, {
                    duration: 0.2,
                    opacity: 0,
                    y: 10,
                    onComplete: loadPhotos
                });
            }
            
            // Touch swipe handling for mobile
            function handleTouchStart(event) {
                touchStartX = event.changedTouches[0].screenX;
            }
            
            function handleTouchEnd(event) {
                touchEndX = event.changedTouches[0].screenX;
                handleSwipe();
            }
            
            function handleSwipe() {
                const swipeThreshold = 50;
                const difference = touchStartX - touchEndX;
                
                if (Math.abs(difference) > swipeThreshold) {
                    if (difference > 0) {
                        navigate(1); // Swipe left - next
                    } else {
                        navigate(-1); // Swipe right - previous
                    }
                }
            }
            
            // Event listeners
            closeModal.addEventListener('click', closeModalFunc);
            prevBtn.addEventListener('click', () => navigate(-1));
            nextBtn.addEventListener('click', () => navigate(1));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModalFunc();
                }
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (modal.style.display === 'flex') {
                    if (e.key === 'ArrowLeft') {
                        navigate(-1);
                    } else if (e.key === 'ArrowRight') {
                        navigate(1);
                    } else if (e.key === 'Escape') {
                        closeModalFunc();
                    }
                }
            });
            
            // Auto-refresh every 60 seconds
            setInterval(loadPhotosWithAnimation, 60000);
            
            // Optimized mouse move effect only for desktop
            if (!isMobile()) {
                document.addEventListener('mousemove', (e) => {
                    const x = (e.clientX / window.innerWidth - 0.5) * 10;
                    const y = (e.clientY / window.innerHeight - 0.5) * 10;
                    
                    gsap.to('.background-effects', {
                        duration: 1,
                        x: x,
                        y: y,
                        ease: 'power2.out'
                    });
                });
            }
        </script>
    </body>
    </html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🎨 priceless capture available at http://localhost:${PORT}`);
    console.log(`🔗 API endpoint available at http://localhost:${PORT}/api/photos`);
});
