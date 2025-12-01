// App ID (غيرها بأي App ID حقيقي)
let APP_ID = "f224f51f704047f088e2ecd163af5e3e";

// متغيرات عامة
let client;
let localTracks = [];
let currentRoomCode = "";
let currentRoomName = "";
let currentUserName = "";
let isAudioMuted = false;
let isVideoMuted = false;
let callStartTime = null;
let timerInterval = null;

// تهيئة صفحة المكالمة
async function initCallPage() {
    // جلب البيانات من URL
    const urlParams = new URLSearchParams(window.location.search);
    currentRoomCode = urlParams.get('code') || generateRoomCode();
    currentRoomName = decodeURIComponent(urlParams.get('name') || 'مكالمة جديدة');
    currentUserName = localStorage.getItem('meethub_user_name') || 'مستخدم';
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // محاكاة اتصال بدون Agora للاختبار
    simulateCallForTesting();
    
    // بدء المؤقت
    startTimer();
}

// محاكاة اتصال للاختبار
function simulateCallForTesting() {
    console.log("🔧 وضع الاختبار - محاكاة اتصال");
    
    // عرض فيديو محلي تجريبي
    const localVideo = document.getElementById('localVideo');
    
    // طلب إذن الكاميرا والميكروفون
    navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
    }).then(stream => {
        localVideo.srcObject = stream;
        localTracks = stream.getTracks();
        
        console.log("✅ تم تفعيل الكاميرا والميكروفون");
        
        // محاكاة مستخدمين آخرين (للتجربة)
        setTimeout(() => {
            simulateRemoteUser();
        }, 3000);
        
    }).catch(error => {
        console.warn("⚠️ لم يتم تفعيل الكاميرا/ميكروفون:", error);
        
        // استخدام فيديو وهمي
        localVideo.style.backgroundColor = "#2F3136";
        localVideo.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <div style="font-size: 3rem;">🎥</div>
                <div style="margin-top: 10px;">الكاميرا غير متوفرة</div>
            </div>
        `;
    });
}

// محاكاة مستخدم بعيد
function simulateRemoteUser() {
    const videoGrid = document.getElementById('videoGrid');
    
    const remoteVideoContainer = document.createElement('div');
    remoteVideoContainer.className = 'video-container remote-video';
    remoteVideoContainer.innerHTML = `
        <div class="video-wrapper">
            <div style="width: 100%; height: 100%; background: linear-gradient(45deg, #5865F2, #9B59B6); display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: white;">
                    <div style="font-size: 3rem;">👤</div>
                    <div style="margin-top: 10px; font-weight: bold;">مستخدم تجريبي</div>
                </div>
            </div>
            <div class="video-overlay">
                <div class="user-info">
                    <span class="user-name">مستخدم تجريبي</span>
                    <div class="user-status">
                        <span class="mic-status active">🎤</span>
                        <span class="cam-status active">📹</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    videoGrid.appendChild(remoteVideoContainer);
    
    // إضافة للمشاركين
    addParticipantToList('مستخدم تجريبي');
    updateParticipantsCount();
}

// توليد كود غرفة عشوائي
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// تحديث واجهة المستخدم
function updateUI() {
    // تحديث المعلومات الأساسية
    document.getElementById('currentRoomCode').textContent = currentRoomCode;
    document.getElementById('inviteCodeDisplay').textContent = currentRoomCode;
    document.getElementById('mainRoomName').textContent = currentRoomName;
    document.getElementById('localUserName').textContent = currentUserName;
    
    // تحديث وقت البدء
    const now = new Date();
    callStartTime = now;
}

// إضافة مشارك للقائمة
function addParticipantToList(userName) {
    const participantsList = document.getElementById('participantsList');
    
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    
    participantDiv.innerHTML = `
        <div class="participant-avatar">${userName.charAt(0)}</div>
        <div class="participant-info">
            <span class="participant-name">${userName}</span>
            <span class="participant-status">متصل</span>
        </div>
    `;
    
    participantsList.appendChild(participantDiv);
}

// تحديث عدد المشاركين
function updateParticipantsCount() {
    const participants = document.querySelectorAll('.participant').length;
    document.getElementById('participantsCount').textContent = participants;
}

// بدء مؤقت المكالمة
function startTimer() {
    const timerElement = document.getElementById('callTimer');
    
    timerInterval = setInterval(() => {
        if (callStartTime) {
            const now = new Date();
            const diff = Math.floor((now - callStartTime) / 1000);
            
            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            
            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// التحكم في الصوت (محاكاة)
document.getElementById('micToggleBtn').addEventListener('click', function() {
    isAudioMuted = !isAudioMuted;
    
    if (localTracks[1]) { // الميكروفون
        localTracks[1].enabled = !isAudioMuted;
    }
    
    this.innerHTML = isAudioMuted 
        ? '<span class="btn-icon">🔇</span><span class="btn-text">إلغاء الكتم</span>'
        : '<span class="btn-icon">🎤</span><span class="btn-text">كتم</span>';
});

// التحكم في الكاميرا (محاكاة)
document.getElementById('videoToggleBtn').addEventListener('click', function() {
    isVideoMuted = !isVideoMuted;
    
    if (localTracks[0]) { // الكاميرا
        localTracks[0].enabled = !isVideoMuted;
    }
    
    const localVideo = document.getElementById('localVideo');
    if (localVideo.srcObject) {
        localVideo.style.display = isVideoMuted ? 'none' : 'block';
    }
    
    this.innerHTML = isVideoMuted 
        ? '<span class="btn-icon">📷</span><span class="btn-text">تشغيل الكاميرا</span>'
        : '<span class="btn-icon">📹</span><span class="btn-text">إيقاف الكاميرا</span>';
});

// عرض نافذة الدعوة
function showInviteModal() {
    document.getElementById('inviteModal').style.display = 'flex';
}

function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
}

// نسخ كود الدعوة
function copyInviteCode() {
    navigator.clipboard.writeText(currentRoomCode).then(() => {
        alert('تم نسخ كود الدعوة! 📋');
    });
}

function copyRoomCode() {
    copyInviteCode();
}

// إنهاء المكالمة
async function leaveCall() {
    if (confirm('هل تريد إنهاء المكالمة؟')) {
        // إيقاف المؤقت
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // إيقاف الtracks
        if (localTracks) {
            localTracks.forEach(track => {
                if (track) {
                    track.stop();
                }
            });
            localTracks = [];
        }
        
        // التوجيه للصفحة الرئيسية
        window.location.href = 'index.html';
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', initCallPage);
