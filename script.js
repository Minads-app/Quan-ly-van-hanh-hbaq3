import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CẤU HÌNH (DÁN CONFIG CỦA BẠN VÀO ĐÂY) ---
const firebaseConfig = {
  apiKey: "AIzaSyCRVCArz1o7EvPkMCJn353imoerFeJpUWg",
  authDomain: "webapp-hbaq3.firebaseapp.com",
  projectId: "webapp-hbaq3",
  storageBucket: "webapp-hbaq3.firebasestorage.app",
  messagingSenderId: "1023431490952",
  appId: "1:1023431490952:web:627c1aedfb3049fff48e3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- BIẾN TOÀN CỤC ---
let currentUser = null;
let userRole = null; // 'admin', 'coach', 'reception'

// --- DOM ELEMENTS ---
const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const avatarImg = document.getElementById('avatar');
const usernameSpan = document.getElementById('username');
const roleSmall = document.getElementById('role');

// --- 1. AUTHENTICATION & PHÂN QUYỀN ---
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => alert(err.message));
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Kiểm tra quyền trong Firestore collection 'users'
        await checkUserRole(user);
        
        // Hiển thị giao diện chính
        loginView.classList.add('hidden');
        mainView.classList.remove('hidden');
        avatarImg.src = user.photoURL;
        usernameSpan.textContent = user.displayName;
        
        // Mặc định vào dashboard
        navigate('dashboard');
    } else {
        currentUser = null;
        loginView.classList.remove('hidden');
        mainView.classList.add('hidden');
    }
});

// Hàm kiểm tra quyền (Mô phỏng - sau này sẽ lấy thật từ DB)
async function checkUserRole(user) {
    // Tạm thời set mặc định là Admin để bạn test
    // Sau này sẽ query: const docSnap = await getDoc(doc(db, "users", user.uid));
    userRole = 'admin'; 
    roleSmall.textContent = userRole.toUpperCase();
}

// --- 2. HỆ THỐNG ĐIỀU HƯỚNG (ROUTING) ---
// Gán hàm vào window để gọi được từ HTML onclick
window.navigate = function(pageId) {
    // 1. Ẩn tất cả các trang
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    // 2. Hiện trang được chọn
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        
        // Load dữ liệu tương ứng khi mở trang
        if (pageId === 'hr') loadStaffList();
    }

    // 3. Highlight menu
    // (Logic tìm nút menu tương ứng để add class active - Bỏ qua cho gọn)
}

// --- 3. MODAL CONTROLLER (Đóng mở cửa sổ) ---
const modalOverlay = document.getElementById('modal-overlay');

window.openModal = function(modalId) {
    modalOverlay.classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}

window.closeModal = function() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// Đóng khi click ra ngoài
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// --- 4. MODULE HR (QUẢN LÝ NHÂN SỰ) - DEMO ---
const formStaff = document.getElementById('form-staff');

// Xử lý thêm nhân viên
formStaff.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('staff-name').value;
    const email = document.getElementById('staff-email').value;
    const role = document.getElementById('staff-role').value;

    try {
        // Lưu vào Firestore
        await addDoc(collection(db, "users"), {
            displayName: name,
            email: email,
            role: role,
            createdAt: new Date(),
            status: 'active'
        });
        alert("Thêm nhân viên thành công!");
        closeModal();
        formStaff.reset();
        loadStaffList(); // Tải lại bảng
    } catch (err) {
        console.error(err);
        alert("Lỗi: " + err.message);
    }
});

// Tải danh sách nhân viên
async function loadStaffList() {
    const tbody = document.querySelector('#table-staff tbody');
    tbody.innerHTML = "<tr><td colspan='5'>Đang tải...</td></tr>";

    const q = query(collection(db, "users")); // Sau này thêm orderBy
    const snapshot = await getDocs(q);
    
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${data.displayName}</strong><br><small>${data.email}</small></td>
            <td><span style="padding: 4px 8px; background: #e2e8f0; border-radius: 4px; font-size: 12px">${data.role}</span></td>
            <td>---</td>
            <td><span style="color: green">Active</span></td>
            <td>
                <button onclick="alert('Tính năng sửa đang phát triển')" style="border:none; background:none; cursor:pointer">✏️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
