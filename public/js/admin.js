document.addEventListener('DOMContentLoaded', () => {
    const welcomeNameEl = document.querySelector('.welcome p');
    const emailEl = document.querySelector('.profile .email');
    const userTableBody = document.querySelector('.table-card tbody');

    // อ้างอิงช่องค้นหาและพาเนลทั้ง 4 บล็อกในหน้า admin.html
    const blocks = document.querySelectorAll('.content .block');
    const userSearchInput = blocks[0]?.querySelector('.search input');

    const noteReportPanel = blocks[1]?.querySelector('.panel');
    const noteReportSearch = blocks[1]?.querySelector('.search input');

    const userReportPanel = blocks[2]?.querySelector('.panel');
    const userReportSearch = blocks[2]?.querySelector('.search input');

    const commentReportPanel = blocks[3]?.querySelector('.panel');
    const commentReportSearch = blocks[3]?.querySelector('.search input');

    // 1. แสดงข้อมูล Admin ที่ล็อกอินอยู่
    const currentUser = JSON.parse(localStorage.getItem('notely_user') || 'null');
    if (currentUser) {
        if (welcomeNameEl) welcomeNameEl.textContent = `คุณ ${currentUser.username}`;
        if (emailEl) emailEl.textContent = currentUser.email || '';
    }

    // 2. โหลดและแสดงตารางข้อมูลผู้ใช้
    async function loadUsers(search = '') {
        if (!userTableBody) return;
        try {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
            const data = await res.json();

            userTableBody.innerHTML = '';

            if (!res.ok || !data.users || data.users.length === 0) {
                userTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 16px;">ไม่พบข้อมูลผู้ใช้</td></tr>`;
                return;
            }

            data.users.forEach(u => {
                const tr = document.createElement('tr');
                const isBanned = u.status === 'banned';

                tr.innerHTML = `
                    <td><strong>${u.username}</strong> ${isBanned ? '<span style="color: red; font-size: 0.8rem;">(ถูกระงับ)</span>' : ''}</td>
                    <td>${u.email || '-'}</td>
                    <td>${u.role || 'user'}</td>
                    <td>
                        <button class="btn-ban" data-username="${u.username}" data-status="${isBanned ? 'normal' : 'banned'}" style="padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; background: ${isBanned ? '#10b981' : '#f59e0b'}; color: #fff;">
                            ${isBanned ? 'ปลดแบน' : 'ระงับบัญชี'}
                        </button>
                    </td>
                    <td>
                        <button class="btn-del-user" data-username="${u.username}" style="padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; background: #ef4444; color: #fff;">
                            ลบบัญชี
                        </button>
                    </td>
                `;
                userTableBody.appendChild(tr);
            });

            // ผูก Event ปุ่มแบน/ปลดแบน
            userTableBody.querySelectorAll('.btn-ban').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const username = btn.dataset.username;
                    const nextStatus = btn.dataset.status;

                    const res = await fetch('/api/admin/users/ban', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, status: nextStatus })
                    });
                    const result = await res.json();
                    alert(result.message);
                    loadUsers(userSearchInput?.value.trim() || '');
                });
            });

            // ผูก Event ปุ่มลบบัญชีผู้ใช้
            userTableBody.querySelectorAll('.btn-del-user').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const username = btn.dataset.username;
                    if (!confirm(`ยืนยันการลบบัญชีผู้ใช้ "${username}" ถาวรหรือไม่?`)) return;

                    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
                        method: 'DELETE'
                    });
                    const result = await res.json();
                    alert(result.message);
                    loadUsers(userSearchInput?.value.trim() || '');
                });
            });

        } catch (error) {
            console.error('Load users error:', error);
        }
    }

    // 3. โหลดและแสดงรายการ Report ทั้ง 3 กล่อง
    let allReports = [];

    async function loadReports() {
        try {
            const res = await fetch('/api/admin/reports');
            const data = await res.json();
            allReports = (res.ok && Array.isArray(data.reports)) ? data.reports : [];
            renderAllReportPanels();
        } catch (error) {
            console.error('Load reports error:', error);
        }
    }

    function renderAllReportPanels() {
        // ถ้ารายงานเก่าใน report.json ไม่มีฟิลด์ type ให้ถือว่าเป็น 'note'
        const noteReports = allReports.filter(r => (r.type || 'note') === 'note');
        const userReports = allReports.filter(r => r.type === 'user');
        const commentReports = allReports.filter(r => r.type === 'comment');

        renderReportList(noteReportPanel, noteReports, noteReportSearch?.value.trim() || '');
        renderReportList(userReportPanel, userReports, userReportSearch?.value.trim() || '');
        renderReportList(commentReportPanel, commentReports, commentReportSearch?.value.trim() || '');
    }

    function renderReportList(panelEl, reports, keyword) {
        if (!panelEl) return;

        let filtered = reports;
        if (keyword) {
            const kw = keyword.toLowerCase();
            filtered = reports.filter(r =>
                r.reason?.toLowerCase().includes(kw) ||
                r.reporterUsername?.toLowerCase().includes(kw) ||
                r.targetUsername?.toLowerCase().includes(kw) ||
                String(r.postId || '').includes(kw)
            );
        }

        if (filtered.length === 0) {
            panelEl.innerHTML = `<p style="color: #888; text-align: center; padding: 16px;">ไม่มีรายการรายงาน</p>`;
            return;
        }

        panelEl.innerHTML = filtered.map(r => {
            const isResolved = r.status === 'resolved';
            return `
                <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <div>
                        <div style="font-weight: bold; color: #111;">
                            ${r.postId ? `โพสต์ ID: #${r.postId}` : ''} 
                            ${r.targetUsername ? `ผู้ใช้: @${r.targetUsername}` : ''}
                            <span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 99px; background: ${isResolved ? '#d1fae5' : '#fef3c7'}; color: ${isResolved ? '#065f46' : '#92400e'};">
                                ${isResolved ? 'ดำเนินการแล้ว' : 'รอดำเนินการ'}
                            </span>
                        </div>
                        <div style="color: #dc2626; font-size: 0.9rem; margin-top: 4px;">เหตุผล: ${r.reason}</div>
                        <small style="color: #6b7280;">รายงานโดย: @${r.reporterUsername || 'Anonymous'}</small>
                    </div>

                    <div style="display: flex; gap: 6px;">
                        ${r.postId ? `<button class="btn-admin-del-post" data-pid="${r.postId}" data-rid="${r.reportId}" style="padding: 4px 8px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">ลบโพสต์นี้</button>` : ''}
                        ${!isResolved ? `<button class="btn-resolve-report" data-rid="${r.reportId}" style="padding: 4px 8px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">✓ แก้ไขแล้ว</button>` : ''}
                        <button class="btn-del-report" data-rid="${r.reportId}" style="padding: 4px 8px; background: #9ca3af; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">ลบรายงาน</button>
                    </div>
                </div>
            `;
        }).join('');

        // ปุ่มลบโพสต์ที่ถูกรายงาน (เช่น โพสต์ไอโฟน 18 ฟรี ID 13)
        panelEl.querySelectorAll('.btn-admin-del-post').forEach(btn => {
            btn.addEventListener('click', async () => {
                const postId = btn.dataset.pid;
                const reportId = btn.dataset.rid;
                if (!confirm(`ต้องการลบโพสต์ ID #${postId} ออกจากระบบทันทีหรือไม่?`)) return;

                const res = await fetch(`/api/admin/${postId}/deletepost`, { method: 'DELETE' });
                const data = await res.json();
                alert(data.message);

                if (res.ok && reportId) {
                    await fetch(`/api/admin/${reportId}/resolve`, { method: 'PATCH' });
                    loadReports();
                }
            });
        });

        // ปุ่มเปลี่ยนสถานะรายงานเป็น ดำเนินการแล้ว (Resolved)
        panelEl.querySelectorAll('.btn-resolve-report').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reportId = btn.dataset.rid;
                const res = await fetch(`/api/admin/${reportId}/resolve`, { method: 'PATCH' });
                if (res.ok) loadReports();
            });
        });

        // ปุ่มลบรายงานออกจากกล่อง
        panelEl.querySelectorAll('.btn-del-report').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reportId = btn.dataset.rid;
                const res = await fetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
                if (res.ok) loadReports();
            });
        });
    }

    // 4. ผูก Event ช่องค้นหาทั้งหมดในหน้า Admin
    userSearchInput?.addEventListener('input', (e) => loadUsers(e.target.value.trim()));
    noteReportSearch?.addEventListener('input', () => renderAllReportPanels());
    userReportSearch?.addEventListener('input', () => renderAllReportPanels());
    commentReportSearch?.addEventListener('input', () => renderAllReportPanels());

    // โหลดข้อมูลทั้งหมดเมื่อเปิดหน้า Admin
    loadUsers();
    loadReports();
});