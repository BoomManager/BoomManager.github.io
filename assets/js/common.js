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
                // 美观的占位符：灰色背景 + 通用图标
                const prev = img.previousElementSibling;
                prev.style.background = '#e5e7eb';
                prev.style.display = 'flex';
                prev.style.alignItems = 'center';
                prev.style.justifyContent = 'center';
                prev.innerHTML = '<i class="fa fa-user" style="font-size:64px;color:#9ca3af;" aria-hidden="true"></i>';
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
        var followerX = 0, followerY = 0, followerRAF = null;
        document.addEventListener('mousemove', function(e) {
            followerX = e.clientX;
            followerY = e.clientY;
            if (!followerRAF) {
                followerRAF = requestAnimationFrame(function() {
                    follower.style.left = followerX + 'px';
                    follower.style.top = followerY + 'px';
                    followerRAF = null;
                });
            }
        });

        document.querySelectorAll('a, button, .skill-tag, .skill-category, .page-entry-card, .book-card, .media-link, .toc-item, .achievement-card, .stat-card').forEach(el => {
            el.addEventListener('mouseenter', () => follower.classList.add('hover'));
            el.addEventListener('mouseleave', () => follower.classList.remove('hover'));
        });
    }

    // ===== 3.1 卡片鼠标聚光灯（桌面端，更新 --mx/--my CSS 变量） =====
    if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.card, .page-entry-card, .book-card, .achievement-card, .habit-card, .stat-card').forEach(card => {
            card.addEventListener('mousemove', function(e) {
                var rect = this.getBoundingClientRect();
                var x = ((e.clientX - rect.left) / rect.width) * 100;
                var y = ((e.clientY - rect.top) / rect.height) * 100;
                this.style.setProperty('--mx', x + '%');
                this.style.setProperty('--my', y + '%');
            });
        });
    }

    // ===== 4. 目录导航功能 =====
    function initTocNavigation() {
        const tocItems = document.querySelectorAll('.toc-item');

        // 为每个卡片打上 data-section 标记，便于精准匹配
        document.querySelectorAll('.info-unit.card, .books.info-unit.card, section.related-content, .page-content section[id]').forEach(card => {
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
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');

            var tocClick = function() {
                var targetText = this.getAttribute('data-target');
                var targetElement = null;

                // 优先通过 id 锚点查找
                targetElement = document.getElementById(targetText);

                // 回退到 data-section 匹配
                if (!targetElement) {
                    document.querySelectorAll('[data-section]').forEach(el => {
                        if (el.dataset.section === targetText) {
                            targetElement = el;
                        }
                    });
                }

                if (targetElement) {
                    // 更新 URL hash 支持章节分享
                    if (history.replaceState) {
                        history.replaceState(null, '', '#' + encodeURIComponent(targetText));
                    }

                    window.scrollTo({
                        top: targetElement.offsetTop - 120,
                        behavior: 'smooth'
                    });

                    tocItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                }
            };

            item.addEventListener('click', tocClick);
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tocClick.call(this);
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

        // ===== 移动端 TOC 浮动按钮 + 底部弹出面板 =====
        const tocContainer = document.querySelector('.toc-container');
        if (tocContainer) {
            const isMobile = function() {
                return window.matchMedia('(max-width: 768px)').matches;
            };

            let mobileTocInited = false;
            let tocOverlay = null;
            let tocFab = null;

            const iconMap = {
                '个人简介': 'fa-user',
                '基本信息': 'fa-user',
                '联系方式': 'fa-phone',
                '自媒体矩阵': 'fa-qrcode',
                '写文成果': 'fa-trophy',
                '数据统计': 'fa-bar-chart',
                '更多内容': 'fa-compass',
                '相关内容推荐': 'fa-link',
                '相关推荐': 'fa-link',
                '职业技能': 'fa-code',
                '技能概览': 'fa-code',
                '后端技术': 'fa-server',
                '前端技术': 'fa-html5',
                '运维与云原生': 'fa-cloud',
                '大数据技术': 'fa-database',
                '商业思维': 'fa-line-chart',
                '副业思路': 'fa-lightbulb-o',
                '商业方法论': 'fa-book',
                '用户运营': 'fa-users',
                '作品成果': 'fa-book',
                '出版图书': 'fa-book',
                '技术成就': 'fa-trophy',
                '社区贡献': 'fa-comments',
                '关于我': 'fa-user-circle',
                '自我评价': 'fa-star',
                '兴趣爱好': 'fa-heart',
                '生活习惯': 'fa-coffee',
                '持续计划': 'fa-calendar'
            };

            function initMobileToc() {
                if (mobileTocInited) return;
                const tocList = tocContainer.querySelector('.toc-list');
                if (!tocList) return;

                tocOverlay = document.createElement('div');
                tocOverlay.className = 'toc-overlay';
                document.body.appendChild(tocOverlay);

                tocFab = document.createElement('button');
                tocFab.type = 'button';
                tocFab.className = 'toc-fab';
                tocFab.setAttribute('aria-label', '打开目录导航');
                tocFab.innerHTML = '<i class="fa fa-list-ul" aria-hidden="true"></i><span>目录</span>';
                tocContainer.appendChild(tocFab);

                const handle = document.createElement('div');
                handle.className = 'toc-panel-handle';
                handle.setAttribute('aria-hidden', 'true');
                tocList.insertBefore(handle, tocList.firstChild);

                const panelHeader = document.createElement('div');
                panelHeader.className = 'toc-panel-header';
                panelHeader.innerHTML =
                    '<div class="toc-panel-title"><i class="fa fa-list-ul" aria-hidden="true"></i> 目录导航</div>' +
                    '<button type="button" class="toc-close-btn" aria-label="关闭目录"><i class="fa fa-times" aria-hidden="true"></i></button>';
                tocList.insertBefore(panelHeader, handle.nextSibling);

                tocList.querySelectorAll('.toc-item').forEach(function(item) {
                    const text = item.textContent.trim();
                    let iconClass = 'fa-circle-o';
                    for (var key in iconMap) {
                        if (text.indexOf(key) !== -1) {
                            iconClass = iconMap[key];
                            break;
                        }
                    }
                    const icon = document.createElement('i');
                    icon.className = 'fa ' + iconClass;
                    icon.setAttribute('aria-hidden', 'true');
                    item.insertBefore(icon, item.firstChild);
                });

                bindMobileEvents();
                mobileTocInited = true;
            }

            function destroyMobileToc() {
                if (!mobileTocInited) return;
                closeToc();

                if (tocFab && tocFab.parentNode) tocFab.parentNode.removeChild(tocFab);
                if (tocOverlay && tocOverlay.parentNode) tocOverlay.parentNode.removeChild(tocOverlay);

                const tocList = tocContainer.querySelector('.toc-list');
                if (tocList) {
                    const handle = tocList.querySelector('.toc-panel-handle');
                    if (handle) handle.parentNode.removeChild(handle);
                    const panelHeader = tocList.querySelector('.toc-panel-header');
                    if (panelHeader) panelHeader.parentNode.removeChild(panelHeader);
                    tocList.querySelectorAll('.toc-item i.fa').forEach(function(icon) {
                        icon.parentNode.removeChild(icon);
                    });
                }

                tocFab = null;
                tocOverlay = null;
                mobileTocInited = false;
            }

            function openToc() {
                if (!isMobile() || !mobileTocInited) return;
                tocContainer.classList.add('mobile-open');
                tocOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                // FAB 隐藏由 CSS .toc-container.mobile-open .toc-fab { display:none } 控制
                // 焦点移入面板，便于键盘操作
                setTimeout(function() {
                    var closeBtn = tocContainer.querySelector('.toc-close-btn');
                    if (closeBtn) closeBtn.focus();
                }, 100);
            }

            function closeToc() {
                if (!mobileTocInited) return;
                tocContainer.classList.remove('mobile-open');
                if (tocOverlay) tocOverlay.classList.remove('show');
                document.body.style.overflow = '';
                if (tocFab) {
                    tocFab.focus();
                }
            }

            // 焦点陷阱：Tab 键循环在面板内
            tocContainer.addEventListener('keydown', function(e) {
                if (e.key !== 'Tab' || !tocContainer.classList.contains('mobile-open')) return;
                var focusables = tocContainer.querySelectorAll('.toc-close-btn, .toc-item');
                if (focusables.length === 0) return;
                var first = focusables[0];
                var last = focusables[focusables.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            });

            function bindMobileEvents() {
                if (!tocFab || !tocOverlay) return;

                tocFab.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openToc();
                });

                const closeBtn = tocContainer.querySelector('.toc-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        closeToc();
                    });
                }

                tocOverlay.addEventListener('click', function() {
                    closeToc();
                });

                tocContainer.querySelectorAll('.toc-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        if (isMobile()) {
                            setTimeout(function() {
                                closeToc();
                            }, 350);
                        }
                    });
                });
            }

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && tocContainer.classList.contains('mobile-open')) {
                    closeToc();
                }
            });

            const mql = window.matchMedia('(max-width: 768px)');
            function handleMQLChange(e) {
                if (e.matches) {
                    initMobileToc();
                } else {
                    destroyMobileToc();
                }
            }
            if (mql.addEventListener) {
                mql.addEventListener('change', handleMQLChange);
            } else {
                mql.addListener(handleMQLChange);
            }

            if (isMobile()) {
                initMobileToc();
            }
        }
    }

    initTocNavigation();

    // URL hash 锚点跳转：页面加载时如果有 #hash，滚动到对应section
    if (location.hash) {
        var hashTarget = decodeURIComponent(location.hash.slice(1));
        var el = document.getElementById(hashTarget);
        if (el) {
            setTimeout(function() {
                window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
            }, 300);
        }
    }

    // ===== 5. 夜间模式切换 =====
    const themeSwitch = document.getElementById('themeSwitch');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        body.classList.add('dark-mode');
        if (themeSwitch) {
            themeSwitch.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
            themeSwitch.setAttribute('aria-pressed', 'true');
            themeSwitch.setAttribute('aria-label', '切换为日间模式');
        }
    } else if (themeSwitch) {
        themeSwitch.setAttribute('aria-pressed', 'false');
        themeSwitch.setAttribute('aria-label', '切换为夜间模式');
    }

    // 暗色模式跟随系统实时变化（仅当用户未手动设置主题时）
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkMediaQuery.addEventListener) {
        darkMediaQuery.addEventListener('change', function(e) {
            if (localStorage.getItem('theme')) return; // 用户已手动设置，不跟随
            const isDark = e.matches;
            if (isDark) {
                body.classList.add('dark-mode');
                if (themeSwitch) {
                    themeSwitch.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
                    themeSwitch.setAttribute('aria-pressed', 'true');
                    themeSwitch.setAttribute('aria-label', '切换为日间模式');
                }
            } else {
                body.classList.remove('dark-mode');
                if (themeSwitch) {
                    themeSwitch.innerHTML = '<i class="fa fa-moon-o" aria-hidden="true"></i>';
                    themeSwitch.setAttribute('aria-pressed', 'false');
                    themeSwitch.setAttribute('aria-label', '切换为夜间模式');
                }
            }
        });
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('click', function() {
            body.classList.toggle('dark-mode');

            if (body.classList.contains('dark-mode')) {
                this.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
                this.setAttribute('aria-pressed', 'true');
                this.setAttribute('aria-label', '切换为日间模式');
                localStorage.setItem('theme', 'dark');
            } else {
                this.innerHTML = '<i class="fa fa-moon-o" aria-hidden="true"></i>';
                this.setAttribute('aria-pressed', 'false');
                this.setAttribute('aria-label', '切换为夜间模式');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // ===== 6. 移动端导航菜单（汉堡 ↔ X 图标切换） =====
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    const toggleIcon = navbarToggle ? navbarToggle.querySelector('i') : null;

    function setMenuState(isShown) {
        if (!navbarMenu || !navbarToggle) return;
        if (isShown) {
            navbarMenu.classList.add('show');
            navbarToggle.setAttribute('aria-expanded', 'true');
            navbarToggle.setAttribute('aria-label', '关闭菜单');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-bars');
                toggleIcon.classList.add('fa-times');
            }
        } else {
            navbarMenu.classList.remove('show');
            navbarToggle.setAttribute('aria-expanded', 'false');
            navbarToggle.setAttribute('aria-label', '打开菜单');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-times');
                toggleIcon.classList.add('fa-bars');
            }
        }
    }

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function() {
            setMenuState(!navbarMenu.classList.contains('show'));
        });

        // 点击导航链接后关闭菜单
        navbarMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenuState(false));
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
            // 移动端大幅减少粒子数量以省电
            var isMobile = window.matchMedia('(max-width: 768px)').matches;
            var areaDivisor = isMobile ? 40000 : 15000;
            var maxCount = isMobile ? 30 : 100;
            const particleCount = Math.min(Math.floor(canvas.width * canvas.height / areaDivisor), maxCount);

            for (let i = 0; i < particleCount; i++) {
                particlesArray.push(new Particle());
            }
        }

        let particleRafId = null;
        let particlePaused = false;

        function animateParticles() {
            if (particlePaused) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }

            particleRafId = requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();

        // 标签页隐藏时暂停动画，节省 CPU/电量
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                particlePaused = true;
                if (particleRafId) {
                    cancelAnimationFrame(particleRafId);
                    particleRafId = null;
                }
            } else {
                particlePaused = false;
                if (!particleRafId) {
                    particleRafId = requestAnimationFrame(animateParticles);
                }
            }
        });
    }

    // ===== 10. 技能分类点击展开/收起（accordion 互斥：展开一个收起其他） =====
    const skillCategories = document.querySelectorAll('.skill-category');
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            const current = this.closest('.skill-category');
            const willOpen = !current.classList.contains('active');
            // 互斥：收起其他所有展开项
            skillCategories.forEach(cat => {
                if (cat !== current) cat.classList.remove('active');
            });
            current.classList.toggle('active', willOpen);
        });
    });

    // ===== 11. 返回顶部按钮 + 导航栏滚动效果（含方向感知隐藏） =====
    const backToTopBtn = document.getElementById('backToTop');
    const navbar = document.querySelector('.navbar');
    if (backToTopBtn || navbar) {
        let uiScrollTicking = false;
        let lastScrollY = window.pageYOffset;
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
                    document.body.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                    document.body.classList.remove('navbar-scrolled');
                }
                // 方向感知：向下滚动且超过 200px 时隐藏，向上滚动时显示
                // 顶部 50px 内始终显示，菜单展开时始终显示
                const scrollDelta = offset - lastScrollY;
                const menuOpen = navbarMenu && navbarMenu.classList.contains('show');
                if (offset < 50 || menuOpen) {
                    navbar.classList.remove('hidden');
                    document.body.classList.remove('navbar-hidden');
                } else if (scrollDelta > 5 && offset > 200) {
                    navbar.classList.add('hidden');
                    document.body.classList.add('navbar-hidden');
                } else if (scrollDelta < -5) {
                    navbar.classList.remove('hidden');
                    document.body.classList.remove('navbar-hidden');
                }
            }
            lastScrollY = offset;
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
        const isInputFocused = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        // Alt + 1-5 快捷切换页面
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            const navMap = { '1': 'index.html', '2': 'skills.html', '3': 'business.html', '4': 'works.html', '5': 'about.html' };
            if (navMap[e.key]) {
                e.preventDefault();
                window.location.href = navMap[e.key];
            }
        }
        // ESC 关闭弹层（菜单 / 快捷键面板 / 字号面板）
        if (e.key === 'Escape') {
            if (shortcutOverlay && shortcutOverlay.classList.contains('show')) {
                closeShortcutPanel();
            } else if (fontSizePanel && fontSizePanel.classList.contains('show')) {
                fontSizePanel.classList.remove('show');
            } else if (navbarMenu && navbarMenu.classList.contains('show')) {
                setMenuState(false);
            }
        }
        // 仅在非输入框聚焦时响应字母快捷键
        if (!e.altKey && !e.ctrlKey && !e.metaKey && !isInputFocused) {
            // T 切换主题
            if (e.key === 't' || e.key === 'T') {
                if (themeSwitch) themeSwitch.click();
            }
            // R 切换阅读模式
            if (e.key === 'r' || e.key === 'R') {
                document.body.classList.toggle('reading-mode');
                try { localStorage.setItem('readingMode', document.body.classList.contains('reading-mode') ? '1' : '0'); } catch(_) {}
            }
            // ? 或 / 弹出快捷键帮助
            if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
                e.preventDefault();
                openShortcutPanel();
            }
        }
    });

    // ===== 13. 阅读时间估算（移动端不注入，CSS已隐藏） =====
    if (!window.matchMedia('(max-width: 768px)').matches) {
        document.querySelectorAll('.card').forEach(card => {
            if (card.dataset.readingTime) return;
            const text = card.textContent || '';
            const charCount = text.length;
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
    }

    // ===== 统一图片加载失败处理 =====
    document.querySelectorAll('img').forEach(function(img) {
        if (img.dataset.errorBound) return;
        img.dataset.errorBound = '1';
        img.addEventListener('error', function() {
            if (this.style.display === 'none') return; // 防止重复处理
            this.style.display = 'none';
            var parent = this.parentNode;
            if (!parent) return;
            parent.style.background = '#e5e7eb';
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'center';
            parent.style.minHeight = '60px';
            var icon = document.createElement('i');
            icon.className = 'fa fa-book';
            icon.style.cssText = 'font-size:48px;color:#9ca3af';
            icon.setAttribute('aria-hidden', 'true');
            parent.appendChild(icon);
        });
    });

    // ===== 14. 邮箱/微信一键复制 =====
    var copyToastEl = null;
    function showCopyToast(text) {
        if (copyToastEl) {
            copyToastEl.remove();
            copyToastEl = null;
        }
        copyToastEl = document.createElement('div');
        copyToastEl.className = 'copy-toast';
        copyToastEl.textContent = '已复制：' + text;
        document.body.appendChild(copyToastEl);
        setTimeout(() => copyToastEl && copyToastEl.classList.add('show'), 10);
        setTimeout(() => {
            if (copyToastEl) {
                copyToastEl.classList.remove('show');
                setTimeout(() => { if (copyToastEl) { copyToastEl.remove(); copyToastEl = null; } }, 300);
            }
        }, 2000);
    }

    document.querySelectorAll('.contact.info-unit span, .contact.info-unit a, .contact.info-unit .contact-item[role="button"]').forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('@') || /^[\w-]+$/.test(text)) {
            el.style.cursor = 'pointer';
            el.title = '点击复制';
            el.addEventListener('click', function(e) {
                if (this.tagName === 'A') return; // 链接不拦截
                e.preventDefault();
                var self = this;

                // 视觉反馈：被点击元素高亮
                self.classList.add('copied');
                setTimeout(function() { self.classList.remove('copied'); }, 1500);

                // 优先使用现代 Clipboard API（需 HTTPS 或 localhost）
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() { showCopyToast(text); }).catch(() => {
                        fallbackCopy(text, function() { showCopyToast(text); });
                    });
                } else {
                    fallbackCopy(text, function() { showCopyToast(text); });
                }
            });
            // 键盘支持：Enter/Space 触发复制
            if (el.getAttribute('role') === 'button') {
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.click();
                    }
                });
            }
        }
    });

    // ===== 14.1 自媒体链接点击 toast 反馈 =====
    document.querySelectorAll('.media-link').forEach(link => {
        link.addEventListener('click', function() {
            var span = this.querySelector('span');
            var name = span ? span.textContent : '外部平台';
            showCopyToast('正在跳转到' + name + '...');
        });
    });

    // 兜底复制方案（非 HTTPS 环境）
    function fallbackCopy(text, onSuccess) {
        const tmp = document.createElement('textarea');
        tmp.value = text;
        tmp.setAttribute('readonly', '');
        tmp.style.position = 'absolute';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        try {
            document.execCommand('copy');
            onSuccess();
        } catch (err) {}
        document.body.removeChild(tmp);
    }

    // ===== 15. 链接预取（鼠标悬停延迟100ms预加载，仅桌面端） =====
    const prefetchedUrls = new Set();
    if (window.matchMedia('(hover: hover) and (min-width: 769px)').matches) {
        document.querySelectorAll('a[href$=".html"]').forEach(link => {
            var prefetchTimer = null;
            link.addEventListener('mouseenter', function() {
                const href = this.getAttribute('href');
                if (prefetchedUrls.has(href) || href === window.location.pathname.split('/').pop()) return;
                prefetchTimer = setTimeout(function() {
                    prefetchedUrls.add(href);
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = href;
                    document.head.appendChild(prefetchLink);
                }, 100);
            });
            link.addEventListener('mouseleave', function() {
                if (prefetchTimer) {
                    clearTimeout(prefetchTimer);
                    prefetchTimer = null;
                }
            });
        });
    }

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

