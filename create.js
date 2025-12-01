// متغيرات عامة
let currentRoomCode = "";
let currentRoomName = "";
let currentUserName = "";

// تهيئة الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // ربط الأزرار بالأحداث
    document.getElementById('createRoomBtn').addEventListener('click', createRoom);
    document.getElementById('copyCodeBtn').addEventListener('click', copyRoomCode);
    
    // إظهار زر بدء المكالمة
    const startMeetingBtn = document.getElementById('startMeetingBtn');
    if (startMeetingBtn) {
        startMeetingBtn.addEventListener('click', startMeeting);
    }
});

// إنشاء غرفة جديدة
function createRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const userName = document.getElementById('userName').value.trim();
    
    // التحقق من البيانات
    if (!roomName) {
        alert('يرجى إدخال اسم المكالمة');
        return;
    }
    
    if (!userName) {
        alert('يرجى إدخال اسمك');
        return;
    }
    
    // إنشاء كود غرفة عشوائي مكون من 6 أحرف/أرقام
    currentRoomCode = generateRoomCode();
    currentRoomName = roomName;
    currentUserName = userName;
    
    // حفظ البيانات في localStorage
    saveRoomData();
    
    // تحديث الواجهة
    updateRoomDisplay();
    
    // إظهار قسم الكود
    document.getElementById('roomCreatedSection').classList.remove('hidden');
    document.querySelector('.form-section').style.display = 'none';
}

// إنشاء كود غرفة عشوائي
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// حفظ بيانات الغرفة
function saveRoomData() {
    const roomData = {
        code: currentRoomCode,
        name: currentRoomName,
        host: currentUserName,
        created: new Date().toISOString()
    };
    
    // حفظ في localStorage
    localStorage.setItem('meethub_current_room', JSON.stringify(roomData));
    localStorage.setItem('meethub_user_name', currentUserName);
}

// تحديث عرض معلومات الغرفة
function updateRoomDisplay() {
    document.getElementById('roomCode').textContent = currentRoomCode;
    document.getElementById('createdRoomName').textContent = currentRoomName;
    document.getElementById('hostName').textContent = currentUserName;
    
    // تحديث رابط بدء المكالمة
    const startBtn = document.getElementById('startMeetingBtn');
    if (startBtn) {
        startBtn.href = `call.html?code=${currentRoomCode}&name=${encodeURIComponent(currentRoomName)}`;
    }
}

// نسخ كود الغرفة
function copyRoomCode() {
    navigator.clipboard.writeText(currentRoomCode).then(() => {
        alert('تم نسخ كود المكالمة! 📋');
        
        // تغيير نص الزر مؤقتًا
        const copyBtn = document.getElementById('copyCodeBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">تم النسخ!</span>';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// بدء المكالمة
function startMeeting() {
    // يتم الانتقال عبر الرابط المحدث
    console.log('بدء المكالمة...');
}

// عرض رسالة نجاح
function showSuccess(message) {
    alert(message);
}
