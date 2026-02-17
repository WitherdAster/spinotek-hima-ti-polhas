// Spinotek Future-Lab - Interactive JavaScript

// ========================================
// USER AUTHENTICATION & SESSION
// ========================================

let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const userSession = localStorage.getItem('spinotek_current_user');
    if (userSession) {
        currentUser = JSON.parse(userSession);
        return true;
    }
    return false;
}

// Show Auth Modal
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Hide Auth Modal
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Logout function
function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('spinotek_current_user');
        currentUser = null;
        userXP = 0;
        completedChallenges = [];
        
        // Hide user info, show login button
        hideUserInfo();
        showLoginButton();
        
        // Re-render challenges to reset state
        renderChallenges();
        
        showNotification('Logout berhasil!', 'success');
    }
}

// Show/Hide User Info
function showUserInfo() {
    // Desktop
    const userInfoDesktop = document.getElementById('userInfoDesktop');
    const xpCounterDesktop = document.getElementById('xpCounterDesktop');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtnDesktop = document.getElementById('loginBtnDesktop');
    
    if (userInfoDesktop) userInfoDesktop.classList.remove('hidden');
    if (userInfoDesktop) userInfoDesktop.classList.add('flex');
    if (xpCounterDesktop) xpCounterDesktop.classList.remove('hidden');
    if (xpCounterDesktop) xpCounterDesktop.classList.add('flex');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (loginBtnDesktop) loginBtnDesktop.classList.add('hidden');
    
    // Mobile
    const userInfoMobile = document.getElementById('userInfoMobile');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    
    if (userInfoMobile) userInfoMobile.classList.remove('hidden');
    if (userInfoMobile) userInfoMobile.classList.add('flex');
    if (logoutBtnMobile) logoutBtnMobile.classList.remove('hidden');
    if (loginBtnMobile) loginBtnMobile.classList.add('hidden');
}

function hideUserInfo() {
    // Desktop
    const userInfoDesktop = document.getElementById('userInfoDesktop');
    const xpCounterDesktop = document.getElementById('xpCounterDesktop');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userInfoDesktop) userInfoDesktop.classList.add('hidden');
    if (userInfoDesktop) userInfoDesktop.classList.remove('flex');
    if (xpCounterDesktop) xpCounterDesktop.classList.add('hidden');
    if (xpCounterDesktop) xpCounterDesktop.classList.remove('flex');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    
    // Mobile
    const userInfoMobile = document.getElementById('userInfoMobile');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    
    if (userInfoMobile) userInfoMobile.classList.add('hidden');
    if (userInfoMobile) userInfoMobile.classList.remove('flex');
    if (logoutBtnMobile) logoutBtnMobile.classList.add('hidden');
}

function showLoginButton() {
    const loginBtnDesktop = document.getElementById('loginBtnDesktop');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    
    if (loginBtnDesktop) loginBtnDesktop.classList.remove('hidden');
    if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
}

// Setup Login Buttons
function setupLoginButtons() {
    const loginBtnDesktop = document.getElementById('loginBtnDesktop');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    
    if (loginBtnDesktop) {
        loginBtnDesktop.addEventListener('click', showAuthModal);
    }
    if (loginBtnMobile) {
        loginBtnMobile.addEventListener('click', () => {
            showAuthModal();
            // Close mobile menu
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        });
    }
}

// Update user data in localStorage
function updateUserData() {
    if (currentUser) {
        // Update in users array
        const users = JSON.parse(localStorage.getItem('spinotek_users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('spinotek_users', JSON.stringify(users));
        }
        // Update current session
        localStorage.setItem('spinotek_current_user', JSON.stringify(currentUser));
    }
}

// Get Users from LocalStorage
function getUsers() {
    const users = localStorage.getItem('spinotek_users');
    return users ? JSON.parse(users) : [];
}

// Save Users to LocalStorage
function saveUsers(users) {
    localStorage.setItem('spinotek_users', JSON.stringify(users));
}

// Create Demo Account if not exists
function initDemoAccount() {
    const users = getUsers();
    const demoExists = users.find(u => u.email === 'demo@spinotek.com');
    
    if (!demoExists) {
        users.push({
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@spinotek.com',
            password: 'demo123',
            xp: 0,
            completedChallenges: [],
            level: 1,
            badges: [],
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
    }
}

// Toggle Password Visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-glow z-50 animate-slideInRight ${
        type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
            : 'bg-gradient-to-r from-red-500 to-rose-500'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl"></i>
            <span class="font-semibold">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Setup Auth System
function setupAuthSystem() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Tab Switching
    if (loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
            loginTab.classList.remove('text-gray-600');
            registerTab.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
            registerTab.classList.add('text-gray-600');
            
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        });
    }
    
    if (registerTab) {
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
            registerTab.classList.remove('text-gray-600');
            loginTab.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
            loginTab.classList.add('text-gray-600');
            
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }
    
    // Register Handler
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim().toLowerCase();
            const password = document.getElementById('registerPassword').value;
            const errorDiv = document.getElementById('registerError');
            const errorSpan = errorDiv.querySelector('span');
            
            // Validation
            if (name.length < 3) {
                errorSpan.textContent = 'Nama minimal 3 karakter';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            if (password.length < 6) {
                errorSpan.textContent = 'Password minimal 6 karakter';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            // Check if email already exists
            const users = getUsers();
            const emailExists = users.find(u => u.email === email);
            
            if (emailExists) {
                errorSpan.textContent = 'Email sudah terdaftar';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            // Create new user
            const newUser = {
                id: 'user-' + Date.now(),
                name: name,
                email: email,
                password: password,
                xp: 0,
                completedChallenges: [],
                level: 1,
                badges: [],
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveUsers(users);
            
            // Show success message
            showNotification('Registrasi berhasil! Silakan login.', 'success');
            
            // Switch to login tab
            setTimeout(() => {
                loginTab.click();
                document.getElementById('loginEmail').value = email;
            }, 1500);
            
            // Reset form
            registerForm.reset();
            errorDiv.classList.add('hidden');
        });
    }
    
    // Login Handler
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            const errorSpan = errorDiv.querySelector('span');
            
            // Find user
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            
            if (!user) {
                errorSpan.textContent = 'Email atau password salah';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            // Save current user session
            currentUser = user;
            localStorage.setItem('spinotek_current_user', JSON.stringify(user));
            
            // Show success and hide modal
            showNotification('Login berhasil! Selamat datang ' + user.name, 'success');
            hideAuthModal();
            
            // Initialize user data and update UI
            initUserData();
            updateXPDisplay();
            showUserInfo();
            renderChallenges();
            
            // Reset form
            loginForm.reset();
            errorDiv.classList.add('hidden');
        });
    }
}