// ===== 滚动进度条（全局，节流优化） + 阅读进度记忆 =====
let progressTicking = false;
const SCROLL_KEY = 'readingPos:' + location.pathname;

window.addEventListener('scroll', function() {
    if (!progressTicking) {
        window.requestAnimationFrame(function() {
            let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            let scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            const progressBar = document.getElementById("progressBar");
            if (progressBar) progressBar.style.width = scrolled + "%";
            // 阅读进度记忆（节流写入 sessionStorage）
            try { sessionStorage.setItem(SCROLL_KEY, String(winScroll)); } catch(_) {}
            progressTicking = false;
        });
        progressTicking = true;
    }
}, { passive: true });

// 阅读进度恢复（页面加载时）
(function restoreReadingPos() {
    try {
        const saved = sessionStorage.getItem(SCROLL_KEY);
        if (saved && parseInt(saved, 10) > 200) {
            // 延迟到布局稳定后恢复
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.scrollTo(0, parseInt(saved, 10));
                }, 100);
            });
        }
    } catch(_) {}
})();

// ==================================================
// 极致体验：字号调节 / 快捷键面板 / 链接加载指示 / 阅读模式恢复
// ==================================================

// 字号调节：通过 html 根字号缩放（body 用 em 单位会联动）
const FONT_SCALE_KEY = 'fontScale';
const fontScales = { '小': 0.9, '标准': 1, '大': 1.12, '特大': 1.25 };
let currentFontScale = 1;

