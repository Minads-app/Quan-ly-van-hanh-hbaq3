// 1. Import các thư viện Firebase từ CDN (Không cần cài đặt)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Cấu hình Firebase (Lấy từ Firebase Console > Project Settings)
// BẠN PHẢI THAY THẾ CÁC THÔNG SỐ NÀY BẰNG CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyCRVCArz1o7EvPkMCJn353imoerFeJpUWg",
  authDomain: "webapp-hbaq3.firebaseapp.com",
  projectId: "webapp-hbaq3",
  storageBucket: "webapp-hbaq3.firebasestorage.app",
  messagingSenderId: "1023431490952",
  appId: "1:1023431490952:web:627c1aedfb3049fff48e3d"
};

// 3. Khởi tạo ứng dụng
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. Tham chiếu các thẻ HTML (DOM Elements)
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnAdd = document.getElementById('btn-add');
const inputData = document.getElementById('input-data');
const userStatus = document.getElementById('user-status');
const authSection = document.getElementById('auth-section');
const dataSection = document.getElementById('data-section');
const dataList = document.getElementById('data-list');

// 5. Xử lý Đăng nhập / Đăng xuất
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => alert("Lỗi: " + error.message));
});

btnLogout.addEventListener('click', () => signOut(auth));

// 6. Lắng nghe trạng thái người dùng (Real-time)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Người dùng đã đăng nhập
        userStatus.textContent = `Xin chào, ${user.displayName}`;
        authSection.classList.add('hidden');
        dataSection.classList.remove('hidden');
        
        // Tải dữ liệu của người này
        loadData();
    } else {
        // Chưa đăng nhập
        userStatus.textContent = "Vui lòng đăng nhập";
        authSection.classList.remove('hidden');
        dataSection.classList.add('hidden');
        dataList.innerHTML = ''; // Xóa dữ liệu cũ
    }
});

// 7. Xử lý Thêm dữ liệu vào Firestore
btnAdd.addEventListener('click', async () => {
    const text = inputData.value;
    if (!text) return alert("Vui lòng nhập nội dung!");

    try {
        await addDoc(collection(db, "todos"), {
            content: text,
            createdAt: Date.now(),
            userEmail: auth.currentUser.email // Lưu người tạo để phân quyền sau này
        });
        inputData.value = ''; // Xóa ô nhập sau khi thêm
    } catch (e) {
        console.error("Lỗi thêm data: ", e);
    }
});

// 8. Tải dữ liệu Real-time (Tự động cập nhật khi có thay đổi)
function loadData() {
    const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        dataList.innerHTML = ""; // Reset list
        snapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement("li");
            li.textContent = `${data.content} (bởi ${data.userEmail})`;
            dataList.appendChild(li);
        });
    });
}