// --- GIỮ NGUYÊN PHẦN IMPORT & CONFIG ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    // ... DÁN CONFIG CỦA BẠN VÀO ĐÂY ...
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

// --- DOM ELEMENTS ---
// (Giữ nguyên phần login/logout/navigate/modal cũ)
const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const avatarImg = document.getElementById('avatar');
const usernameSpan = document.getElementById('username');
const roleSmall = document.getElementById('role');
const modalOverlay = document.getElementById('modal-overlay');

// --- AUTH & CORE ---
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => alert(err.message));
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginView.classList.add('hidden');
        mainView.classList.remove('hidden');
        avatarImg.src = user.photoURL;
        usernameSpan.textContent = user.displayName;
        roleSmall.textContent = "Quản trị viên"; // Tạm thời hardcode
        navigate('dashboard');
    } else {
        loginView.classList.remove('hidden');
        mainView.classList.add('hidden');
    }
});

// Routing & Modal (Giữ nguyên như bài trước)
window.navigate = function(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById(`page-${pageId}`);
    if(target) target.classList.remove('hidden');
    
    // Load dữ liệu khi vào trang HR
    if(pageId === 'hr') loadStaffList();
};

window.openModal = function(id) {
    modalOverlay.classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
};

window.closeModal = function() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
};

// --- LOGIC MODULE HR (MỚI) ---
const formStaff = document.getElementById('form-staff');

formStaff.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Thu thập dữ liệu từ Form
    const staffData = {
        fullName: document.getElementById('hr-name').value,
        email: document.getElementById('hr-email').value,
        phone: document.getElementById('hr-phone').value,
        cccd: document.getElementById('hr-cccd').value,
        
        role: document.getElementById('hr-role').value, // admin, coach, reception
        dept: document.getElementById('hr-dept').value, // bongro, boi, caulong
        contractType: document.getElementById('hr-type').value,
        startDate: document.getElementById('hr-start-date').value,
        
        bankName: document.getElementById('hr-bank-name').value,
        bankNum: document.getElementById('hr-bank-num').value,
        
        status: 'active',
        createdAt: new Date()
    };

    try {
        // 2. Gửi lên Firebase
        await addDoc(collection(db, "users"), staffData);
        alert("Đã thêm nhân sự HBA thành công!");
        closeModal();
        formStaff.reset();
        loadStaffList(); // Tải lại danh sách
    } catch (err) {
        console.error("Lỗi:", err);
        alert("Lỗi khi lưu: " + err.message);
    }
});

// Hàm hiển thị danh sách (Có lọc theo bộ môn)
window.loadStaffList = async function() {
    const filterDept = document.getElementById('filter-dept').value;
    const tbody = document.querySelector('#table-staff tbody');
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center'>Đang tải dữ liệu...</td></tr>";

    try {
        // Query cơ bản lấy tất cả (sau này data lớn sẽ dùng where)
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        tbody.innerHTML = "";
        
        if (snapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center'>Chưa có nhân sự nào.</td></tr>";
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Lọc Client-side (đơn giản cho giai đoạn này)
            if (filterDept !== 'all' && data.dept !== filterDept) return;

            // Mapping hiển thị đẹp hơn
            const deptName = {
                'bongro': 'Bóng rổ 🏀',
                'boi': 'Bơi lội 🏊',
                'caulong': 'Cầu lông 🏸',
                'vanphong': 'Văn phòng 💻'
            }[data.dept] || data.dept;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:bold">${data.fullName}</div>
                    <div class="text-small">${data.email}</div>
                    <div class="text-small">CCCD: ${data.cccd}</div>
                </td>
                <td>
                    <span class="badge badge-dept">${deptName}</span><br>
                    <span class="badge badge-role" style="margin-top:4px; display:inline-block">${data.role.toUpperCase()}</span>
                </td>
                <td>${data.phone}</td>
                <td>
                    <div class="text-small">${data.bankName}</div>
                    <div style="font-weight:500">${data.bankNum}</div>
                </td>
                <td><span style="color: #10b981; font-weight:600">Đang làm</span></td>
                <td>
                    <button class="btn-icon" onclick="alert('Xem chi tiết ID: ${doc.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" style="color:red"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan='6' style='color:red'>Lỗi tải dữ liệu. (Check Console)</td></tr>`;
    }
};
