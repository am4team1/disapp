// تهيئة الصفحة الرئيسية
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MeetHub - منصة المكالمات العربية');
    console.log('✅ جاهز للاستخدام!');
    
    // تنظيف البيانات القديمة
    cleanupOldData();
});

// تنظيف البيانات القديمة
function cleanupOldData() {
    const currentRoom = localStorage.getItem('meethub_current_room');
    if (currentRoom) {
        try {
            const roomData = JSON.parse(currentRoom);
            const createdTime = new Date(roomData.created);
            const now = new Date();
            const hoursDiff = (now - createdTime) / (1000 * 60 * 60);
            
            // حذف البيانات الأقدم من 24 ساعة
            if (hoursDiff > 24) {
                localStorage.removeItem('meethub_current_room');
                console.log('🗑️ تم تنظيف بيانات الغرفة القديمة');
            }
        } catch (e) {
            localStorage.removeItem('meethub_current_room');
        }
    }
}

// اكتشاف المتصفح والدعم
function checkBrowserSupport() {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = typeof InstallTrigger !== 'undefined';
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (!isChrome && !isFirefox && !isEdge) {
        console.warn('⚠️ يفضل استخدام Chrome أو Firefox أو Edge');
    }
}

// التحقق من دعم الميكروفون والكاميرا
async function checkMediaPermissions() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: true 
        });
        
        // إيقاف الstream بعد الاختبار
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.warn('⚠️ قد تحتاج إلى السماح باستخدام الكاميرا والميكروفون');
        return false;
    }
}

// تهيئة الصفحة
checkBrowserSupport();
checkMediaPermissions();
