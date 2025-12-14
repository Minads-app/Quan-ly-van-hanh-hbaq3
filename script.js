import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- GLOBAL VARIABLES ---
let staffDataList = []; // Lưu tạm danh sách nhân viên để dùng khi Sửa

// --- DOM ELEMENTS ---
const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const modalOverlay = document.getElementById('modal-overlay');

// --- AUTHENTICATION ---
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => alert(err.message));
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginView.classList.add('hidden');
        mainView.classList.remove('hidden');
        document.getElementById('avatar').src = user.photoURL;
        document.getElementById('username').textContent = user.displayName;
        navigate('hr'); // Mặc định vào trang HR
    } else {
        loginView.classList.remove('hidden');
        mainView.classList.add('hidden');
    }
});

// --- NAVIGATION & MODAL SYSTEM ---
window.navigate = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    
    if(pageId === 'hr') loadStaffList();
};

// Hàm mở Modal (Dùng chung cho Thêm mới và Sửa)
window.openModal = function(modalId, mode = 'add', staffId = null) {
    modalOverlay.classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
    const form = document.getElementById('form-staff');
    const title = document.getElementById('modal-title');
    const btnSave = document.getElementById('btn-save-staff');
    
    if (mode === 'add') {
        title.textContent = "Thêm nhân sự mới";
        btnSave.textContent = "Lưu hồ sơ";
        form.reset();
        document.getElementById('hr-id').value = ""; // Xóa ID
    } else if (mode === 'edit') {
        title.textContent = "Cập nhật hồ sơ";
        btnSave.textContent = "Cập nhật";
        
        // Tìm nhân viên trong danh sách tạm
        const staff = staffDataList.find(s => s.id === staffId);
        if (staff) {
            document.getElementById('hr-id').value = staff.id;
            document.getElementById('hr-name').value = staff.fullName;
            document.getElementById('hr-dob').value = staff.dob;
            document.getElementById('hr-cccd').value = staff.cccd;
            document.getElementById('hr-issue-date').value = staff.issueDate;
            document.getElementById('hr-issue-place').value = staff.issuePlace;
            document.getElementById('hr-address-perm').value = staff.addrPerm;
            document.getElementById('hr-address-curr').value = staff.addrCurr;
            document.getElementById('hr-position').value = staff.position;
        }
    }
};

window.closeModal = function() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
};

// --- LOGIC CRUD (THÊM, SỬA, XÓA, ĐỔI TRẠNG THÁI) ---

const formStaff = document.getElementById('form-staff');

formStaff.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const staffId = document.getElementById('hr-id').value;
    
    // Thu thập dữ liệu từ 8 trường
    const data = {
        fullName: document.getElementById('hr-name').value,
        dob: document.getElementById('hr-dob').value,
        cccd: document.getElementById('hr-cccd').value,
        issueDate: document.getElementById('hr-issue-date').value,
        issuePlace: document.getElementById('hr-issue-place').value,
        addrPerm: document.getElementById('hr-address-perm').value,
        addrCurr: document.getElementById('hr-address-curr').value,
        position: document.getElementById('hr-position').value,
        // Các trường mặc định
        updatedAt: new Date()
    };

    try {
        if (staffId) {
            // --- TRƯỜNG HỢP SỬA (UPDATE) ---
            await updateDoc(doc(db, "users", staffId), data);
            alert("Đã cập nhật hồ sơ thành công!");
        } else {
            // --- TRƯỜNG HỢP THÊM MỚI (CREATE) ---
            data.status = 'active'; // Mặc định là đang làm
            data.createdAt = new Date();
            await addDoc(collection(db, "users"), data);
            alert("Thêm nhân sự mới thành công!");
        }
        
        closeModal();
        loadStaffList();
    } catch (err) {
        console.error("Lỗi:", err);
        alert("Có lỗi xảy ra: " + err.message);
    }
});

// Hàm đổi trạng thái (Nghỉ việc / Kích hoạt lại)
window.toggleStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const msg = newStatus === 'inactive' ? "Xác nhận nhân viên này ĐÃ NGHỈ VIỆC?" : "KÍCH HOẠT LẠI nhân viên này?";
    
    if (confirm(msg)) {
        await updateDoc(doc(db, "users", id), { status: newStatus });
        loadStaffList();
    }
};

// Hàm xóa vĩnh viễn (Hard Delete)
window.deleteStaff = async function(id) {
    if (confirm("CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN hồ sơ này không? Hành động này không thể hoàn tác!")) {
        await deleteDoc(doc(db, "users", id));
        loadStaffList();
    }
};

// Hàm tải danh sách
window.loadStaffList = async function() {
    const tbody = document.querySelector('#table-staff tbody');
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center'>Đang tải...</td></tr>";

    try {
        const q = query(collection(db, "users"), orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        
        staffDataList = []; // Reset list tạm
        tbody.innerHTML = "";
        let countActive = 0;

        snapshot.forEach(docSnap => {
            const s = { id: docSnap.id, ...docSnap.data() };
            staffDataList.push(s); // Lưu vào biến toàn cục để dùng cho nút Sửa

            if (s.status === 'active') countActive++;

            const isActive = s.status === 'active';
            const statusBadge = isActive 
                ? `<span class="badge badge-active">Đang làm việc</span>` 
                : `<span class="badge badge-inactive">Đã nghỉ việc</span>`;

            // Logic nút bấm: 
            // Nếu đang làm -> Hiện nút "Báo nghỉ"
            // Nếu đã nghỉ -> Hiện nút "Kích hoạt lại"
            const statusBtn = isActive
                ? `<button class="btn-action btn-resign" title="Báo nghỉ việc" onclick="toggleStatus('${s.id}', 'active')"><i class="fas fa-user-slash"></i></button>`
                : `<button class="btn-action btn-restore" title="Kích hoạt lại" onclick="toggleStatus('${s.id}', 'inactive')"><i class="fas fa-user-check"></i></button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:bold">${s.fullName}</div>
                    <div style="color:#666; font-size:0.9em">${s.position}</div>
                </td>
                <td>
                    <div>CCCD: ${s.cccd}</div>
                    <small>Cấp ngày: ${formatDate(s.issueDate)}</small>
                </td>
                <td>
                    <div>Hiện tại: ${s.addrCurr}</div>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-action btn-edit" title="Sửa thông tin" onclick="openModal('modal-staff', 'edit', '${s.id}')"><i class="fas fa-pen"></i></button>
                    ${statusBtn}
                    <button class="btn-action btn-delete" title="Xóa vĩnh viễn" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Cập nhật số liệu dashboard
        document.getElementById('stat-staff-active').innerText = countActive;

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan='5' style='color:red'>Chưa có dữ liệu hoặc lỗi kết nối.</td></tr>`;
    }
};

// Helper format ngày tháng (YYYY-MM-DD -> DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}
