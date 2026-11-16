document.addEventListener('DOMContentLoaded', () => {
    const contentEl = document.querySelector('.content');
    const searchInput = document.querySelector('.topbar .search input');
    const chips = document.querySelectorAll('.chips .chip');
    const loginBtn = document.querySelector('.sidebar .login');
    const menuEl = document.querySelector('.sidebar .menu');

    // สร้างกล่องสำหรับแสดงรายการการ์ดโน้ตต่อท้าย .feed-head
    const feedContainer = document.createElement('div');
    feedContainer.className = 'notes-grid';
    feedContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 24px;';
    contentEl.appendChild(feedContainer);

    // 1. ตรวจสอบสถานะการ Login
    const currentUser = JSON.parse(localStorage.getItem('notely_user') || 'null');
    if (currentUser && loginBtn) {
        loginBtn.innerHTML = `<span>👤 ${currentUser.username} (Logout)</span>`;
        loginBtn.href = '#';
        loginBtn.addEventListener('click', (e) => {
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
                feedContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px 0;">ยังไม่มีโน้ตในหมวดหมู่นี้ มาแชร์โน้ตคนแรกกันเลย!</p>`;
                return;
            }

            renderPosts(data.posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            feedContainer.innerHTML = `<p style="color: red;">ไม่สามารถโหลดข้อมูลโน้ตได้</p>`;
        }
    }

    // 3. ฟังก์ชันวาดการ์ดโน้ตแต่ละใบลงหน้าเว็บ
    function renderPosts(posts) {
        feedContainer.innerHTML = '';

        // เรียงโน้ตใหม่ล่าสุดขึ้นก่อน
        const sortedPosts = [...posts].sort((a, b) => b.id - a.id);

        sortedPosts.forEach(post => {
            const card = document.createElement('article');
            card.className = 'note-card';
            card.style.cssText = 'background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between; gap: 12px; border: 1px solid #eee;';

            // แสดงรูปภาพตัวอย่างหรือลิงก์ดาวน์โหลดไฟล์แนบ
            let filesHtml = '';
            if (Array.isArray(post.file) && post.file.length > 0) {
                filesHtml = post.file.map(f => {
                    const fileUrl = `/uploadFiles/${f.filename}`;
                    if (f.mimetype && f.mimetype.startsWith('image/')) {
                        return `<a href="${fileUrl}" target="_blank"><img src="${fileUrl}" alt="${f.originalname}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 10px; margin-top: 8px;"></a>`;
                    }
                    return `<a href="${fileUrl}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 8px 12px; background: #f3f4f6; border-radius: 8px; text-decoration: none; color: #111; font-size: 0.9rem;">📄 เปิดไฟล์: ${f.originalname}</a>`;
                }).join('');
            }

            // เช็คว่าเป็นเจ้าของโพสต์หรือ Admin เพื่อแสดงปุ่ม แก้ไข / ลบ
            const isOwner = currentUser && (currentUser.username === post.username || currentUser.role === 'admin');
            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="background: #eef2ff; color: #4f46e5; padding: 4px 10px; border-radius: 99px; font-size: 0.85rem; font-weight: bold;">
                            ${post.subject || 'ทั่วไป'}
                        </span>
                        <small style="color: #888;">โดย @${post.username || 'Anonymous'}</small>
                    </div>

                    <h3 style="margin: 8px 0 4px; font-size: 1.2rem;">${post.postname}</h3>
                    ${post.tag ? `<div style="color: #6366f1; font-size: 0.85rem; margin-bottom: 6px;">${post.tag}</div>` : ''}
                    <p style="color: #555; font-size: 0.95rem; margin: 0; white-space: pre-wrap;">${post.description || post.desciption || ''}</p>                    ${filesHtml}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 8px; flex-wrap: wrap; gap: 8px;">
                    <a href="comment.html?id=${post.id}" style="text-decoration: none; color: #374151; font-size: 0.9rem;">
                        💬 ความคิดเห็น (${commentCount})
                    </a>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${isOwner ? `
                            <a href="edit.html?id=${post.id}" style="text-decoration: none; font-size: 0.85rem; color: #2563eb;">✏️ แก้ไข</a>
                            <button class="btn-del-post" data-id="${post.id}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-family: inherit; font-size: 0.85rem;">🗑️ ลบ</button>
                        ` : ''}
                        <button class="btn-report-post" data-id="${post.id}" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-family: inherit; font-size: 0.85rem;" title="รายงานโน้ตนี้">🚩 รายงาน</button>
                    </div>
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
    }

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