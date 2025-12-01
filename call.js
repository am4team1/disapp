// App ID الخاص بـ Agora
const APP_ID = "42a558edf70743f0bd79bb1af79566fe";

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
    currentRoomCode = urlParams.get('code') || 'TEST123';
    currentRoomName = decodeURIComponent(urlParams.get('name') || 'مكالمة جديدة');
    currentUserName = localStorage.getItem('meethub_user_name') || 'مستخدم';
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // الانضمام للمكالمة
    await joinCall();
    
    // بدء المؤقت
    startTimer();
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
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    callStartTime = now;
}

// الانضمام للمكالمة
async function joinCall() {
    try {
        console.log('🚀 جاري الانضمام للمكالمة...');
        
        // التحقق من App ID
        if (!APP_ID || APP_ID === "YOUR_APP_ID_HERE") {
            throw new Error('App ID غير مضبوط. تأكد من وضع الـ App ID الصحيح');
        }
        
        // إنشاء عميل Agora
        client = AgoraRTC.createClient({ 
            mode: "rtc", 
            codec: "vp8" 
        });
        
        // تسجيل الأحداث
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);
        
        // الانضمام للقناة
        await client.join(APP_ID, currentRoomCode, null, currentUserName);
        console.log('✅ تم الانضمام للقناة');
        
        // إنشاء الميكروفون والكاميرا
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        // عرض الفيديو المحلي
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = new MediaStream([localTracks[1].getMediaStreamTrack()]);
        
        // نشر الوسائط
        await client.publish(localTracks);
        console.log('✅ تم نشر الوسائط');
        
        // تحديث عدد المشاركين
        updateParticipantsCount();
        
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error);
        
        // عرض رسالة خطأ
        alert(`خطأ في الاتصال: ${error.message}\n\nجاري الرجوع للصفحة الرئيسية...`);
        
        // الرجوع للصفحة الرئيسية بعد 3 ثواني
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}

// التعامل مع المستخدمين الجدد
async function handleUserPublished(user, mediaType) {
    console.log(`👤 مستخدم جديد: ${user.uid}`);
    
    // الاشتراك في وسائط المستخدم
    await client.subscribe(user, mediaType);
    
    if (mediaType === "video") {
        addVideoElement(user);
    }
    
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
    
    // تحديث قائمة المشاركين
    addParticipantToList(user);
    updateParticipantsCount();
}

function handleUserUnpublished(user) {
    console.log(`👤 مستخدم خرج: ${user.uid}`);
    removeVideoElement(user.uid);
    removeParticipantFromList(user.uid);
    updateParticipantsCount();
}

function handleUserJoined(user) {
    console.log(`👤 انضم مستخدم: ${user.uid}`);
    updateParticipantsCount();
}

function handleUserLeft(user) {
    console.log(`👤 غادر مستخدم: ${user.uid}`);
    updateParticipantsCount();
}

// إضافة عنصر فيديو جديد
function addVideoElement(user) {
    const videoGrid = document.getElementById('videoGrid');
    
    // منع التكرار
    if (document.getElementById(`video-${user.uid}`)) return;
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container remote-video';
    videoContainer.id = `video-${user.uid}`;
    
    videoContainer.innerHTML = `
        <div class="video-wrapper">
            <video id="remoteVideo-${user.uid}" autoplay></video>
            <div class="video-overlay">
                <div class="user-info">
                    <span class="user-name">${user.uid}</span>
                    <div class="user-status">
                        <span class="mic-status active">🎤</span>
                        <span class="cam-status active">📹</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    videoGrid.appendChild(videoContainer);
    
    // تعيين مصدر الفيديو
    const videoElement = document.getElementById(`remoteVideo-${user.uid}`);
    videoElement.srcObject = user.videoTrack.getMediaStream();
}

function removeVideoElement(userId) {
    const videoElement = document.getElementById(`video-${userId}`);
    if (videoElement) videoElement.remove();
}

// إضافة مشارك للقائمة
function addParticipantToList(user) {
    const participantsList = document.getElementById('participantsList');
    
    // منع التكرار
    if (document.getElementById(`participant-${user.uid}`)) return;
    
    const displayName = user.uid || `مستخدم ${Math.random().toString(36).substr(2, 3)}`;
    
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.id = `participant-${user.uid}`;
    
    participantDiv.innerHTML = `
        <div class="participant-avatar">${displayName.charAt(0)}</div>
        <div class="participant-info">
            <span class="participant-name">${displayName}</span>
            <span class="participant-status">متصل</span>
        </div>
    `;
    
    participantsList.appendChild(participantDiv);
}

function removeParticipantFromList(userId) {
    const participant = document.getElementById(`participant-${userId}`);
    if (participant) participant.remove();
}

// تحديث عدد المشاركين
function updateParticipantsCount() {
    if (client) {
        const count = Object.keys(client.remoteUsers).length + 1;
        document.getElementById('participantsCount').textContent = count;
    }
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

// التحكم في الصوت
document.getElementById('micToggleBtn').addEventListener('click', function() {
    if (localTracks[0]) {
        isAudioMuted = !localTracks[0].enabled;
        localTracks[0].setEnabled(!isAudioMuted);
        
        this.innerHTML = isAudioMuted 
            ? '<span class="btn-icon">🔇</span><span class="btn-text">إلغاء الكتم</span>'
            : '<span class="btn-icon">🎤</span><span class="btn-text">كتم</span>';
    }
});

// التحكم في الكاميرا
document.getElementById('videoToggleBtn').addEventListener('click', function() {
    if (localTracks[1]) {
        isVideoMuted = !localTracks[1].enabled;
        localTracks[1].setEnabled(!isVideoMuted);
        
        this.innerHTML = isVideoMuted 
            ? '<span class="btn-icon">📷</span><span class="btn-text">تشغيل الكاميرا</span>'
            : '<span class="btn-icon">📹</span><span class="btn-text">إيقاف الكاميرا</span>';
        
        // إخفاء/إظهار الفيديو
        const localVideo = document.getElementById('localVideo');
        localVideo.style.display = isVideoMuted ? 'none' : 'block';
    }
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
                    track.close();
                }
            });
            localTracks = [];
        }
        
        // الخروج من القناة
        if (client) {
            await client.leave();
        }
        
        // التوجيه للصفحة الرئيسية
        window.location.href = 'index.html';
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', initCallPage);

// منع مغادرة الصفحة بدون تأكيد
window.addEventListener('beforeunload', function (e) {
    if (client) {
        e.preventDefault();
        e.returnValue = 'هل تريد مغادرة المكالمة؟';
    }
});