// ========================================
// DATA DUMMY (Array of Objects)
// ========================================

const techRadarData = [
    {
        id: 1,
        name: 'Laravel',
        description: 'PHP framework terbaik untuk membangun aplikasi web modern dengan elegant syntax',
        status: 'Hot',
        iconClass: 'fa-brands fa-laravel',
        color: 'from-red-500 to-orange-500'
    },
    {
        id: 2,
        name: 'Tailwind CSS',
        description: 'Utility-first CSS framework untuk styling yang cepat dan konsisten',
        status: 'Hot',
        iconClass: 'fa-brands fa-css3-alt',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        id: 3,
        name: 'FilamentPHP',
        description: 'Admin panel builder yang powerful untuk Laravel dengan UI yang stunning',
        status: 'New',
        iconClass: 'fa-solid fa-layer-group',
        color: 'from-amber-500 to-yellow-500'
    },
    {
        id: 4,
        name: 'Vibe Coding',
        description: 'Metodologi coding yang fokus pada developer experience dan produktivitas',
        status: 'New',
        iconClass: 'fa-solid fa-code',
        color: 'from-purple-500 to-pink-500'
    }
];

const challengesData = [
    {
        id: 1,
        title: 'Slice Navbar Responsive',
        description: 'Buat navbar responsive dengan mobile menu dan smooth scroll',
        xp_reward: 150,
        difficulty: 'Easy',
        difficultyColor: 'text-green-600 bg-green-50',
        icon: 'fa-solid fa-bars',
        estimatedTime: '2-3 hours',
        prerequisites: ['HTML', 'CSS', 'JavaScript'],
        steps: [
            'Buat struktur HTML navbar dengan logo dan menu items',
            'Style navbar dengan CSS/Tailwind (fixed position, backdrop blur)',
            'Tambahkan hamburger menu untuk mobile',
            'Implementasi toggle menu dengan JavaScript',
            'Tambahkan smooth scroll untuk navigation links'
        ],
        hints: [
            'Gunakan position: fixed untuk navbar yang sticky',
            'Media query untuk responsive: @media (max-width: 768px)',
            'classList.toggle() untuk show/hide mobile menu'
        ],
        codeSnippet: `<!-- HTML Structure -->
<nav class="navbar">
  <div class="logo">Brand</div>
  <ul class="menu">
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
  </ul>
  <button class="hamburger">☰</button>
</nav>

/* CSS */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  backdrop-filter: blur(10px);
}

// JavaScript
const hamburger = document.querySelector('.hamburger');
hamburger.addEventListener('click', () => {
  menu.classList.toggle('active');
});`,
        bonusXP: 50,
        bonusCondition: 'Complete dalam < 2 jam'
    },
    {
        id: 2,
        title: 'Buat API Route CRUD',
        description: 'Implementasi RESTful API dengan Laravel untuk operasi CRUD',
        xp_reward: 300,
        difficulty: 'Medium',
        difficultyColor: 'text-yellow-600 bg-yellow-50',
        icon: 'fa-solid fa-route',
        estimatedTime: '4-5 hours',
        prerequisites: ['PHP', 'Laravel', 'MySQL', 'Postman'],
        steps: [
            'Setup Laravel project dan database',
            'Buat migration dan model untuk resource',
            'Buat controller dengan method CRUD',
            'Define routes di routes/api.php',
            'Test API dengan Postman',
            'Tambahkan validation dan error handling'
        ],
        hints: [
            'Gunakan php artisan make:model -mcr untuk generate files',
            'Route::apiResource() untuk CRUD routes otomatis',
            'Gunakan Form Request untuk validation'
        ],
        codeSnippet: `// Migration
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('content');
    $table->timestamps();
});

// Controller
public function index() {
    return Post::all();
}

public function store(Request $request) {
    $validated = $request->validate([
        'title' => 'required|max:255',
        'content' => 'required'
    ]);
    return Post::create($validated);
}

// Routes
Route::apiResource('posts', PostController::class);`,
        bonusXP: 100,
        bonusCondition: 'Include authentication & pagination'
    },
    {
        id: 3,
        title: 'Integrasi Payment Gateway',
        description: 'Setup payment gateway dengan Midtrans atau Xendit',
        xp_reward: 500,
        difficulty: 'Hard',
        difficultyColor: 'text-red-600 bg-red-50',
        icon: 'fa-solid fa-credit-card',
        estimatedTime: '8-10 hours',
        prerequisites: ['Laravel', 'API Integration', 'Webhook', 'Security'],
        steps: [
            'Register akun Midtrans/Xendit dan dapatkan API keys',
            'Install package payment gateway',
            'Buat model Transaction dan migration',
            'Implementasi create transaction endpoint',
            'Setup webhook untuk payment notification',
            'Handle payment status (pending, success, failed)',
            'Test dengan sandbox environment'
        ],
        hints: [
            'Simpan API keys di .env file',
            'Gunakan queue untuk handle webhook',
            'Validate webhook signature untuk security'
        ],
        codeSnippet: `// Install Package
composer require midtrans/midtrans-php

// Config
\\Midtrans\\Config::$serverKey = env('MIDTRANS_SERVER_KEY');
\\Midtrans\\Config::$isProduction = false;

// Create Transaction
$params = [
    'transaction_details' => [
        'order_id' => $orderId,
        'gross_amount' => $amount,
    ],
    'customer_details' => [
        'first_name' => $user->name,
        'email' => $user->email,
    ]
];

$snapToken = \\Midtrans\\Snap::getSnapToken($params);

// Webhook Handler
public function webhook(Request $request) {
    $notification = new \\Midtrans\\Notification();
    $transaction = Transaction::find($notification->order_id);
    
    if ($notification->transaction_status == 'settlement') {
        $transaction->status = 'paid';
        $transaction->save();
    }
}`,
        bonusXP: 200,
        bonusCondition: 'Include refund functionality'
    },
    {
        id: 4,
        title: 'Deploy ke Production',
        description: 'Deploy aplikasi Laravel ke server production dengan CI/CD',
        xp_reward: 250,
        difficulty: 'Medium',
        difficultyColor: 'text-yellow-600 bg-yellow-50',
        icon: 'fa-solid fa-rocket',
        estimatedTime: '3-4 hours',
        prerequisites: ['Linux', 'Git', 'SSH', 'Nginx/Apache'],
        steps: [
            'Setup VPS (DigitalOcean, AWS, atau Vultr)',
            'Install LEMP/LAMP stack',
            'Clone repository dari Git',
            'Setup environment variables',
            'Run migrations dan seeders',
            'Configure Nginx/Apache virtual host',
            'Setup SSL certificate (Let\'s Encrypt)',
            'Configure CI/CD dengan GitHub Actions'
        ],
        hints: [
            'Gunakan Laravel Forge untuk easy deployment',
            'Jangan commit .env file ke Git',
            'Setup automatic deployment dengan webhook'
        ],
        codeSnippet: `# GitHub Actions (.github/workflows/deploy.yml)
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: \${{ secrets.HOST }}
          username: \${{ secrets.USERNAME }}
          key: \${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/myapp
            git pull origin main
            composer install --no-dev
            php artisan migrate --force
            php artisan config:cache
            php artisan route:cache

# Nginx Config
server {
    listen 80;
    server_name example.com;
    root /var/www/myapp/public;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}`,
        bonusXP: 100,
        bonusCondition: 'Setup monitoring & auto-scaling'
    }
];

