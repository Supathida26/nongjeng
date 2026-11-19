document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    const titleEl = document.querySelector('.modal h1');
    const subtitleEl = document.querySelector('.subtitle');
    const submitBtn = document.querySelector('.btn-login');
    const signupContainer = document.querySelector('.signup');
    //const googleBtn = document.querySelector('.btn-google');
    const buttonContainer = document.querySelector('.googleButtonContainer');

    let isRegisterMode = false;

    initGoogleLogin();

    function initGoogleLogin(attempt = 0) {
    if (!buttonContainer) return;

    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        if (attempt < 20) {
            setTimeout(() => initGoogleLogin(attempt + 1), 200);
        }
        return;
    }

    buttonContainer.innerHTML = '';
    google.accounts.id.initialize({
        client_id: '775188938088-7kq52f7914qj24o8ljgl3k92m504skg9.apps.googleusercontent.com',
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        buttonContainer,
        {
            type: 'standard',
            shape: 'rectangular',
            size: 'large',
            text: 'signin_with',
            locale: 'th',
            width: 350
        }
    );
}


    // ฟังก์ชันรับ credential (ID Token) แล้วส่งให้ Backend
    async function handleCredentialResponse(response) {
        const credential = response.credential;
        try {
            const res = await fetch('/api/users/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });

            const data = await res.json();

            // รองรับระบบ Ban (HTTP 403)
            if (res.status === 403 && data.isBanned) {
                alert('บัญชีของคุณถูกระงับ ไม่สามารถเข้าเว็บไซต์นี้ได้')
                return;
            }

            if (!res.ok || !data.success) {
                alert(data.message || 'Google Login ไม่สำเร็จ กรุณาลองใหม่');
                return;
            }

            // บันทึก User ลง LocalStorage และพาไปหน้าถัดไป
            localStorage.setItem('notely_user', JSON.stringify(data.user));
            alert(data.message || 'เข้าสู่ระบบสำเร็จ');

            // พาไปหน้า Admin หรือ Home ตาม Role
            if (data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'home.html';
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
    }

    // สลับโหมด เข้าสู่ระบบ <-> สมัครสมาชิก เมื่อกดลิงก์ด้านล่าง
    if (signupContainer) {
        signupContainer.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();

            isRegisterMode = !isRegisterMode;
            if (isRegisterMode) {
                titleEl.textContent = 'สร้างบัญชีใหม่';
                subtitleEl.textContent = 'สมัครสมาชิกเพื่อเริ่มแบ่งปันโน้ตของคุณ';
                submitBtn.textContent = 'สมัครสมาชิก →';
                signupContainer.innerHTML = 'มีบัญชีอยู่แล้ว? <a href="#">เข้าสู่ระบบ</a>';
            } else {
                titleEl.textContent = 'ยินดีต้อนรับกลับมา';
                subtitleEl.textContent = 'กรุณาเข้าสู่ระบบเพื่อเรียนรู้ต่อจากที่ค้างไว้';
                submitBtn.textContent = 'เข้าสู่ระบบ →';
                signupContainer.innerHTML = 'ยังไม่มีบัญชี? <a href="#">สมัครสมาชิก</a>';
            }
        });
    }

    // เมื่อกดปุ่ม Submit ฟอร์ม
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const identifier = form.username.value.trim();
            const password = form.password.value;

            const endpoint = isRegisterMode ? '/api/users/register' : '/api/users/login';
            const payload = isRegisterMode 
                ? { 
                    username: identifier, 
                    email: identifier.includes('@') ? identifier : `${identifier}@gmail.com`, 
                    password 
                  }
                : { identifier, password };

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
                    return;
                }

                // บันทึกข้อมูลผู้ใช้ลง localStorage เพื่อใช้ในหน้าอื่นๆ
                localStorage.setItem('notely_user', JSON.stringify(data.user));
                alert(data.message);

                // ถ้าเป็น Admin ให้พาไปหน้าห้อง Admin ถ้าเป็น User พาไปหน้าหลัก
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'home.html';
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            }
        });
    }
});