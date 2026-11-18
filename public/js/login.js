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

    function initGoogleLogin() {
    if (!buttonContainer) return;
    buttonContainer.innerHTML = '';
    // --- 1. ตั้งค่า Google Identity Services (เพิ่มส่วนนี้เข้าไป) ---
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: '775188938088-7kq52f7914qj24o8ljgl3k92m504skg9.apps.googleusercontent.com',
            callback: handleCredentialResponse
        });
    //}

    // เมื่อผู้ใช้กดปุ่ม Google Login ที่เพื่อนออกแบบไว้
    /*if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('Prompt skipped, trying alternative...');
                    /*google.accounts.id.renderButton(
                        googleBtn, // แปลงปุ่มเพื่อนให้กลายเป็นปุ่ม Google แบบเนียนๆ
                        { theme: "outline", size: "large", width: "100%" }
                    );
                }
            });*/
            if (buttonContainer) {
            google.accounts.id.renderButton(
                buttonContainer,
                { 
                    type: "standard",
                    shape: "rectangular",
                    //theme: "filled_black",
                    size: "large",         // ขนาดปุ่ม
                    text: "signin_with",   // ข้อความ
                    locale: "th",           // บังคับแสดงผลเป็นภาษาไทย
                    width: 350
                });
            }
                // หมายเหตุ: วิธีนี้ปุ่มจะเปลี่ยนเป็นของ Google เพื่อให้กดผ่าน FedCM ได้
        }
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