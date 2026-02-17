// Particles Background - Spinotek Future-Lab
// Butiran pasir hitam yang bergerak di background putih

class ParticlesBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.time = 0;
        this.mouse = { x: -1000, y: -1000 };
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.createParticles();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Recreate particles on resize
        this.createParticles();
    }
    
    createParticles() {
        this.particles = [];
        const particleCount = 150; // Jumlah butiran
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 0.5, // Ukuran butiran 0.5-2.5px
                vx: (Math.random() - 0.5) * 0.3, // Kecepatan horizontal
                vy: (Math.random() - 0.5) * 0.3, // Kecepatan vertikal
                alpha: Math.random() * 0.4 + 0.3, // Transparansi 0.3-0.7
                wobble: Math.random() * Math.PI * 2, // Untuk efek goyang
                wobbleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    animate() {
        this.time += 0.016;
        
        // Clear dengan background transparan (biar background putih dari body keliatan)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.drawParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Update wobble untuk efek goyang halus
            particle.wobble += particle.wobbleSpeed;
            
            // Movement dengan sedikit wobble
            particle.x += particle.vx + Math.sin(particle.wobble) * 0.1;
            particle.y += particle.vy + Math.cos(particle.wobble) * 0.1;
            
            // Wrap around edges (loop)
            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.canvas.height + 10;
            if (particle.y > this.canvas.height + 10) particle.y = -10;
            
            // Mouse interaction - butiran menjauh dari mouse
            const dx = particle.x - this.mouse.x;
            const dy = particle.y - this.mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.x += (dx / distance) * force * 2;
                particle.y += (dy / distance) * force * 2;
            }
            
            // Draw particle (butiran hitam/abu gelap)
            this.ctx.fillStyle = `rgba(30, 30, 40, ${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Optional: tambah sedikit shadow untuk depth
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            this.ctx.shadowBlur = 2;
        });
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ParticlesBackground('particles-canvas');
    });
} else {
    new ParticlesBackground('particles-canvas');
}
