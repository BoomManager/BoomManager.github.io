/**
 * 公共脚本 - 所有页面共用
 * 包含：主题切换、滚动进度条、粒子效果、图片预加载、卡片动画、移动端导航
 */

document.addEventListener('DOMContentLoaded', function() {

    // ===== 1. 图片预加载 =====
    const avatarImgs = document.querySelectorAll('.avatar');
    avatarImgs.forEach(img => {
        const newImg = new Image();
        newImg.onload = function() {
            img.src = this.src;
            img.style.display = 'block';
            if (img.previousElementSibling) {
                img.previousElementSibling.style.display = 'none';
            }
        };
        newImg.onerror = function() {
            img.style.display = 'none';
            if (img.previousElementSibling) {
                img.previousElementSibling.innerHTML = '<i class=\'fa fa-exclamation-triangle fa-3x\' style=\'color: #e74c3c;\' aria-hidden=\'true\'></i>';
            }
        };
        newImg.src = img.src;

        if (img.complete && img.naturalWidth !== 0) {
            img.style.display = 'block';
            if (img.previousElementSibling) {
                img.previousElementSibling.style.display = 'none';
            }
        }
    });

    // ===== 2. 卡片入场动画（统一观察器，支持交错延迟） =====
    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 获取同组元素索引实现交错延迟
                const siblings = entry.target.parentElement
                    ? Array.from(entry.target.parentElement.children).filter(el =>
                        el.classList.contains('card') ||
                        el.classList.contains('page-entry-card') ||
                        el.classList.contains('achievement-card') ||
                        el.classList.contains('habit-card') ||
                        el.classList.contains('stat-card') ||
                        el.classList.contains('book-card'))
                    : [entry.target];
                const index = siblings.indexOf(entry.target);
                const delay = Math.min(index * 80, 400);

                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, delay);
                animateObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '80px 0px'
    });

    // 观察所有需要入场动画的元素
    document.querySelectorAll('.card, .page-entry-card, .achievement-card, .habit-card, .stat-card, .book-card').forEach(el => {
        animateObserver.observe(el);
    });

    // ===== 2.1 相关内容推荐区域入场 =====
    const relatedContent = document.querySelector('.related-content');
    if (relatedContent) {
        const relatedObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    relatedObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        relatedObserver.observe(relatedContent);
    }

    // ===== 3. 鼠标跟随效果 =====
    const follower = document.querySelector('.cursor-follower');
    if (follower && window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', function(e) {
            follower.style.left = e.clientX + 'px';
            follower.style.top = e.clientY + 'px';
        });

        document.querySelectorAll('a, button, .skill-tag, .skill-category, .page-entry-card, .book-card, .media-link, .toc-item, .achievement-card, .stat-card').forEach(el => {
            el.addEventListener('mouseenter', () => follower.classList.add('hover'));
            el.addEventListener('mouseleave', () => follower.classList.remove('hover'));
        });
    }

    // ===== 4. 目录导航功能 =====
    function initTocNavigation() {
        const tocItems = document.querySelectorAll('.toc-item');

        // 为每个卡片打上 data-section 标记，便于精准匹配
        document.querySelectorAll('.info-unit.card, .books.info-unit.card, section.related-content').forEach(card => {
            const h2 = card.querySelector('h2');
            if (h2 && !card.dataset.section) {
                // 提取纯文本（去掉图标元素）
                const clone = h2.cloneNode(true);
                clone.querySelectorAll('i, .reading-time').forEach(el => el.remove());
                const text = clone.textContent.trim();
                card.dataset.section = text;
            }
        });

        tocItems.forEach(item => {
            item.addEventListener('click', function() {
                const targetText = this.getAttribute('data-target');
                let targetElement = null;

                document.querySelectorAll('[data-section]').forEach(el => {
                    if (el.dataset.section === targetText) {
                        targetElement = el;
                    }
                });

                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 120,
                        behavior: 'smooth'
                    });

                    tocItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });

        // 节流滚动处理
        let scrollTicking = false;
        function onScroll() {
            const sections = document.querySelectorAll('[data-section]');
            let currentSectionId = '';
            const scrollPosition = window.scrollY + 140;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentSectionId = section.dataset.section;
                }
            });

            tocItems.forEach(item => {
                if (item.getAttribute('data-target') === currentSectionId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            scrollTicking = false;
        }

        window.addEventListener('scroll', function() {
            if (!scrollTicking) {
                window.requestAnimationFrame(onScroll);
                scrollTicking = true;
            }
        }, { passive: true });
    }

    initTocNavigation();

    // ===== 5. 夜间模式切换 =====
    const themeSwitch = document.getElementById('themeSwitch');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        body.classList.add('dark-mode');
        if (themeSwitch) {
            themeSwitch.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
        }
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('click', function() {
            body.classList.toggle('dark-mode');

            if (body.classList.contains('dark-mode')) {
                this.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
                localStorage.setItem('theme', 'dark');
            } else {
                this.innerHTML = '<i class="fa fa-moon-o" aria-hidden="true"></i>';
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // ===== 6. 移动端导航菜单 =====
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function() {
            const isShown = navbarMenu.classList.toggle('show');
            this.setAttribute('aria-expanded', isShown);
        });

        // 点击导航链接后关闭菜单
        navbarMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navbarMenu.classList.remove('show');
                navbarToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ===== 7. 数字增长动画 =====
    const counters = document.querySelectorAll('.counter');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                counter.innerText = target.toLocaleString();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    // ===== 8. 写文成果数据统计动画 =====
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length > 0) {
        const mockData = {
            articleCount: 1902,
            viewCount: 3110203,
            favoriteCount: 27769,
            commentCount: 11188,
            likeCount: 24651
        };

        const animateValue = (id, start, end, duration) => {
            const obj = document.getElementById(id);
            if (!obj) return;

            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);

                if (id === 'viewCount') {
                    obj.innerText = Math.floor(progress * (end - start) + start).toLocaleString();
                } else {
                    obj.innerText = Math.floor(progress * (end - start) + start);
                }

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateValue('articleCount', 0, mockData.articleCount, 1500);
                    animateValue('viewCount', 0, mockData.viewCount, 2000);
                    animateValue('favoriteCount', 0, mockData.favoriteCount, 1500);
                    animateValue('commentCount', 0, mockData.commentCount, 1500);
                    animateValue('likeCount', 0, mockData.likeCount, 1500);
                    statObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            statObserver.observe(statsContainer);
        }
    }

    // ===== 9. 背景粒子效果 =====
    const canvas = document.getElementById('particlesCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        let mouse = { x: null, y: null, radius: 150 };

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        window.addEventListener('mousemove', function(e) {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = body.classList.contains('dark-mode') ? '#38bdf8' : '#1abc9c';
                this.alpha = 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;

                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                this.alpha = distance < mouse.radius ? 0.8 : Math.max(this.alpha - 0.01, 0.1);
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `${this.color}${Math.round(this.alpha * 255).toString(16).padStart(2, '0')}`;
                ctx.fill();
            }
        }

        function initParticles() {
            particlesArray = [];
            const particleCount = Math.min(Math.floor(canvas.width * canvas.height / 15000), 100);

            for (let i = 0; i < particleCount; i++) {
                particlesArray.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }

            requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();
    }

    // ===== 10. 技能分类点击展开/收起 =====
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            this.closest('.skill-category').classList.toggle('active');
        });
    });

    // ===== 11. 返回顶部按钮 + 导航栏滚动效果 =====
    const backToTopBtn = document.getElementById('backToTop');
    const navbar = document.querySelector('.navbar');
    if (backToTopBtn || navbar) {
        let uiScrollTicking = false;
        function onScrollUI() {
            const offset = window.pageYOffset;
            if (backToTopBtn) {
                if (offset > 300) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            }
            if (navbar) {
                if (offset > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
            uiScrollTicking = false;
        }

        window.addEventListener('scroll', function() {
            if (!uiScrollTicking) {
                window.requestAnimationFrame(onScrollUI);
                uiScrollTicking = true;
            }
        }, { passive: true });

        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // ===== 12. 键盘导航快捷键 =====
    document.addEventListener('keydown', function(e) {
        // Alt + 1-5 快捷切换页面
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            const navMap = { '1': 'index.html', '2': 'skills.html', '3': 'business.html', '4': 'works.html', '5': 'about.html' };
            if (navMap[e.key]) {
                e.preventDefault();
                window.location.href = navMap[e.key];
            }
        }
        // ESC 关闭移动端菜单
        if (e.key === 'Escape' && navbarMenu && navbarMenu.classList.contains('show')) {
            navbarMenu.classList.remove('show');
        }
        // T 切换主题
        if (e.key === 't' && !e.altKey && !e.ctrlKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            if (themeSwitch) themeSwitch.click();
        }
    });

    // ===== 13. 阅读时间估算 =====
    document.querySelectorAll('.card').forEach(card => {
        if (card.dataset.readingTime) return;
        const text = card.textContent || '';
        const charCount = text.length;
        // 中文阅读速度约 400-600 字/分钟
        const minutes = Math.max(1, Math.ceil(charCount / 500));
        card.dataset.readingTime = minutes + '分钟';

        const h2 = card.querySelector('h2');
        if (h2 && !card.querySelector('.reading-time')) {
            const badge = document.createElement('span');
            badge.className = 'reading-time';
            badge.title = '预计阅读时间';
            badge.innerHTML = '<i class="fa fa-clock-o" aria-hidden="true"></i> ' + minutes + '分钟';
            h2.appendChild(badge);
        }
    });

    // ===== 14. 邮箱/微信一键复制 =====
    document.querySelectorAll('.contact.info-unit span, .contact.info-unit a').forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('@') || /^[\w-]+$/.test(text)) {
            el.style.cursor = 'pointer';
            el.title = '点击复制';
            el.addEventListener('click', function(e) {
                if (this.tagName === 'A') return; // 链接不拦截
                e.preventDefault();
                const tmp = document.createElement('textarea');
                tmp.value = text;
                document.body.appendChild(tmp);
                tmp.select();
                try {
                    document.execCommand('copy');
                    // 显示复制成功提示
                    const toast = document.createElement('div');
                    toast.className = 'copy-toast';
                    toast.textContent = '已复制：' + text;
                    document.body.appendChild(toast);
                    setTimeout(() => toast.classList.add('show'), 10);
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => toast.remove(), 300);
                    }, 2000);
                } catch (err) {}
                document.body.removeChild(tmp);
            });
        }
    });

    // ===== 15. 链接预取（鼠标悬停时预加载） =====
    const prefetchedUrls = new Set();
    document.querySelectorAll('a[href$=".html"]').forEach(link => {
        link.addEventListener('mouseenter', function() {
            const href = this.getAttribute('href');
            if (prefetchedUrls.has(href) || href === window.location.pathname.split('/').pop()) return;
            prefetchedUrls.add(href);

            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            document.head.appendChild(prefetchLink);
        });
    });

    // ===== 16. 图片渐进式加载（模糊→清晰） =====
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]:not([data-loaded])');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.dataset.loading = 'true';

                    // 图片加载完成后移除模糊
                    const onLoaded = function() {
                        img.dataset.loaded = 'true';
                        img.removeAttribute('data-loading');
                        img.removeEventListener('load', onLoaded);
                    };

                    if (img.complete && img.naturalWidth !== 0) {
                        onLoaded();
                    } else {
                        img.addEventListener('load', onLoaded);
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '100px 0px' });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // ===== 17. 卡片点击波纹效果 =====
    document.querySelectorAll('.card, .page-entry-card, .stat-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (this.tagName === 'A' || this.closest('a')) return;
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.style.position = this.style.position || 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});

// ===== 滚动进度条（全局，节流优化） =====
let progressTicking = false;
window.addEventListener('scroll', function() {
    if (!progressTicking) {
        window.requestAnimationFrame(function() {
            let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            let scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            const progressBar = document.getElementById("progressBar");
            if (progressBar) progressBar.style.width = scrolled + "%";
            progressTicking = false;
        });
        progressTicking = true;
    }
}, { passive: true });