// ========================================
// USER XP SYSTEM
// ========================================

let userXP = 0;
let completedChallenges = [];

// Initialize user data
function initUserData() {
    if (currentUser) {
        userXP = currentUser.xp || 0;
        completedChallenges = currentUser.completedChallenges || [];
    }
}

// Update XP Display
function updateXPDisplay() {
    const xpElement = document.getElementById('user-xp');
    const xpElementMobile = document.getElementById('user-xp-mobile');
    const userNameElement = document.getElementById('user-name');
    const userNameElementMobile = document.getElementById('user-name-mobile');
    const userLevelElement = document.getElementById('user-level');
    const userLevelElementMobile = document.getElementById('user-level-mobile');
    
    if (xpElement) {
        xpElement.textContent = userXP;
    }
    if (xpElementMobile) {
        xpElementMobile.textContent = userXP;
    }
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
    }
    if (userNameElementMobile && currentUser) {
        userNameElementMobile.textContent = currentUser.name;
    }
    if (userLevelElement && currentUser) {
        const level = Math.floor(userXP / 500) + 1;
        userLevelElement.textContent = `Level ${level}`;
    }
    if (userLevelElementMobile && currentUser) {
        const level = Math.floor(userXP / 500) + 1;
        userLevelElementMobile.textContent = `Level ${level}`;
    }
}

