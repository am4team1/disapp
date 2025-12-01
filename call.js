// 🔑 App ID
const APP_ID = "42a558edf70743f0bd79bb1af79566fe";

// 📦 المتغيرات العامة
let client;
let localTracks = [];
let remoteUsers = {};
let currentRoomCode = "";
let currentRoomName = "";
let currentUserName = "";
let isAudioMuted = false;
let isVideoMuted = false;
let callStartTime = null;
let timerInterval = null;

// 🎯 تهيئة الصفحة
async function initCallPage() {
    // جلب بيانات المكالمة من URL
    const urlParams = new URLSearchParams(window.location.search);
    currentRoomCode = urlParams.get('code') || localStorage.getItem('lastRoomCode') || '';
    currentRoomName = urlParams.get('name') || localStorage.getItem('lastRoomName') || 'مكالمة جديدة';
    currentUserName = localStorage.getItem('userName') || 'مستخدم';
    
    if (!currentRoomCode) {
        alert('كود المكالمة غير موجود!');
        window.location.href = 'index.html';
        return;
    }
    
    // تحديث واجهة المستخدم
    updateUI();
    
    // الانضمام للمكالمة
    await joinCall();
    
    // بدء المؤقت
    startTimer();
}

// 🎯 تحديث واجهة المستخدم
function updateUI() {
    document.getElementById('currentRoomCode').textContent = currentRoomCode;
    document.getElementById('currentRoomName').textContent = currentRoomName;
    document.getElementById('mainRoomName').textContent = currentRoomName;
    document.getElementById('roomHost').textContent = currentUserName;
    document.getElementById('localUserName').textContent = currentUserName;
    document.getElementById('inviteCodeDisplay').textContent = currentRoomCode;
    
    // تحديث وقت البدء
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('callStartTime').textContent = timeString;
    callStartTime = now;
}

// 🚀 الانضمام للمكالمة
async function joinCall() {
    try {
        showLoading(true);
        
        // Initialize Agora Client
        client = AgoraRTC.createClient({ 
            mode: "rtc", 
            codec: "vp8" 
        });

        // سجل الأحداث
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);

        // الانضمام للقناة باستخدام كود الغرفة
        await client.join(APP_ID, currentRoomCode, null, currentUserName);
        console.log("✅ تم الانضمام للمكالمة");

        // إنشاء الميكروفون والكاميرا
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        // عرض الفيديو المحلي
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = new MediaStream([
            localTracks[1].getMediaStreamTrack()
        ]);

        // نشر الtracks
        await client.publish(localTracks);
        console.log("✅ تم تفعيل المكالمة");

        // تحديث عدد المشاركين
        updateParticipantsCount();

    } catch (error) {
        console.error("❌ خطأ في الاتصال:", error);
        alert(`خطأ في الاتصال: ${error.message}`);
        window.location.href = 'index.html';
    } finally {
        showLoading(false);
    }
}

// 👥 معالجة المستخدمين الجدد
async function handleUserPublished(user, mediaType) {
    console.log("👤 مستخدم جديد:", user.uid, user);
    
    await client.subscribe(user, mediaType);
    
    if (mediaType === "video") {
        addVideoElement(user);
    }
    
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
    
    // إضافة المستخدم للقائمة
    addParticipantToList(user);
    updateParticipantsCount();
}

function handleUserUnpublished(user) {
    console.log("👤 مستخدم خرج:", user.uid);
    removeVideoElement(user.uid);
    removeParticipantFromList(user.uid);
    updateParticipantsCount();
}

function handleUserJoined(user) {
    console.log("👤 انضم مستخدم:", user.uid);
    updateParticipantsCount();
}

function handleUserLeft(user) {
    console.log("👤 غادر مستخدم:", user.uid);
    updateParticipantsCount();
}

// 🎥 إضافة عنصر فيديو جديد
function addVideoElement(user) {
    const videoGrid = document.getElementById('videoGrid');
    
    // التحقق من عدم وجود الفيديو مسبقًا
    if (document.getElementById(`video-${user.uid}`)) {
        return;
    }
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
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
    if (videoElement) {
        videoElement.remove();
    }
}

// 📋 إضافة مشارك للقائمة
function addParticipantToList(user) {
    const participantsList = document.getElementById('participantsList');
    
    // التحقق من عدم وجود المشارك مسبقًا
    if (document.getElementById(`participant-${user.uid}`)) {
        return;
    }
    
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.id = `participant-${user.uid}`;
    
    // استخدام اسم المستخدم أو ID
    const displayName = typeof user.uid === 'string' && user.uid !== 'null' ? user.uid : `مستخدم ${user.uid}`;
    
    participantDiv.innerHTML = `
        <div class="participant-avatar">${displayName.charAt(0)}</div>
        <div class="participant-info">
            <span class="participant-name">${displayName}</span>
            <span class="participant-status">متصل</span>
        </div>
        <div class="participant-actions">
            <button class="action-btn mic-btn active">🎤</button>
            <button class="action-btn cam-btn active">📹</button>
        </div>
    `;
    
    participantsList.appendChild(participantDiv);
}

