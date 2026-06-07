// Animated Background - Particles Network (transparent version for content pages)
const AnimatedBackground = {
    canvas: null,
    ctx: null,
    particles: [],
    mouse: { x: 0, y: 0 },
    animationId: null,
    config: {
        particleCount: 80,
        minSize: 3,
        maxSize: 6,
        minSpeed: 0.1,
        maxSpeed: 0.2,
        connectionDistance: 120,
        colors: ['#e63939', '#777777', '#ffffff', '#ffc107'],
        opacity: 0.30
    },

    init() {
        this.canvas = document.getElementById('animated-bg');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.opacity = this.config.opacity;
        this.resize();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * (this.config.maxSize - this.config.minSize) + this.config.minSize,
                speedX: (Math.random() - 0.5) * this.config.maxSpeed,
                speedY: (Math.random() - 0.5) * this.config.maxSpeed,
                type: Math.floor(Math.random() * 3), // 0: circle, 1: diamond, 2: triangle
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
                originalX: 0,
                originalY: 0
            });
        }
    },

    setupEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    },

    drawShape(x, y, size, type) {
        this.ctx.beginPath();
        switch (type) {
            case 0: // Circle
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                break;
            case 1: // Diamond
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size, y);
                this.ctx.closePath();
                break;
            case 2: // Triangle
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.lineTo(x - size, y + size);
                this.ctx.closePath();
                break;
        }
    },

    updateParticles() {
        const { mouse } = this;
        const distanceThreshold = this.config.connectionDistance;

        this.particles.forEach(particle => {
            // Move particles
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Mouse interaction (glow and slight attraction)
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const force = (150 - distance) / 150;
                particle.x += dx * 0.01 * force;
                particle.y += dy * 0.01 * force;
            }

            // Boundary check
            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;
        });
    },

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(230, 57, 57, 0.15)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateParticles();
        this.drawConnections();

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.drawShape(particle.x, particle.y, particle.size, particle.type);
            this.ctx.fill();
        });
    },

    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => AnimatedBackground.init());