function applyFontScale(scale) {
    currentFontScale = scale;
    document.documentElement.style.fontSize = scale * 100 + '%';
    try { localStorage.setItem(FONT_SCALE_KEY, String(scale)); } catch(_) {}
    // 更新面板激活态
    document.querySelectorAll('.font-size-panel button').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.scale) === scale);
    });
}

// 注入字号调节按钮 + 面板
function injectFontSizeToggle() {
    const tools = document.querySelector('.navbar-tools');
    if (!tools) return;
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.innerHTML = '<button class="font-size-toggle" id="fontSizeToggle" type="button" aria-label="调节字号" aria-haspopup="true" aria-expanded="false">A</button>' +
        '<div class="font-size-panel" id="fontSizePanel" role="menu" aria-label="字号选择">' +
        Object.keys(fontScales).map(function(k) {
            return '<button type="button" role="menuitem" data-scale="' + fontScales[k] + '">' + k + '</button>';
        }).join('') +
        '</div>';
    // 插到 theme-switch 之前
    tools.insertBefore(wrap, tools.firstChild);

    const toggle = document.getElementById('fontSizeToggle');
    const panel = document.getElementById('fontSizePanel');
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isShow = panel.classList.toggle('show');
        toggle.setAttribute('aria-expanded', isShow ? 'true' : 'false');
    });
    panel.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            applyFontScale(parseFloat(btn.dataset.scale));
            panel.classList.remove('show');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
    // 点击外部关闭
    document.addEventListener('click', function(e) {
        if (!wrap.contains(e.target)) {
            panel.classList.remove('show');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
    return panel;
}

// 注入快捷键帮助面板
function injectShortcutPanel() {
    const overlay = document.createElement('div');
    overlay.className = 'shortcut-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'shortcutTitle');
    overlay.innerHTML =
        '<div class="shortcut-modal">' +
            '<h2 id="shortcutTitle"><i class="fa fa-keyboard-o" aria-hidden="true"></i> 键盘快捷键</h2>' +
            '<p class="shortcut-desc">使用键盘可快速导航与操作，提升浏览效率。</p>' +
            '<ul class="shortcut-list">' +
                '<li><span class="shortcut-label">切换页面</span><kbd>Alt</kbd> + <kbd>1-5</kbd></li>' +
                '<li><span class="shortcut-label">切换夜间/日间模式</span><kbd>T</kbd></li>' +
                '<li><span class="shortcut-label">切换阅读模式</span><kbd>R</kbd></li>' +
                '<li><span class="shortcut-label">显示本帮助面板</span><kbd>?</kbd></li>' +
                '<li><span class="shortcut-label">关闭弹层/菜单</span><kbd>Esc</kbd></li>' +
            '</ul>' +
            '<p class="shortcut-close-hint">按 <kbd>Esc</kbd> 或点击空白处关闭</p>' +
        '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeShortcutPanel();
    });
    // 焦点陷阱：Tab/Shift+Tab 循环在模态框内
    overlay.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;
        var focusables = overlay.querySelectorAll('kbd, button, a, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
    return overlay;
}

var shortcutOverlay = null;
var fontSizePanel = null;
var shortcutPrevFocus = null;

function openShortcutPanel() {
    if (!shortcutOverlay) shortcutOverlay = injectShortcutPanel();
    shortcutPrevFocus = document.activeElement;
    shortcutOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    // 焦点移入模态框
    setTimeout(function() {
        var firstFocusable = shortcutOverlay.querySelector('kbd, button, a, [tabindex]');
        if (firstFocusable) firstFocusable.focus();
    }, 50);
}

function closeShortcutPanel() {
    if (shortcutOverlay) {
        shortcutOverlay.classList.remove('show');
        document.body.style.overflow = '';
        // 焦点恢复到触发元素
        if (shortcutPrevFocus && typeof shortcutPrevFocus.focus === 'function') {
            shortcutPrevFocus.focus();
            shortcutPrevFocus = null;
        }
    }
}

// 链接跳转加载指示
function injectNavLoadingBar() {
    const bar = document.createElement('div');
    bar.className = 'nav-loading-bar';
    document.body.appendChild(bar);
    // 监听站内 .html 链接点击
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        // 仅对站内 .html 链接（非新窗口、非锚点）触发
        if (!href || !href.endsWith('.html') && !href.endsWith('/')) return;
        if (link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        bar.classList.add('loading');
        // 兜底：3 秒后若页面未跳转则隐藏
        setTimeout(function() { bar.classList.remove('loading'); }, 3000);
    });
}

