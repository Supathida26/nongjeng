document.addEventListener('DOMContentLoaded', () => {
    const contentEl = document.querySelector('.content');
    const searchInput = document.querySelector('.topbar .search input');
    const chips = document.querySelectorAll('.chips .chip');
    const loginBtn = document.querySelector('.sidebar .login');
    const menuEl = document.querySelector('.sidebar .menu');

    // สร้างกล่องสำหรับแสดงรายการการ์ดโน้ตต่อท้าย .feed-head
    const feedContainer = document.createElement('div');
    feedContainer.className = 'notes-grid';
    contentEl.appendChild(feedContainer);

    // 1. ตรวจสอบสถานะการ Login
    const currentUser = JSON.parse(localStorage.getItem('notely_user') || 'null');
    if (currentUser && loginBtn) {
        const uname = currentUser.username || 'User';
        const uemail = currentUser.email || '';
        const uavatar = currentUser.avatar
            ? `<img src="${esc(currentUser.avatar)}" alt="">`
            : esc(uname.charAt(0).toUpperCase());

        // เปลี่ยนปุ่ม Login ให้เป็นกล่องโปรไฟล์ (รูปวงกลม + ชื่อ + อีเมล + ปุ่มออกจากระบบ)
        loginBtn.classList.add('logged-in');
        loginBtn.removeAttribute('href');
        loginBtn.innerHTML = `
            <div class="user-row">
                <div class="user-avatar">${uavatar}</div>
                <div class="user-info">
                    <span class="user-name" title="${esc(uname)}">${esc(uname)}</span>
                    ${uemail ? `<span class="user-email" title="${esc(uemail)}">${esc(uemail)}</span>` : ''}
                </div>
            </div>
            <button class="user-logout" type="button">ออกจากระบบ</button>
        `;

        loginBtn.querySelector('.user-logout').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('ต้องการออกจากระบบหรือไม่?')) {
                localStorage.removeItem('notely_user');
                window.location.reload();
            }
        });

        // ถ้าเป็น Admin ให้เพิ่มปุ่มเข้าห้อง Admin บนแถบเมนูซ้าย
        if (currentUser.role === 'admin' && menuEl) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.className = 'menu-item';
            adminLink.innerHTML = `<span>🛡️ ห้อง Admin</span>`;
            menuEl.appendChild(adminLink);
        }
    }

    let currentSubject = 'ทั้งหมด';
    let currentSearch = '';

    // ---------- ฟังก์ชันช่วยเหลือ ----------
    // กันข้อความจากผู้ใช้ไปแทรก HTML
    function esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // แปลงเวลาเป็น "3 ชั่วโมงที่แล้ว"
    function timeAgo(value) {
        if (!value) return '';
        const t = new Date(value).getTime();
        if (isNaN(t)) return '';
        const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
        if (sec < 60) return 'เมื่อสักครู่';
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min} นาทีที่แล้ว`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
        const day = Math.floor(hr / 24);
        if (day < 30) return `${day} วันที่แล้ว`;
        const mon = Math.floor(day / 30);
        if (mon < 12) return `${mon} เดือนที่แล้ว`;
        return `${Math.floor(mon / 12)} ปีที่แล้ว`;
    }

    // แปลงขนาดไฟล์เป็นข้อความอ่านง่าย
    function fmtSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    // เก็บสถานะไลก์ไว้ในเครื่องผู้ใช้
    function getSet(key) {
        try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
        catch { return new Set(); }
    }
    function saveSet(key, set) {
        localStorage.setItem(key, JSON.stringify([...set]));
    }

    // ไอคอน SVG
    const ICON = {
        heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
        comment: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12z"/></svg>',
        file: '<svg class="note-file-icon" viewBox="0 0 24 24" fill="none" stroke="#1d1300" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>'
    };

    // 2. ฟังก์ชันดึงข้อมูลโน้ตจาก Backend
    async function loadPosts() {
        try {
            const params = new URLSearchParams();
            if (currentSubject && currentSubject !== 'ทั้งหมด') {
                params.append('subject', currentSubject);
            }
            if (currentSearch) {
                params.append('search', currentSearch);
            }

            const res = await fetch(`/api/posts?${params.toString()}`);
            const data = await res.json();

            if (!res.ok || !data.posts || data.posts.length === 0) {
                feedContainer.innerHTML = `<p class="notes-empty">ยังไม่มีโน้ตในหมวดหมู่นี้ มาแชร์โน้ตคนแรกกันเลย!</p>`;
                return;
            }

            renderPosts(data.posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            feedContainer.innerHTML = `<p class="notes-empty" style="color: #ff6b6b;">ไม่สามารถโหลดข้อมูลโน้ตได้</p>`;
        }
    }

    // 3. ฟังก์ชันวาดการ์ดโน้ตแต่ละใบลงหน้าเว็บ
    function renderPosts(posts) {
        feedContainer.innerHTML = '';

        const likedSet = getSet('notely_liked');

        // เรียงโน้ตใหม่ล่าสุดขึ้นก่อน
        const sortedPosts = [...posts].sort((a, b) => b.id - a.id);

        sortedPosts.forEach(post => {
            const card = document.createElement('article');
            card.className = 'note-card';


            // กล่องไฟล์ด้านขวา (ใช้ไฟล์แรก ถ้ามีหลายไฟล์แสดงป้าย +n)
            let fileHtml = '';

            if (Array.isArray(post.file) && post.file.length > 0) {
                const f = post.file[0];
                const fileUrl = `/uploadFiles/${encodeURIComponent(f.filename)}`;
                const isImage = f.mimetype && f.mimetype.startsWith('image/');
                const moreBadge = post.file.length > 1
                    ? `<span class="note-file-more">+${post.file.length - 1}</span>`
                    : '';
                const sub = f.pages ? `${f.pages} หน้า` : fmtSize(f.size);

                if (isImage) {
                    // รูปภาพ: แสดงเฉพาะรูป ไม่แสดงชื่อไฟล์
                    fileHtml = `
                        <a class="note-file is-image" href="${fileUrl}" target="_blank">
                            <img src="${fileUrl}" alt="รูปภาพแนบ">
                            ${moreBadge}
                        </a>`;
                } else {
                    // ไฟล์เอกสาร: ยังคงแสดงชื่อและขนาดไฟล์ตามเดิม
                    fileHtml = `
                        <a class="note-file" href="${fileUrl}" target="_blank">
                            ${ICON.file}
                            <span class="note-file-name">${esc(f.originalname)}</span>
                            ${sub ? `<span class="note-file-size">${esc(sub)}</span>` : ''}
                            ${moreBadge}
                        </a>`;
                }
            }

            // เช็คว่าเป็นเจ้าของโพสต์หรือ Admin เพื่อแสดงปุ่ม แก้ไข / ลบ
            const isOwner = currentUser && (currentUser.username === post.username || currentUser.role === 'admin');
            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
            const likeCount = Number(post.likes) || 0;

            // ข้อมูลผู้โพสต์
            const username = post.username || 'Anonymous';
            const timeText = timeAgo(post.createdAt || post.date || post.timestamp);
            const metaParts = [post.email, timeText].filter(Boolean).map(esc);
            const metaText = metaParts.join(' - ');
            const avatarHtml = post.avatar
                ? `<img src="${esc(post.avatar)}" alt="">`
                : esc(username.charAt(0).toUpperCase());

            // แท็ก: หมวดวิชา + แท็กอื่นๆ (แยกด้วยช่องว่าง)
            const tagItems = [];
            if (post.subject) tagItems.push(`#${post.subject}`);
            if (post.tag) {
                String(post.tag).split(/\s+/).filter(Boolean).forEach(t => {
                    tagItems.push(t.startsWith('#') ? t : `#${t}`);
                });
            }
            if (tagItems.length === 0) tagItems.push('#ทั่วไป');
            const tagsHtml = tagItems.map(t => `<span class="note-tag">${esc(t)}</span>`).join('');

            const isLiked = likedSet.has(String(post.id));

            card.innerHTML = `
                <div class="note-top">
                    <div class="note-avatar">${avatarHtml}</div>
                    <div class="note-user">
                        <span class="note-name">${esc(username)}</span>
                        ${metaText ? `<span class="note-meta">${metaText}</span>` : ''}
                    </div>
                    <div class="note-more">
                        <button class="note-more-btn" type="button" title="ตัวเลือก">···</button>
                        <div class="note-dropdown">
                            ${isOwner ? `
                                <a href="edit.html?id=${post.id}">✏️ แก้ไข</a>
                                <button class="btn-del-post danger" data-id="${post.id}" type="button">🗑️ ลบ</button>
                            ` : ''}
                            <button class="btn-report-post" data-id="${post.id}" type="button" title="รายงานโน้ตนี้">🚩 รายงาน</button>
                        </div>
                    </div>
                </div>

                <div class="note-body">
                    <div class="note-main">
                        <div class="note-tags">${tagsHtml}</div>
                        <h3 class="note-title">${esc(post.postname)}</h3>
                        <p class="note-desc">${esc(post.description || post.desciption || '')}</p>
                    </div>
                    ${fileHtml}
                </div>

                <div class="note-footer">
                    <button class="note-action btn-like ${isLiked ? 'liked' : ''}" data-id="${post.id}" data-count="${likeCount}" type="button">
                        ${ICON.heart}<span>${likeCount + (isLiked ? 1 : 0)}</span>
                    </button>
                    <a class="note-action" href="comment.html?id=${post.id}">
                        ${ICON.comment}<span>${commentCount}</span>
                    </a>
                </div>
            `;

            feedContainer.appendChild(card);
        });

        // ผูก Event ปุ่มลบโน้ต
        document.querySelectorAll('.btn-del-post').forEach(btn => {
            btn.addEventListener('click', async () => {
                const postId = btn.dataset.id;
                if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตนี้?')) return;

                const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
                const data = await res.json();
                alert(data.message);
                if (res.ok) loadPosts();
            });
        });

        // ผูก Event ปุ่มรายงานโน้ต
        document.querySelectorAll('.btn-report-post').forEach(btn => {
            btn.addEventListener('click', async () => {
                const postId = btn.dataset.id;
                const reason = prompt('ระบุเหตุผลที่ต้องการรายงานโน้ตนี้ (เช่น เนื้อหาไม่เหมาะสม, สแปม):');
                if (!reason || !reason.trim()) return;

                const res = await fetch('/api/reports/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'note',
                        postId: Number(postId),
                        reporterUsername: currentUser ? currentUser.username : 'Anonymous',
                        reason: reason.trim()
                    })
                });
                const data = await res.json();
                alert(data.message);
            });
        });

        // ผูก Event ปุ่มเปิด/ปิดเมนู ...
        document.querySelectorAll('.note-more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                const wasOpen = dropdown.classList.contains('open');
                closeAllDropdowns();
                if (!wasOpen) dropdown.classList.add('open');
            });
        });

        // ผูก Event ปุ่มไลก์ (เก็บในเครื่องผู้ใช้)
        document.querySelectorAll('.btn-like').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = String(btn.dataset.id);
                const base = Number(btn.dataset.count) || 0;
                const set = getSet('notely_liked');
                if (set.has(id)) set.delete(id); else set.add(id);
                saveSet('notely_liked', set);

                const liked = set.has(id);
                btn.classList.toggle('liked', liked);
                btn.querySelector('span').textContent = base + (liked ? 1 : 0);
            });
        });
    }

    // ปิดเมนู ... ทุกอันเมื่อคลิกที่อื่น
    function closeAllDropdowns() {
        document.querySelectorAll('.note-dropdown.open').forEach(d => d.classList.remove('open'));
    }
    document.addEventListener('click', closeAllDropdowns);

    // 4. กรองตามหมวดวิชา (Chips)
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            currentSubject = chip.textContent.trim();
            loadPosts();
        });
    });

    // 5. ค้นหาโน้ตแบบ Real-time
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.trim();
            loadPosts();
        });
    }

    // โหลดโน้ตครั้งแรกเมื่อเปิดหน้าเว็บ
    loadPosts();
});