document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    const fileInput = form?.querySelector('input[type="file"]');
    const dropzoneText = document.querySelector('.dropzone strong');

    // แสดงชื่อไฟล์เมื่อผู้ใช้เลือกไฟล์
    if (fileInput && dropzoneText) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const names = Array.from(fileInput.files).map(f => f.name).join(', ');
                dropzoneText.textContent = `เลือกไฟล์แล้ว: ${names}`;
            } else {
                dropzoneText.textContent = 'อัปโหลดไฟล์';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = JSON.parse(localStorage.getItem('notely_user') || 'null');
            const formData = new FormData();

            formData.append('username', user ? user.username : 'Anonymous');
            formData.append('email', user ? user.email : '');
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
                const res = await fetch('/api/posts/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || 'อัปโหลดโน้ตไม่สำเร็จ');
                    return;
                }

                alert('เผยแพร่โน้ตสำเร็จ!');
                window.location.href = 'home.html';
            } catch (error) {
                console.error('Upload Error:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        });
    }
});