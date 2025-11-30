// 🔑 App ID
const APP_ID = "42a558edf70743f0bd79bb1af79566fe";

// 📦 المتغيرات العامة
let client;
let localTracks = [];
let currentRoomCode = "";
let currentRoomName = "";
let currentUserName = "";

// 🎯 العناصر
const screens = {
    welcome: document.getElementById('welcomeScreen'),
    create: document.getElementById('createRoomScreen'),
    join: document.getElementById('joinRoomScreen'),
    call: document.getElementById('callScreen')
};

const buttons = {
    createRoom: document.getElementById('createRoomBtn'),
    joinRoom: document.getElementById('joinRoomBtn'),
    generateRoom: document.getElementById('generateRoomBtn'),
    joinWithCode: document.getElementById('joinWithCodeBtn'),
    backFromCreate: document.getElementById('backFromCreateBtn'),
    backFromJoin: document.getElementById('backFromJoinBtn'),
    leave: document.getElementById('leaveBtn'),
    mute: document.getElementById('muteBtn'),
    video: document.getElementById('videoBtn'),
    invite: document.getElementById('inviteBtn'),
    copyInvite: document.getElementById('copyInviteBtn'),
    closeInvite: document.getElementById('closeInviteBtn')
};

const inputs = {
    roomName: document.getElementById('roomName'),
    userNameCreate: document.getElementById('userNameCreate'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    userNameJoin: document.getElementById('userNameJoin')
};

const displays = {
    roomCode: document.getElementById('roomCodeDisplay'),
    roomCodeSmall: document.getElementById('roomCodeDisplaySmall'),
    inviteCode: document.getElementById('inviteCodeDisplay'),
    roomName: document.getElementById('roomNameDisplay'),
    userCount: document.getElementById('userCount'),
    localUserName: document.getElementById('localUserName'),
    joinError: document.getElementById('joinError')
};

const sections = {
    roomCode: document.getElementById('roomCodeSection'),
    invite: document.getElementById('inviteSection')
};

const videos = {
    local: document.getElementById('localVideo'),
    remote: document.getElementById('remoteVideo')
};

const loading = document.getElementById('loading');

// 🎮 تهيئة الأحداث
function initializeEvents() {
    // شاشة الترحيب
    buttons.createRoom.addEventListener('click', () => switchScreen('create'));
    buttons.joinRoom.addEventListener('click', () => switchScreen('join'));
    
    // شاشة الإنشاء
    buttons.generateRoom.addEventListener('click', generateRoomCode);
    buttons.backFromCreate.addEventListener('click', () => switchScreen('welcome'));
    
    // شاشة الانضمام
    buttons.joinWithCode.addEventListener('click', joinWithRoomCode);
    buttons.backFromJoin.addEventListener('click', () => switchScreen('welcome'));
    
    // شاشة المكالمة
    buttons.leave.addEventListener('click', leaveChannel);
    buttons.mute.addEventListener('click', toggleAudio);
    buttons.video.addEventListener('click', toggleVideo);
    buttons.invite.addEventListener('click', showInviteSection);
    buttons.copyInvite.addEventListener('click', copyInviteCode);
    buttons.closeInvite.addEventListener('click', hideInviteSection);
}

// 🔄 تبديل الشاشات
function switchScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
    
    // إعادة تعيين الحقول
    if (screenName === 'welcome') {
        resetForms();
    }
}

// 🔧 إعادة تعيين النماذج
function resetForms() {
    inputs.roomName.value = '';
    inputs.userNameCreate.value = '';
    inputs.roomCodeInput.value = '';
    inputs.userNameJoin.value = '';
    sections.roomCode.classList.add('hidden');
    displays.joinError.classList.add('hidden');
    hideInviteSection();
}

// 🎲 إنشاء كود الغرفة
function generateRoomCode() {
    const roomName = inputs.roomName.value.trim();
    const userName = inputs.userNameCreate.value.trim();
    
    if (!roomName) {
        alert('يرجى إدخال اسم الغرفة');
        return;
    }
    
    if (!userName) {
        alert('يرجى إدخال اسمك');
        return;
    }
    
    // إنشاء كود عشوائي مكون من 6 أحرف/أرقام
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    currentRoomCode = code;
    currentRoomName = roomName;
    currentUserName = userName;
    
    displays.roomCode.textContent = code;
    sections.roomCode.classList.remove('hidden');
    
    // حفظ بيانات الغرفة
    saveRoomData(code, roomName, userName);
}

// 💾 حفظ بيانات الغرفة
function saveRoomData(code, roomName, userName) {
    const roomData = {
        code: code,
        name: roomName,
        creator: userName,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`room_${code}`, JSON.stringify(roomData));
}