// Save to LocalStorage
function saveProgress() {
    if (currentUser) {
        currentUser.xp = userXP;
        currentUser.completedChallenges = completedChallenges;
        updateUserData();
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderTechRadar() {
    const container = document.getElementById('tech-radar-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    techRadarData.forEach((tech, index) => {
        const statusBadgeColor = tech.status === 'Hot' 
            ? 'bg-red-100 text-red-600' 
            : 'bg-green-100 text-green-600';
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-transparent hover:border-primary/20';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', index * 100);
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="w-14 h-14 bg-gradient-to-br ${tech.color} rounded-xl flex items-center justify-center text-white text-2xl">
                    <i class="${tech.iconClass}"></i>
                </div>
                <span class="px-3 py-1 ${statusBadgeColor} text-xs font-semibold rounded-full">
                    ${tech.status}
                </span>
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900">${tech.name}</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-4">${tech.description}</p>
            <button class="w-full px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm hover:shadow-glow transition-all duration-300" onclick="showTechDetail(${tech.id})">
                Learn More
            </button>
        `;
        
        container.appendChild(card);
    });
}

function renderChallenges() {
    const container = document.getElementById('challenges-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    challengesData.forEach((challenge, index) => {
        const isCompleted = completedChallenges.includes(challenge.id);
        const isLocked = !currentUser;
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary/20 relative overflow-hidden';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', index * 100);
        
        // Add locked overlay if not logged in
        if (isLocked) {
            card.classList.add('opacity-75');
        }
        
        card.innerHTML = `
            ${isLocked ? '<div class="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"><i class="fa-solid fa-lock text-gray-400 text-3xl"></i></div>' : ''}
            
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-xl">
                    <i class="${challenge.icon}"></i>
                </div>
                <span class="px-3 py-1 ${challenge.difficultyColor} text-xs font-semibold rounded-full">
                    ${challenge.difficulty}
                </span>
            </div>
            
            <h3 class="text-lg font-bold mb-2 text-gray-900">${challenge.title}</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-3">${challenge.description}</p>
            
            <div class="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <i class="fa-solid fa-clock"></i>
                <span>${challenge.estimatedTime}</span>
                ${challenge.bonusXP ? `<span class="ml-auto text-amber-600 font-semibold"><i class="fa-solid fa-star"></i> +${challenge.bonusXP} Bonus</span>` : ''}
            </div>
            
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">⚡</span>
                    <span class="font-bold text-primary">+${challenge.xp_reward} XP</span>
                </div>
                
                <div class="flex gap-2">
                    <button 
                        onclick="showChallengeDetail(${challenge.id})"
                        class="px-3 py-2 bg-white border-2 border-primary text-primary rounded-lg font-semibold text-xs hover:bg-primary hover:text-white transition-all duration-300"
                        ${isLocked ? 'disabled' : ''}
                    >
                        <i class="fa-solid fa-info-circle"></i>
                    </button>
                    
                    <button 
                        class="challenge-btn px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${
                            isCompleted 
                                ? 'bg-green-100 text-green-600 cursor-not-allowed' 
                                : isLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-glow'
                        }"
                        data-challenge-id="${challenge.id}"
                        data-xp="${challenge.xp_reward}"
                        ${isCompleted || isLocked ? 'disabled' : ''}
                    >
                        ${isCompleted ? '✓ Done' : isLocked ? '<i class="fa-solid fa-lock"></i>' : 'Start'}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Add event listeners to challenge buttons
    attachChallengeListeners();
    
    // Update progress display
    updateChallengeProgress();
}

// Update Challenge Progress
function updateChallengeProgress() {
    const progressSection = document.getElementById('challengeProgress');
    const loginCTA = document.getElementById('challengeLoginCTA');
    
    if (currentUser) {
        // Show progress, hide CTA
        if (progressSection) {
            progressSection.classList.remove('hidden');
            progressSection.classList.add('block');
        }
        if (loginCTA) loginCTA.classList.add('hidden');
        
        // Update progress values
        const totalChallenges = challengesData.length;
        const completed = completedChallenges.length;
        const percentage = (completed / totalChallenges) * 100;
        
        const completedCount = document.getElementById('completedCount');
        const progressBar = document.getElementById('progressBar');
        const totalEarnedXP = document.getElementById('totalEarnedXP');
        const userRank = document.getElementById('userRank');
        
        if (completedCount) completedCount.textContent = `${completed}/${totalChallenges}`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (totalEarnedXP) totalEarnedXP.textContent = userXP;
        
        // Calculate rank
        if (userRank) {
            let rank = 'Beginner';
            if (userXP >= 1000) rank = 'Master';
            else if (userXP >= 500) rank = 'Expert';
            else if (userXP >= 200) rank = 'Intermediate';
            userRank.textContent = rank;
        }
    } else {
        // Hide progress, show CTA
        if (progressSection) progressSection.classList.add('hidden');
        if (loginCTA) {
            loginCTA.classList.remove('hidden');
            loginCTA.classList.add('block');
        }
    }
}

// ========================================
// CHALLENGE INTERACTIVITY
// ========================================

function attachChallengeListeners() {
    const challengeButtons = document.querySelectorAll('.challenge-btn');
    
    challengeButtons.forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', function() {
                const challengeId = parseInt(this.getAttribute('data-challenge-id'));
                const xpReward = parseInt(this.getAttribute('data-xp'));
                
                completeChallenge(challengeId, xpReward, this);
            });
        }
    });
}

function completeChallenge(challengeId, xpReward, buttonElement) {
    // Check if user is logged in
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu untuk menyelesaikan challenge', 'error');
        showAuthModal();
        return;
    }
    
    // Check if already completed
    if (completedChallenges.includes(challengeId)) {
        showNotification('Challenge sudah diselesaikan!', 'error');
        return;
    }
    
    // Add XP
    userXP += xpReward;
    
    // Mark as completed
    completedChallenges.push(challengeId);
    
    // Save progress to localStorage
    saveProgress();
    
    // Update UI - INI YANG MEMBUAT PROGRESS BAR BERUBAH!
    updateXPDisplay();
    updateChallengeProgress(); // Update progress bar, rank, dll
    
    // Animate button if provided
    if (buttonElement) {
        buttonElement.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'hover:shadow-glow');
        buttonElement.classList.add('bg-green-100', 'text-green-600', 'cursor-not-allowed');
        buttonElement.innerHTML = '✓ Completed';
        buttonElement.disabled = true;
    }
    
    // Show notification
    const challenge = challengesData.find(c => c.id === challengeId);
    showNotification(`🎉 Challenge "${challenge.title}" Completed! +${xpReward} XP earned`, 'success');
    
    // Confetti effect
    if (buttonElement) {
        createConfetti(buttonElement);
    }
    
    // Check for level up
    checkLevelUp();
}

