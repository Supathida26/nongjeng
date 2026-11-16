document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const headTitle = document.querySelector('.modal-head h1');
    const commentsContainer = document.querySelector('.comments');
    const form = document.querySelector('.composer');
    const commentInput = form?.querySelector('input[name="comment"]');

    const currentUser = JSON.parse(localStorage.getItem('notely_user') || 'null');

    if (!postId) {
        alert('ไม่พบรหัสโน้ต');
        window.location.href = 'home.html';
        return;
    }

    // 1. โหลดคอมเมนต์ทั้งหมดของโน้ตนี้
    async function loadComments() {
        try {
            const res = await fetch(`/api/posts/${postId}`);
            const data = await res.json();

            if (!res.ok || !data.post) {
                commentsContainer.innerHTML = `<p style="padding: 16px; color: #dc2626;">ไม่พบข้อมูลโน้ต</p>`;
                return;
            }

            const comments = Array.isArray(data.post.comments) ? data.post.comments : [];
            if (headTitle) {
                headTitle.textContent = `กล่องแสดงความคิดเห็น (${comments.length})`;
            }

            renderComments(comments);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    // 2. วาดรายการคอมเมนต์ลงในกล่อง .comments
    function renderComments(comments) {
        commentsContainer.innerHTML = '';

        if (comments.length === 0) {
            commentsContainer.innerHTML = `<p style="text-align: center; color: #888; padding: 24px 0;">ยังไม่มีความคิดเห็น มาเริ่มพูดคุยเป็นคนแรกกันเลย!</p>`;
            return;
        }

        comments.forEach(c => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;';

            const isOwner = currentUser && (currentUser.username === c.username || currentUser.role === 'admin');
            const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleString('th-TH') : '';

            item.innerHTML = `
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <strong style="color: #111;">@${c.username || 'Anonymous'}</strong>
                        <small style="color: #9ca3af; font-size: 0.75rem;">${dateStr}</small>
                    </div>
                    <p style="margin: 0; color: #374151;">${c.comment}</p>
                </div>
                <div style="display: flex; gap: 6px; flex-shrink: 0;">
                    ${isOwner ? `<button class="btn-del-comment" data-cid="${c.commentId}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 0.8rem;">ลบ</button>` : ''}
                    <button class="btn-report-comment" data-cid="${c.commentId}" data-user="${c.username}" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.8rem;" title="รายงานความคิดเห็น">🚩</button>
                </div>
            `;

            commentsContainer.appendChild(item);
        });

        // ปุ่มลบคอมเมนต์
        document.querySelectorAll('.btn-del-comment').forEach(btn => {
            btn.addEventListener('click', async () => {
                const commentId = btn.dataset.cid;
                if (!confirm('ต้องการลบความคิดเห็นนี้หรือไม่?')) return;

                const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
                if (res.ok) loadComments();
            });
        });

        // ปุ่มรายงานคอมเมนต์
        document.querySelectorAll('.btn-report-comment').forEach(btn => {
            btn.addEventListener('click', async () => {
                const commentId = btn.dataset.cid;
                const targetUsername = btn.dataset.user;
                const reason = prompt('ระบุเหตุผลที่ต้องการรายงานความคิดเห็นนี้:');
                if (!reason || !reason.trim()) return;

                const res = await fetch('/api/reports/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'comment',
                        postId: Number(postId),
                        commentId: Number(commentId),
                        targetUsername: targetUsername,
                        reporterUsername: currentUser ? currentUser.username : 'Anonymous',
                        reason: reason.trim()
                    })
                });
                const data = await res.json();
                alert(data.message);
            });
        });
    }

    // 3. ส่งความคิดเห็นใหม่
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = commentInput.value.trim();
            if (!text) return;

            try {
                const res = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: currentUser ? currentUser.username : 'Anonymous',
                        comment: text
                    })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    alert(data.message || 'ส่งความคิดเห็นไม่สำเร็จ');
                    return;
                }

                commentInput.value = '';
                loadComments();
            } catch (error) {
                console.error('Add comment error:', error);
                alert('ไม่สามารถส่งความคิดเห็นได้');
            }
        });
    }

    loadComments();
});