// 阅读模式恢复 + 字号恢复 + DOM 注入（DOMContentLoaded 后执行）
document.addEventListener('DOMContentLoaded', function() {
    // 恢复阅读模式
    try {
        if (localStorage.getItem('readingMode') === '1') {
            document.body.classList.add('reading-mode');
        }
    } catch(_) {}
    // 恢复字号
    try {
        const savedScale = parseFloat(localStorage.getItem(FONT_SCALE_KEY));
        if (savedScale && !isNaN(savedScale)) {
            applyFontScale(savedScale);
        }
    } catch(_) {}
    // 注入控件
    fontSizePanel = injectFontSizeToggle();
    injectNavLoadingBar();
});

// Service Worker 注册（轻量 PWA，网络优先策略）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(reg) {
            reg.addEventListener('updatefound', function() {
                var newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', function() {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
            var refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', function() {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }).catch(function() {});
    });
}

// ==================================================
// Web Vitals 轻量监控（LCP / CLS / INP）
// 收集核心性能指标，输出到 console
// 如需上报后端，配置 WEB_VITALS_ENDPOINT 常量即可
// ==================================================
(function webVitalsMonitor() {
    var WEB_VITALS_ENDPOINT = ''; // 留空则只打印 console，填写 URL 则 beacon 上报

    function logMetric(name, value, rating) {
        var entry = { name: name, value: Math.round(value * 100) / 100, rating: rating, page: location.pathname, ts: Date.now() };
        // 调试输出（开发可见）
        if (typeof console !== 'undefined' && console.debug) {
            console.debug('[Web Vitals]', name, entry.value, '(' + rating + ')');
        }
        // 上报（生产环境填写 ENDPOINT 后启用）
        if (WEB_VITALS_ENDPOINT && navigator.sendBeacon) {
            navigator.sendBeacon(WEB_VITALS_ENDPOINT, JSON.stringify(entry));
        }
    }

    // LCP - 最大内容绘制
    if (window.PerformanceObserver) {
        try {
            var lcpObserver = new PerformanceObserver(function(list) {
                var entries = list.getEntries();
                var lastEntry = entries[entries.length - 1];
                var rating = lastEntry.startTime < 2500 ? 'good' : (lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor');
                logMetric('LCP', lastEntry.startTime, rating);
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch(e) {}

        // CLS - 累积布局偏移
        try {
            var clsValue = 0;
            var clsObserver = new PerformanceObserver(function(list) {
                list.getEntries().forEach(function(entry) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            // 页面隐藏时记录最终 CLS
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && clsValue > 0) {
                    var rating = clsValue < 0.1 ? 'good' : (clsValue < 0.25 ? 'needs-improvement' : 'poor');
                    logMetric('CLS', clsValue, rating);
                    clsValue = 0;
                }
            });
        } catch(e) {}

        // INP - 交互到下一次绘制
        try {
            var inpValue = 0;
            var inpObserver = new PerformanceObserver(function(list) {
                list.getEntries().forEach(function(entry) {
                    inpValue = Math.max(inpValue, entry.duration);
                });
            });
            inpObserver.observe({ type: 'event', buffered: true });
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && inpValue > 0) {
                    var rating = inpValue < 200 ? 'good' : (inpValue < 500 ? 'needs-improvement' : 'poor');
                    logMetric('INP', inpValue, rating);
                    inpValue = 0;
                }
            });
        } catch(e) {}
    }
})();