// 🔍 الانضمام بكود الغرفة
function joinWithRoomCode() {
    const roomCode = inputs.roomCodeInput.value.trim().toUpperCase();
    const userName = inputs.userNameJoin.value.trim();
    
    if (!roomCode) {
        showJoinError('يرجى إدخال كود الغرفة');
        return;
    }
    
    if (!userName) {
        showJoinError('يرجى إدخال اسمك');
        return;
    }
    
    // التحقق من وجود الغرفة
    const roomData = localStorage.getItem(`room_${roomCode}`);
    if (!roomData) {
        showJoinError('كود الغرفة غير صحيح');
        return;
    }
    
    const room = JSON.parse(roomData);
    currentRoomCode = roomCode;
    currentRoomName = room.name;
    currentUserName = userName;
    
    // الانضمام للمكالمة
    joinChannel();
}

// ❌ عرض خطأ الانضمام
function showJoinError(message) {
    displays.joinError.textContent = message;
    displays.joinError.classList.remove('hidden');
}

// 🚀 الانضمام للقناة
async function joinChannel() {
    showLoading();
    
    try {
        // استخدام كود الغرفة كاسم القناة في Agora
        const channelName = currentRoomCode;
        
        console.log("🚀 الانضمام للقناة:", channelName);
        
        // Initialize Agora Client
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
        await client.join(APP_ID, channelName, null, null);
        console.log("✅ تم الانضمام بنجاح");

        // إنشاء الميكروفون والكاميرا
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        console.log("✅ تم تفعيل الوسائط");

        // عرض الفيديو المحلي
        videos.local.srcObject = new MediaStream([
            localTracks[1].getMediaStreamTrack()
        ]);

        // نشر الtracks
        await client.publish(localTracks);
        console.log("✅ تم نشر الوسائط");

        // الانتقال لشاشة المكالمة
        switchToCallScreen();

    } catch (error) {
        console.error("❌ Error:", error);
        alert(`خطأ في الاتصال: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// 👥 التعامل مع المستخدمين
async function handleUserPublished(user, mediaType) {
    console.log("👤 مستخدم جديد:", user.uid);
    
    await client.subscribe(user, mediaType);
    
    if (mediaType === "video") {
        videos.remote.srcObject = user.videoTrack.getMediaStream();
        document.querySelector('#remoteVideo + .video-label').textContent = `مستخدم ${user.uid}`;
    }
    
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
    
    updateUserCount();
}

function handleUserUnpublished(user) {
    console.log("👤 مستخدم خرج:", user.uid);
    videos.remote.srcObject = null;
    document.querySelector('#remoteVideo + .video-label').textContent = "في انتظار مستخدم آخر...";
    updateUserCount();
}

function handleUserJoined(user) {
    console.log("👤 انضم مستخدم:", user.uid);
    updateUserCount();
}

function handleUserLeft(user) {
    console.log("👤 غادر مستخدم:", user.uid);
    updateUserCount();
}

// 🔄 الانتقال لشاشة المكالمة
function switchToCallScreen() {
    switchScreen('call');
    displays.roomName.textContent = `غرفة: ${currentRoomName}`;
    displays.roomCodeSmall.textContent = `كود: ${currentRoomCode}`;
    displays.localUserName.textContent = currentUserName;
    updateUserCount();
}

// 👥 تحديث عدد المستخدمين
function updateUserCount() {
    if (client) {
        const count = Object.keys(client.remoteUsers).length + 1;
        displays.userCount.textContent = `${count} مستخدم`;
    }
}

// 🎤 تحكم في الصوت
function toggleAudio() {
    if (localTracks[0]) {
        const isMuted = !localTracks[0].enabled;
        localTracks[0].setEnabled(isMuted);
        buttons.mute.textContent = isMuted ? "🎤" : "🔇";
        buttons.mute.style.background = isMuted ? "#4361ee" : "#f72585";
    }
}

// 📹 تحكم في الفيديو
function toggleVideo() {
    if (localTracks[1]) {
        const isEnabled = !localTracks[1].enabled;
        localTracks[1].setEnabled(isEnabled);
        buttons.video.textContent = isEnabled ? "📹" : "📷";
        buttons.video.style.background = isEnabled ? "#4361ee" : "#f72585";
        videos.local.style.display = isEnabled ? "block" : "none";
    }
}

// 📩 عرض قسم الدعوة
function showInviteSection() {
    displays.inviteCode.textContent = currentRoomCode;
    sections.invite.classList.remove('hidden');
}

function hideInviteSection() {
    sections.invite.classList.add('hidden');
}

// 📋 نسخ كود الدعوة
function copyInviteCode() {
    navigator.clipboard.writeText(currentRoomCode).then(() => {
        alert('تم نسخ كود الدعوة! 📋');
    });
}

// 📞 إنهاء المكالمة
async function leaveChannel() {
    // إيقاف الtracks
    if (localTracks) {
        localTracks.forEach(track => {
            track.stop();
            track.close();
        });
        localTracks = [];
    }
    
    // الخروج من القناة
    if (client) {
        await client.leave();
    }
    
    // مسح الstreams
    videos.local.srcObject = null;
    videos.remote.srcObject = null;
    
    // العودة للشاشة الرئيسية
    switchScreen('welcome');
    resetForms();
}

// ⏳ التحميل
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

// 🎉 بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeEvents();
    console.log("🎉 Application Started!");
    console.log("🔑 App ID:", APP_ID);
});