function createConfetti(element) {
    const rect = element.getBoundingClientRect();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];
    
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = rect.left + rect.width / 2 + 'px';
        confetti.style.top = rect.top + rect.height / 2 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
        confetti.style.setProperty('--ty', (Math.random() - 0.5) * 200 + 'px');
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 1000);
    }
}

// Confetti at center of screen
function createConfettiAtCenter() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = centerX + 'px';
        confetti.style.top = centerY + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--tx', (Math.random() - 0.5) * 400 + 'px');
        confetti.style.setProperty('--ty', (Math.random() - 0.5) * 400 + 'px');
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 1500);
    }
}

// Check for level up
function checkLevelUp() {
    const oldLevel = Math.floor((userXP - challengesData[challengesData.length - 1].xp_reward) / 500) + 1;
    const newLevel = Math.floor(userXP / 500) + 1;
    
    if (newLevel > oldLevel) {
        // Level up!
        setTimeout(() => {
            showLevelUpNotification(newLevel);
            createConfettiAtCenter();
        }, 1000);
    }
}

// Show level up notification
function showLevelUpNotification(level) {
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    
    notification.innerHTML = `
        <div class="glass-panel max-w-md w-full rounded-2xl p-8 text-center animate-scaleIn">
            <div class="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <i class="fa-solid fa-trophy text-white text-4xl"></i>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Level Up!</h2>
            <p class="text-xl text-gray-600 mb-6">
                Selamat! Kamu naik ke <span class="font-bold text-primary">Level ${level}</span>
            </p>
            <button onclick="this.closest('.fixed').remove(); document.body.style.overflow = ''" class="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300">
                Awesome! 🎉
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    document.body.style.overflow = 'hidden';
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
            document.body.style.overflow = '';
        }
    }, 5000);
}

// ========================================
// MOBILE MENU & NAVIGATION
// ========================================

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when clicking on a link
const mobileLinks = document.querySelectorAll('.nav-link-mobile');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// Navbar Scroll Effect
let lastScroll = 0;
const navbar = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for Fade In Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all feature and project cards
document.querySelectorAll('.feature-card, .project-card').forEach(card => {
    observer.observe(card);
});

// Counter Animation for Stats
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16);
    
    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    };
    
    updateCounter();
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.text-3xl');
            counters.forEach((counter, index) => {
                const targets = [500, 10000, 98];
                const originalText = counter.textContent;
                counter.textContent = '0+';
                setTimeout(() => {
                    animateCounter(counter, targets[index]);
                }, index * 200);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.flex.items-center.gap-8.pt-4');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.glass-card');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Button Ripple Effect
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
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

// Add ripple styles dynamically
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Lazy Loading for Images (if you add images later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// Dark Mode Toggle (Optional - can be activated later)
const initDarkMode = () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('darkMode', document.body.classList.contains('dark'));
        });
        
        // Check saved preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark');
        }
    }
};

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Spinotek Future-Lab Initialized');
    
    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out',
            once: true,
            offset: 100,
            disable: 'mobile' // Disable on mobile for better performance
        });
    }
    
    // Initialize demo account
    initDemoAccount();
    
    // Check authentication and update UI
    if (checkAuth()) {
        // User is logged in
        initUserData();
        updateXPDisplay();
        showUserInfo();
    } else {
        // User is not logged in
        showLoginButton();
    }
    
    // Setup auth system
    setupAuthSystem();
    
    // Setup login buttons
    setupLoginButtons();
    
    // Render Tech Radar & Challenges
    renderTechRadar();
    renderChallenges();
    
    // Refresh AOS after dynamic content is loaded
    setTimeout(() => {
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }, 100);
    
    // Initialize Dark Mode
    initDarkMode();
    
    // Setup logout button
    setupLogoutButton();
    
    if (currentUser) {
        console.log(`💎 Current XP: ${userXP}`);
        console.log(`✅ Completed Challenges: ${completedChallenges.length}`);
        console.log(`👤 User: ${currentUser.name}`);
    }
});

// Setup Logout Button
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', logout);
    }
}

// Performance Optimization: Debounce scroll events
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Apply debounce to scroll handler
window.addEventListener('scroll', debounce(() => {
    // Scroll-based animations here
}, 10));

// ========================================
// TECH DETAIL MODAL
// ========================================

function showTechDetail(techId) {
    const tech = techRadarData.find(t => t.id === techId);
    if (!tech) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
    
    const detailContent = {
        1: {
            features: ['Elegant Syntax', 'MVC Architecture', 'Eloquent ORM', 'Blade Templating', 'Artisan CLI'],
            resources: [
                { name: 'Official Docs', url: 'https://laravel.com/docs' },
                { name: 'Laracasts', url: 'https://laracasts.com' }
            ]
        },
        2: {
            features: ['Utility-First', 'Responsive Design', 'Dark Mode', 'JIT Compiler', 'Custom Plugins'],
            resources: [
                { name: 'Official Docs', url: 'https://tailwindcss.com/docs' },
                { name: 'Tailwind UI', url: 'https://tailwindui.com' }
            ]
        },
        3: {
            features: ['Admin Panel', 'Form Builder', 'Table Builder', 'Notifications', 'Widgets'],
            resources: [
                { name: 'Official Docs', url: 'https://filamentphp.com/docs' },
                { name: 'Plugins', url: 'https://filamentphp.com/plugins' }
            ]
        },
        4: {
            features: ['Developer Experience', 'Fast Workflow', 'Modern Tools', 'Best Practices', 'Community'],
            resources: [
                { name: 'Learn More', url: '#' },
                { name: 'Join Community', url: '#' }
            ]
        }
    };
    
    const detail = detailContent[techId];
    
    modal.innerHTML = `
        <div class="glass-panel max-w-2xl w-full rounded-3xl p-8 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-gradient-to-br ${tech.color} rounded-xl flex items-center justify-center text-white text-3xl">
                        <i class="${tech.iconClass}"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${tech.name}</h2>
                        <span class="px-3 py-1 ${tech.status === 'Hot' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} text-xs font-semibold rounded-full">
                            ${tech.status}
                        </span>
                    </div>
                </div>
                <button onclick="closeModal(this.closest('.fixed'))" class="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-xmark text-gray-600"></i>
                </button>
            </div>
            
            <p class="text-gray-600 leading-relaxed mb-6">${tech.description}</p>
            
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3">
                    <i class="fa-solid fa-star text-primary mr-2"></i>Key Features
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    ${detail.features.map(feature => `
                        <div class="flex items-center gap-2 text-gray-700">
                            <i class="fa-solid fa-check text-green-500"></i>
                            <span>${feature}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-3">
                    <i class="fa-solid fa-book text-primary mr-2"></i>Learning Resources
                </h3>
                <div class="flex flex-wrap gap-3">
                    ${detail.resources.map(resource => `
                        <a href="${resource.url}" target="_blank" class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm hover:shadow-glow transition-all duration-300">
                            ${resource.name}
                            <i class="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                        </a>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
    }, 300);
}