function removeParticipantFromList(userId) {
    const participant = document.getElementById(`participant-${userId}`);
    if (participant) {
        participant.remove();
    }
}

// 👥 تحديث عدد المشاركين
function updateParticipantsCount() {
    if (client) {
        const count = Object.keys(client.remoteUsers).length + 1;
        document.getElementById('participantsCount').textContent = count;
    }
}

// ⏱️ بدء مؤقت المكالمة
function startTimer() {
    const timerElement = document.getElementById('callTimer');
    
    timerInterval = setInterval(() => {
        if (callStartTime) {
            const now = new Date();
            const diff = Math.floor((now - callStartTime) / 1000);
            
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            
            const timeString = hours > 0 
                ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            timerElement.textContent = timeString;
        }
    }, 1000);
}

// 🎤 التحكم في الصوت
document.getElementById('micToggleBtn').addEventListener('click', function() {
    if (localTracks[0]) {
        isAudioMuted = !localTracks[0].enabled;
        localTracks[0].setEnabled(!isAudioMuted);
        
        this.innerHTML = isAudioMuted 
            ? '<span class="btn-icon">🔇</span><span class="btn-text">إلغاء الكتم</span>'
            : '<span class="btn-icon">🎤</span><span class="btn-text">كتم</span>';
        
        // تحديث القائمة
        const micBtn = document.querySelector('#localParticipant .mic-btn');
        if (micBtn) {
            micBtn.classList.toggle('active', !isAudioMuted);
        }
    }
});

// 📹 التحكم في الكاميرا
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
        
        // تحديث القائمة
        const camBtn = document.querySelector('#localParticipant .cam-btn');
        if (camBtn) {
            camBtn.classList.toggle('active', !isVideoMuted);
        }
    }
});

// 🖥️ مشاركة الشاشة
document.getElementById('screenShareBtn').addEventListener('click', async function() {
    try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack();
        await client.unpublish(localTracks[1]);
        await client.publish(screenTrack);
        
        // استبدال الفيديو المحلي
        localTracks[1].stop();
        localTracks[1] = screenTrack;
        
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = screenTrack.getMediaStream();
        
        this.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">إيقاف المشاركة</span>';
        
    } catch (error) {
        console.error("❌ خطأ في مشاركة الشاشة:", error);
        alert("يرجى السماح بمشاركة الشاشة في المتصفح");
    }
});

// 📩 عرض نافذة الدعوة
function showInviteModal() {
    document.getElementById('inviteModal').style.display = 'flex';
}

function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
}

// 📋 نسخ كود الدعوة
function copyInviteCode() {
    navigator.clipboard.writeText(currentRoomCode).then(() => {
        alert('تم نسخ كود الدعوة! 📋');
    });
}

function copyRoomCode() {
    copyInviteCode();
}

function copyInviteLink() {
    const inviteLink = `${window.location.origin}/join-room.html?code=${currentRoomCode}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
        alert('تم نسخ رابط الدعوة! 🔗');
    });
}

// 📱 مشاركة عبر واتساب
function shareWhatsApp() {
    const text = `انضم إلى مكالمتي على MeetHub! 🎯\nكود المكالمة: ${currentRoomCode}\n${window.location.origin}/join-room.html?code=${currentRoomCode}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// ✈️ مشاركة عبر تيليجرام
function shareTelegram() {
    const text = `انضم إلى مكالمتي على MeetHub! 🎯\nكود المكالمة: ${currentRoomCode}\n${window.location.origin}/join-room.html?code=${currentRoomCode}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// 💬 التحكم في الدردشة
function toggleChatPanel() {
    const chatPanel = document.getElementById('chatPanel');
    chatPanel.classList.toggle('active');
}

// 📞 إنهاء المكالمة
async function leaveCall() {
    if (confirm('هل تريد إنهاء المكالمة؟')) {
        // إيقاف المؤقت
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // إيقاف الtracks
        if (localTracks) {
            localTracks.forEach(track => {
                track.stop();
                track.close();
            });
        }
        
        // الخروج من القناة
        if (client) {
            await client.leave();
        }
        
        // التوجيه للصفحة الرئيسية
        window.location.href = 'index.html';
    }
}

// ⏳ إظهار/إخفاء التحميل
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    if (show) {
        loading.style.display = 'flex';
    } else {
        loading.style.display = 'none';
    }
}

// 🎉 تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', initCallPage);

// 🚀 منع مغادرة الصفحة بدون تأكيد
window.addEventListener('beforeunload', function (e) {
    if (client) {
        e.preventDefault();
        e.returnValue = 'هل تريد مغادرة المكالمة؟';
    }
});
