document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    const form = document.querySelector('.form');
    const fileInput = form?.querySelector('input[type="file"]');

    if (!postId) {
        alert('ไม่พบรหัสโน้ตที่ต้องการแก้ไข');
        window.location.href = 'home.html';
        return;
    }

    // 1. ดึงข้อมูลเดิมของโน้ตมาใส่ในฟอร์ม
    try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();

        if (!res.ok || !data.post) {
            alert(data.message || 'ไม่พบข้อมูลโน้ต');
            window.location.href = 'home.html';
            return;
        }

        const post = data.post;
        form.title.value = post.postname || '';
        form.tags.value = post.tag || '';
        form.detail.value = post.description || post.desciption || '';

        // ถ้าวิชาของโน้ตยังไม่มีใน <select> (เช่น "สังคมศึกษา") ให้สร้าง <option> เพิ่มให้อัตโนมัติ
        if (post.subject) {
            const exists = Array.from(form.subject.options).some(opt => opt.value === post.subject || opt.text === post.subject);
            if (!exists) {
                const newOption = new Option(post.subject, post.subject);
                form.subject.add(newOption);
            }
            form.subject.value = post.subject;
        }
    } catch (error) {
        console.error('Load post error:', error);
        alert('ไม่สามารถดึงข้อมูลโน้ตได้');
    }

    // 2. บันทึกการแก้ไขเมื่อกด Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('postname', form.title.value.trim());
            formData.append('subject', form.subject.value);
            formData.append('tag', form.tags.value.trim());
            formData.append('description', form.detail.value.trim());

            if (fileInput && fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('file', fileInput.files[i]);
                }
            }

            try {
                const res = await fetch(`/api/posts/${postId}/edits`, {
                    method: 'PUT',
                    body: formData
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || 'แก้ไขโน้ตไม่สำเร็จ');
                    return;
                }

                alert('แก้ไขโน้ตสำเร็จ!');
                window.location.href = 'home.html';
            } catch (error) {
                console.error('Update error:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        });
    }
});