// Add fadeOut animation
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
`;
document.head.appendChild(fadeOutStyle);

// ========================================
// PROJECT DETAIL MODAL
// ========================================

const projectsData = {
    1: {
        title: 'Smart Analytics Platform',
        emoji: '🚀',
        tags: ['AI/ML', 'Web App'],
        description: 'Platform analytics berbasis AI untuk business intelligence dengan machine learning capabilities.',
        features: [
            'Real-time Data Processing',
            'Predictive Analytics',
            'Custom Dashboards',
            'API Integration',
            'Export Reports'
        ],
        tech: ['Python', 'TensorFlow', 'React', 'PostgreSQL'],
        status: 'In Development',
        progress: 75
    },
    2: {
        title: 'Creative Studio App',
        emoji: '🎨',
        tags: ['Design', 'Mobile'],
        description: 'Mobile app untuk creative professionals dan designers dengan tools lengkap untuk design workflow.',
        features: [
            'Vector Editing',
            'Layer Management',
            'Cloud Sync',
            'Collaboration Tools',
            'Export Multiple Formats'
        ],
        tech: ['React Native', 'Firebase', 'Node.js', 'MongoDB'],
        status: 'Beta Testing',
        progress: 90
    },
    3: {
        title: 'Smart Home System',
        emoji: '⚡',
        tags: ['IoT', 'Hardware'],
        description: 'IoT solution untuk smart home automation dengan kontrol penuh dari smartphone.',
        features: [
            'Voice Control',
            'Automation Rules',
            'Energy Monitoring',
            'Security System',
            'Remote Access'
        ],
        tech: ['Arduino', 'MQTT', 'Vue.js', 'InfluxDB'],
        status: 'Production',
        progress: 100
    }
};

function showProjectDetail(projectId) {
    const project = projectsData[projectId];
    if (!project) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
    
    const statusColor = project.status === 'Production' ? 'bg-green-100 text-green-600' : 
                       project.status === 'Beta Testing' ? 'bg-blue-100 text-blue-600' : 
                       'bg-yellow-100 text-yellow-600';
    
    modal.innerHTML = `
        <div class="glass-panel max-w-3xl w-full rounded-3xl p-8 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="text-6xl">${project.emoji}</div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">${project.title}</h2>
                        <div class="flex items-center gap-2">
                            ${project.tags.map(tag => `
                                <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">${tag}</span>
                            `).join('')}
                            <span class="px-3 py-1 ${statusColor} text-xs font-semibold rounded-full">${project.status}</span>
                        </div>
                    </div>
                </div>
                <button onclick="closeModal(this.closest('.fixed'))" class="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-xmark text-gray-600"></i>
                </button>
            </div>
            
            <p class="text-gray-600 leading-relaxed mb-6">${project.description}</p>
            
            <!-- Progress Bar -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-gray-700">Progress</span>
                    <span class="text-sm font-bold text-primary">${project.progress}%</span>
                </div>
                <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" style="width: ${project.progress}%"></div>
                </div>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-3">
                        <i class="fa-solid fa-star text-primary mr-2"></i>Key Features
                    </h3>
                    <div class="space-y-2">
                        ${project.features.map(feature => `
                            <div class="flex items-center gap-2 text-gray-700">
                                <i class="fa-solid fa-check text-green-500"></i>
                                <span>${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-3">
                        <i class="fa-solid fa-code text-primary mr-2"></i>Tech Stack
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        ${project.tech.map(tech => `
                            <span class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">${tech}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300">
                    <i class="fa-solid fa-eye mr-2"></i>View Demo
                </button>
                <button class="flex-1 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:border-primary transition-all duration-300">
                    <i class="fa-brands fa-github mr-2"></i>View Code
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}


// ========================================
// HELPER FUNCTIONS
// ========================================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showDemoVideo() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
    
    modal.innerHTML = `
        <div class="glass-panel max-w-4xl w-full rounded-3xl p-8 animate-scaleIn">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900">
                    <i class="fa-solid fa-play-circle text-primary mr-2"></i>Platform Demo
                </h2>
                <button onclick="closeModal(this.closest('.fixed'))" class="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-xmark text-gray-600"></i>
                </button>
            </div>
            
            <div class="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-6">
                <div class="text-center">
                    <i class="fa-solid fa-video text-6xl text-primary mb-4"></i>
                    <p class="text-gray-600 font-semibold">Demo video akan segera tersedia</p>
                    <p class="text-gray-500 text-sm mt-2">Hubungi tim kami untuk demo langsung</p>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button onclick="window.location.href='mailto:info@spinotek.com'" class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300">
                    <i class="fa-solid fa-envelope mr-2"></i>Contact Us
                </button>
                <button onclick="closeModal(this.closest('.fixed'))" class="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:border-primary transition-all duration-300">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}


// ========================================
// CHALLENGE DETAIL MODAL
// ========================================

function showChallengeDetail(challengeId) {
    const challenge = challengesData.find(c => c.id === challengeId);
    if (!challenge) return;
    
    const isCompleted = completedChallenges.includes(challengeId);
    
    // Check if user is logged in
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu untuk melihat detail challenge', 'error');
        showAuthModal();
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
    
    modal.innerHTML = `
        <div class="glass-panel max-w-3xl w-full rounded-2xl p-4 sm:p-6 animate-scaleIn my-4 max-h-[85vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-xl">
                        <i class="${challenge.icon}"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 mb-1">${challenge.title}</h2>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="px-2 py-0.5 ${challenge.difficultyColor} text-xs font-semibold rounded-full">
                                ${challenge.difficulty}
                            </span>
                            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                                <i class="fa-solid fa-clock mr-1"></i>${challenge.estimatedTime}
                            </span>
                            <span class="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-full">
                                <i class="fa-solid fa-bolt mr-1"></i>+${challenge.xp_reward} XP
                            </span>
                        </div>
                    </div>
                </div>
                <button onclick="closeModal(this.closest('.fixed'))" class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                    <i class="fa-solid fa-xmark text-gray-600"></i>
                </button>
            </div>
            
            <!-- Description -->
            <p class="text-gray-600 text-sm leading-relaxed mb-4">${challenge.description}</p>
            
            <!-- Prerequisites -->
            <div class="mb-4">
                <h3 class="text-sm font-bold text-gray-900 mb-2">
                    <i class="fa-solid fa-list-check text-primary mr-1"></i>Prerequisites
                </h3>
                <div class="flex flex-wrap gap-1.5">
                    ${challenge.prerequisites.map(prereq => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                            ${prereq}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <!-- Steps -->
            <div class="mb-4">
                <h3 class="text-sm font-bold text-gray-900 mb-2">
                    <i class="fa-solid fa-route text-primary mr-1"></i>Step-by-Step Guide
                </h3>
                <div class="space-y-2">
                    ${challenge.steps.map((step, index) => `
                        <div class="flex gap-2 items-start text-sm">
                            <div class="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                ${index + 1}
                            </div>
                            <p class="text-gray-700 pt-0.5">${step}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Hints -->
            <div class="mb-4">
                <button onclick="toggleHints(${challengeId})" class="flex items-center gap-2 text-primary text-sm font-semibold hover:text-secondary transition-colors mb-2">
                    <i class="fa-solid fa-lightbulb"></i>
                    <span>Show Hints (${challenge.hints.length})</span>
                    <i class="fa-solid fa-chevron-down text-xs" id="hints-icon-${challengeId}"></i>
                </button>
                <div id="hints-${challengeId}" class="hidden space-y-1.5">
                    ${challenge.hints.map((hint, index) => `
                        <div class="flex gap-2 items-start bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-sm">
                            <i class="fa-solid fa-lightbulb text-yellow-600 mt-0.5 text-xs"></i>
                            <p class="text-gray-700">${hint}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Code Snippet -->
            <div class="mb-4">
                <button onclick="toggleCode(${challengeId})" class="flex items-center gap-2 text-primary text-sm font-semibold hover:text-secondary transition-colors mb-2">
                    <i class="fa-solid fa-code"></i>
                    <span>Show Code Snippet</span>
                    <i class="fa-solid fa-chevron-down text-xs" id="code-icon-${challengeId}"></i>
                </button>
                <div id="code-${challengeId}" class="hidden">
                    <div class="bg-gray-900 rounded-lg p-3 overflow-x-auto text-xs">
                        <pre class="text-gray-100"><code>${escapeHtml(challenge.codeSnippet)}</code></pre>
                    </div>
                    <button onclick="copyCode(${challengeId})" class="mt-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors">
                        <i class="fa-solid fa-copy mr-1"></i>Copy Code
                    </button>
                </div>
            </div>
            
            ${challenge.bonusXP ? `
                <div class="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-star text-amber-600"></i>
                        <h3 class="font-bold text-amber-900 text-sm">Bonus Challenge</h3>
                    </div>
                    <p class="text-amber-800 text-xs">
                        <strong>+${challenge.bonusXP} XP</strong> jika ${challenge.bonusCondition}
                    </p>
                </div>
            ` : ''}
            
            <!-- Actions -->
            <div class="flex gap-2 flex-col sm:flex-row">
                ${!isCompleted ? `
                    <button onclick="startChallenge(${challengeId})" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm hover:shadow-glow transition-all duration-300">
                        <i class="fa-solid fa-play mr-1"></i>Start Challenge
                    </button>
                    <button onclick="submitChallenge(${challengeId})" class="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-all duration-300">
                        <i class="fa-solid fa-check mr-1"></i>Submit & Complete
                    </button>
                ` : `
                    <div class="flex-1 px-4 py-2.5 bg-green-100 text-green-600 rounded-xl font-semibold text-center text-sm">
                        <i class="fa-solid fa-check-circle mr-1"></i>Challenge Completed!
                    </div>
                `}
                <button onclick="closeModal(this.closest('.fixed'))" class="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm hover:border-primary transition-all duration-300">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function toggleHints(challengeId) {
    const hintsDiv = document.getElementById(`hints-${challengeId}`);
    const icon = document.getElementById(`hints-icon-${challengeId}`);
    
    if (hintsDiv.classList.contains('hidden')) {
        hintsDiv.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        hintsDiv.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function toggleCode(challengeId) {
    const codeDiv = document.getElementById(`code-${challengeId}`);
    const icon = document.getElementById(`code-icon-${challengeId}`);
    
    if (codeDiv.classList.contains('hidden')) {
        codeDiv.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        codeDiv.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function copyCode(challengeId) {
    const challenge = challengesData.find(c => c.id === challengeId);
    if (!challenge) return;
    
    navigator.clipboard.writeText(challenge.codeSnippet).then(() => {
        showNotification('Code copied to clipboard!', 'success');
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function startChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id === challengeId);
    if (!challenge) return;
    
    // Save start time
    const startTime = new Date().toISOString();
    const challengeProgress = JSON.parse(localStorage.getItem('spinotek_challenge_progress') || '{}');
    challengeProgress[challengeId] = {
        startTime: startTime,
        status: 'in_progress'
    };
    localStorage.setItem('spinotek_challenge_progress', JSON.stringify(challengeProgress));
    
    showNotification(`Challenge "${challenge.title}" started! Good luck! 🚀`, 'success');
    
    // Close modal
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) closeModal(modal);
}

function submitChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id === challengeId);
    if (!challenge) return;
    
    // Check if user is logged in
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu', 'error');
        showAuthModal();
        return;
    }
    
    // Check if already completed
    if (completedChallenges.includes(challengeId)) {
        showNotification('Challenge sudah diselesaikan!', 'error');
        return;
    }
    
    // Show submission modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
    
    modal.innerHTML = `
        <div class="glass-panel max-w-2xl w-full rounded-2xl p-6 animate-scaleIn">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
                <i class="fa-solid fa-upload text-primary mr-2"></i>Submit Challenge
            </h2>
            
            <p class="text-gray-600 mb-6">
                Selamat! Kamu akan menyelesaikan challenge "<strong>${challenge.title}</strong>". 
                Pastikan kamu sudah mengerjakan semua step yang ada.
            </p>
            
            <form id="submitForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        GitHub Repository URL (Optional)
                    </label>
                    <input 
                        type="url" 
                        placeholder="https://github.com/username/repo"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        Live Demo URL (Optional)
                    </label>
                    <input 
                        type="url" 
                        placeholder="https://demo.example.com"
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                    >
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea 
                        rows="3"
                        placeholder="Catatan atau kesulitan yang dihadapi..."
                        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors resize-none"
                    ></textarea>
                </div>
                
                <!-- XP Preview -->
                <div class="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700 font-semibold">XP yang akan didapat:</span>
                        <span class="text-2xl font-bold text-primary">+${challenge.xp_reward} XP</span>
                    </div>
                    ${challenge.bonusXP ? `
                        <div class="mt-2 text-sm text-amber-700">
                            <i class="fa-solid fa-star text-amber-500"></i>
                            Bonus +${challenge.bonusXP} XP tersedia jika ${challenge.bonusCondition}
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex gap-3">
                    <button 
                        type="submit"
                        class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300"
                    >
                        <i class="fa-solid fa-check mr-2"></i>Complete Challenge
                    </button>
                    <button 
                        type="button"
                        onclick="closeModal(this.closest('.fixed'))"
                        class="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:border-primary transition-all duration-300"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('#submitForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Complete the challenge - INI YANG MEMBUAT PROGRESS BERTAMBAH!
        completeChallenge(challengeId, challenge.xp_reward, null);
        
        // Close both modals
        document.querySelectorAll('.fixed.inset-0').forEach(m => closeModal(m));
        
        // Re-render challenges to update UI
        renderChallenges();
        
        // Show success with confetti
        showNotification(`🎉 Challenge "${challenge.title}" completed! +${challenge.xp_reward} XP earned!`, 'success');
        
        // Trigger confetti at center of screen
        createConfettiAtCenter();
    });
}
