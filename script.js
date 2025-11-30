// الإعدادات - استبدل الـ App ID بتاعك
const AGORA_APP_ID = "e6bf194c61d84efea61b02a1dd09a0a2"; // هتاخدها من Agora Console

// المتغيرات العامة
let client;
let localStream;
let currentChannel;
let isAudioMuted = false;
let isVideoMuted = false;
let remoteUsers = {};

// العناصر
const homeScreen = document.getElementById('homeScreen');
const callScreen = document.getElementById('callScreen');
const channelNameInput = document.getElementById('channelName');
const joinBtn = document.getElementById('joinBtn');
const createBtn = document.getElementById('createBtn');
const roomNameDisplay = document.getElementById('roomNameDisplay');
const userCount = document.getElementById('userCount');
const localVideoElement = document.getElementById('localVideoElement');
const remoteVideosContainer = document.getElementById('remoteVideos');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const leaveBtn = document.getElementById('leaveBtn');
const loading = document.getElementById('loading');

// الأحداث
joinBtn.addEventListener('click', joinChannel);
createBtn.addEventListener('click', createChannel);
muteBtn.addEventListener('click', toggleAudio);
videoBtn.addEventListener('click', toggleVideo);
screenShareBtn.addEventListener('click', toggleScreenShare);
leaveBtn.addEventListener('click', leaveChannel);

// أنشئ قناة جديدة
function createChannel() {
    const channelName = channelNameInput.value || `room-${Date.now()}`;
    channelNameInput.value = channelName;
    joinChannel();
}

// انضم للقناة
async function joinChannel() {
    const channelName = channelNameInput.value.trim();
    
    if (!channelName) {
        alert('اكتب اسم الغرفة!');
        return;
    }
    
    if (!AGORA_APP_ID || AGORA_APP_ID === "e6bf194c61d84efea61b02a1dd09a0a2") {
        alert('احط App ID بتاعتك من Agora!');
        return;
    }
    
    showLoading();
    
    try {
        // Initialize Agora SDK
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        // سجل الأحداث
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);
        
        // انضم للقناة
        await client.join(AGORA_APP_ID, channelName, null, null);
        
        // أنشئ الدفق المحلي
        localStream = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        // اعرض الفيديو المحلي
        localVideoElement.srcObject = localStream.getMediaStream();
        
        // انشر الدفق
        await client.publish(localStream);
        
        // غير الشاشة
        switchToCallScreen(channelName);
        
    } catch (error) {
        console.error('Error joining channel:', error);
        alert('فشل الاتصال: ' + error.message);
    } finally {
        hideLoading();
    }
}

// تعامل مع دخول المستخدمين
async function handleUserPublished(user, mediaType) {
    await client.subscribe(user, mediaType);
    
    if (mediaType === "video") {
        const remotePlayer = document.createElement("div");
        remotePlayer.className = "video-wrapper";
        remotePlayer.id = `user-${user.uid}`;
        
        const videoElement = document.createElement("video");
        videoElement.srcObject = user.videoTrack.getMediaStream();
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        
        const label = document.createElement("div");
        label.className = "video-label";
        label.textContent = `مستخدم ${user.uid}`;
        
        remotePlayer.appendChild(videoElement);
        remotePlayer.appendChild(label);
        remoteVideosContainer.appendChild(remotePlayer);
    }
    
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
}

// تعامل مع خروج المستخدمين
function handleUserUnpublished(user, mediaType) {
    if (mediaType === "video") {
        const remotePlayer = document.getElementById(`user-${user.uid}`);
        if (remotePlayer) {
            remotePlayer.remove();
        }
    }
}

function handleUserJoined(user) {
    console.log("User joined:", user.uid);
    updateUserCount();
}

function handleUserLeft(user) {
    console.log("User left:", user.uid);
    const remotePlayer = document.getElementById(`user-${user.uid}`);
    if (remotePlayer) {
        remotePlayer.remove();
    }
    updateUserCount();
}

// غير الشاشة لشاشة المكالمة
function switchToCallScreen(channelName) {
    homeScreen.classList.remove('active');
    callScreen.classList.add('active');
    roomNameDisplay.textContent = `غرفة: ${channelName}`;
    updateUserCount();
}

// عدّد المستخدمين
function updateUserCount() {
    if (client) {
        const count = Object.keys(client.remoteUsers).length + 1; // +1 علشان انت
        userCount.textContent = `${count} مستخدم`;
    }
}

// تحكم في الصوت
function toggleAudio() {
    if (localStream) {
        isAudioMuted = !isAudioMuted;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isAudioMuted;
        });
        muteBtn.textContent = isAudioMuted ? "🔇" : "🎤";
        muteBtn.style.background = isAudioMuted ? "var(--danger)" : "var(--primary)";
    }
}

// تحكم في الفيديو
function toggleVideo() {
    if (localStream) {
        isVideoMuted = !isVideoMuted;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !isVideoMuted;
        });
        videoBtn.textContent = isVideoMuted ? "📷" : "📹";
        videoBtn.style.background = isVideoMuted ? "var(--danger)" : "var(--primary)";
        
        // إظهار/إخفاء الفيديو المحلي
        localVideoElement.style.display = isVideoMuted ? "none" : "block";
    }
}

// مشاركة الشاشة
async function toggleScreenShare() {
    try {
        if (!localStream.getVideoTracks()[0].enabled) {
            alert('شغل الكاميرا الأول علشان تشارك الشاشة!');
            return;
        }
        
        const screenTrack = await AgoraRTC.createScreenVideoTrack();
        await client.unpublish(localStream.getVideoTrack());
        await client.publish(screenTrack);
        
        // استبدل الفيديو المحلي
        localStream.getVideoTracks()[0].stop();
        localStream._videoTracks = [screenTrack];
        localVideoElement.srcObject = screenTrack.getMediaStream();
        
        screenShareBtn.textContent = "🔄";
        screenShareBtn.style.background = "var(--success)";
        
    } catch (error) {
        console.error('Screen share failed:', error);
        alert('مشاركة الشاشة فشلت: ' + error.message);
    }
}

// اخرج من القناة
async function leaveChannel() {
    try {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        if (client) {
            await client.leave();
        }
        
        // امسح كل الفيديوهات
        remoteVideosContainer.innerHTML = '';
        
        // رجع للشاشة الرئيسية
        callScreen.classList.remove('active');
        homeScreen.classList.add('active');
        
        // Reset controls
        muteBtn.textContent = "🎤";
        videoBtn.textContent = "📹";
        screenShareBtn.textContent = "🖥️";
        
    } catch (error) {
        console.error('Error leaving channel:', error);
    }
}

// التحميل
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

// رسالة ترحيب
console.log('🚀 Video Chat App Loaded!');
console.log('📝 Don\'t forget to add your Agora App ID!');
