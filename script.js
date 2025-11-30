// 🔑 App ID الجديد - مضبوط 100%
const APP_ID = "42a558edf70743f0bd79bb1af79566fe";

// 📦 المتغيرات العامة
let client;
let localTracks = [];
let remoteUsers = {};
let isAudioMuted = false;
let isVideoMuted = false;

// 🎯 العناصر
const homeScreen = document.getElementById('homeScreen');
const callScreen = document.getElementById('callScreen');
const channelNameInput = document.getElementById('channelName');
const joinBtn = document.getElementById('joinBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const leaveBtn = document.getElementById('leaveBtn');
const roomInfo = document.getElementById('roomInfo');
const userCount = document.getElementById('userCount');
const statusDiv = document.getElementById('status');
const loading = document.getElementById('loading');

// 🎮 الأحداث
joinBtn.addEventListener('click', joinChannel);
muteBtn.addEventListener('click', toggleAudio);
videoBtn.addEventListener('click', toggleVideo);
leaveBtn.addEventListener('click', leaveChannel);

// 🚀 انضم للقناة
async function joinChannel() {
    const channelName = channelNameInput.value.trim() || "غرفة-التجربة";
    
    // تحقق من App ID
    if (!APP_ID || APP_ID === "YOUR_APP_ID_HERE") {
        showStatus("❌ App ID غير مضبوط. تأكد من وضع الـ App ID الصحيح", "error");
        return;
    }
    
    showStatus("", "");
    joinBtn.disabled = true;
    joinBtn.textContent = "جاري التحضير...";
    showLoading();

    try {
        console.log("🚀 بدء الاتصال...");
        console.log("🔑 Using App ID:", APP_ID);
        console.log("📞 Channel Name:", channelName);
        
        // 1. Initialize Agora Client
        client = AgoraRTC.createClient({ 
            mode: "rtc", 
            codec: "vp8" 
        });

        // 2. سجل الأحداث
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);
        client.on("connection-state-change", handleConnectionStateChange);

        // 3. انضم للقناة
        console.log("📞 الانضمام للقناة...");
        await client.join(APP_ID, channelName, null, null);
        console.log("✅ تم الانضمام بنجاح");

        // 4. أنشئ الميكروفون والكاميرا
        console.log("🎤 جاري تشغيل الكاميرا والميكروفون...");
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        console.log("✅ تم تفعيل الوسائط");

        // 5. اعرض الفيديو المحلي
        localVideo.srcObject = new MediaStream([
            localTracks[1].getMediaStreamTrack() // الفيديو
        ]);

        // 6. انشر الtracks
        await client.publish(localTracks);
        console.log("✅ تم نشر الوسائط");

        // 7. غير للشاشة الثانية
        switchToCallScreen(channelName);
        showStatus("تم الاتصال بنجاح! ✅ افتح تاب آخر للتجربة", "connected");

    } catch (error) {
        console.error("❌ Error:", error);
        
        // رسائل خطأ مفصلة
        let errorMessage = `خطأ: ${error.message}`;
        if (error.message.includes("INVALID_APP_ID")) {
            errorMessage = "❌ App ID غير صحيح. تأكد من الـ App ID";
        } else if (error.message.includes("network")) {
            errorMessage = "❌ مشكلة في الشبكة. تأكد من اتصال الإنترنت";
        } else if (error.message.includes("permission")) {
            errorMessage = "❌ يلزم السماح باستخدام الكاميرا والميكروفون";
        }
        
        showStatus(errorMessage, "error");
    } finally {
        joinBtn.disabled = false;
        joinBtn.textContent = "🚀 ابدأ المكالمة";
        hideLoading();
    }
}

// 👥 تعامل مع المستخدمين الجدد
async function handleUserPublished(user, mediaType) {
    console.log("👤 مستخدم جديد:", user.uid);
    
    await client.subscribe(user, mediaType);
    
    if (mediaType === "video") {
        remoteVideo.srcObject = user.videoTrack.getMediaStream();
        document.querySelector('#remoteVideo + .video-label').textContent = `مستخدم ${user.uid}`;
    }
    
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
    
    updateUserCount();
}

function handleUserUnpublished(user) {
    console.log("👤 مستخدم خرج:", user.uid);
    remoteVideo.srcObject = null;
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

function handleConnectionStateChange(state) {
    console.log("📡 حالة الاتصال:", state);
}

// 🎤 تحكم في الصوت
function toggleAudio() {
    if (localTracks[0]) {
        isAudioMuted = !isAudioMuted;
        localTracks[0].setEnabled(!isAudioMuted);
        muteBtn.textContent = isAudioMuted ? "🔇 كتم" : "🎤 صوت";
        muteBtn.style.background = isAudioMuted ? "#f72585" : "#4361ee";
        console.log("🔊 الصوت:", isAudioMuted ? "مكتوم" : "شغال");
    }
}

// 📹 تحكم في الفيديو
function toggleVideo() {
    if (localTracks[1]) {
        isVideoMuted = !isVideoMuted;
        localTracks[1].setEnabled(!isVideoMuted);
        videoBtn.textContent = isVideoMuted ? "📷 إيقاف" : "📹 كاميرا";
        videoBtn.style.background = isVideoMuted ? "#f72585" : "#4361ee";
        localVideo.style.display = isVideoMuted ? "none" : "block";
        console.log("📹 الكاميرا:", isVideoMuted ? "متوقفة" : "شغالة");
    }
}

// 📞 اخرج من القناة
async function leaveChannel() {
    console.log("📞 إنهاء المكالمة...");
    
    // أوقف الtracks
    if (localTracks) {
        localTracks.forEach(track => {
            track.stop();
            track.close();
        });
        localTracks = [];
    }
    
    // اخرج من القناة
    if (client) {
        await client.leave();
    }
    
    // امسح الstreams
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    
    // رجع للشاشة الأولى
    callScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    
    console.log("✅ تم إنهاء المكالمة");
}

// 🔄 غير للشاشة الثانية
function switchToCallScreen(channelName) {
    homeScreen.classList.add('hidden');
    callScreen.classList.remove('hidden');
    roomInfo.textContent = `🔊 غرفة: ${channelName}`;
    updateUserCount();
}

// 👥 عدّد المستخدمين
function updateUserCount() {
    if (client) {
        const count = Object.keys(client.remoteUsers).length + 1;
        userCount.textContent = `${count} مستخدم`;
    }
}

// 💬 عرض الحالة
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.toggle('hidden', !message);
}

// ⏳ التحميل
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

// 🎉 رسالة بدء التشغيل
console.log("🎉 Application Started!");
console.log("🔑 App ID:", APP_ID);
console.log("✅ Ready for video calls!");

// عرض حالة App ID
if (APP_ID && APP_ID !== "YOUR_APP_ID_HERE") {
    showStatus("✅ App ID مضبوط وجاهز للاستخدام", "connected");
} else {
    showStatus("❌ App ID غير مضبوط. تأكد من وضع الـ App ID الصحيح", "error");
}
