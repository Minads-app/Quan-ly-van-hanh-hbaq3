import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- DÁN LẠI CONFIG CỦA BẠN VÀO ĐÂY ---
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

let staffDataList = [];

const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const modalOverlay = document.getElementById('modal-overlay');

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
        navigate('hr');
    } else {
        loginView.classList.remove('hidden');
        mainView.classList.add('hidden');
    }
});

window.navigate = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(`page-${pageId}`);
    if(target) target.classList.remove('hidden');
    if(pageId === 'hr') loadStaffList();
};

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
        document.getElementById('hr-id').value = "";
    } else if (mode === 'edit') {
        title.textContent = "Cập nhật hồ sơ";
        btnSave.textContent = "Cập nhật";
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

window.saveStaffData = async function() {
    const fullName = document.getElementById('hr-name').value;
    const dob = document.getElementById('hr-dob').value;
    const cccd = document.getElementById('hr-cccd').value;
    const issueDate = document.getElementById('hr-issue-date').value;
    const issuePlace = document.getElementById('hr-issue-place').value;
    const addrCurr = document.getElementById('hr-address-curr').value;
    const position = document.getElementById('hr-position').value;

    if (!fullName || !dob || !cccd || !issueDate || !issuePlace || !addrCurr || !position) {
        alert("Vui lòng điền đủ các thông tin có dấu *");
        return;
    }

    const staffId = document.getElementById('hr-id').value;
    const data = {
        fullName, dob, cccd, issueDate, issuePlace,
        addrPerm: document.getElementById('hr-address-perm').value,
        addrCurr, position, updatedAt: new Date()
    };

    const btnSave = document.getElementById('btn-save-staff');
    btnSave.textContent = "Đang lưu...";
    btnSave.disabled = true;

    try {
        if (staffId) {
            await updateDoc(doc(db, "users", staffId), data);
            alert("Cập nhật thành công!");
        } else {
            data.status = 'active';
            data.createdAt = new Date();
            await addDoc(collection(db, "users"), data);
            alert("Thêm mới thành công!");
        }
        closeModal();
        loadStaffList();
    } catch (err) {
        console.error("Lỗi:", err);
        alert("Lỗi: " + err.message);
    } finally {
        btnSave.textContent = "Lưu hồ sơ";
        btnSave.disabled = false;
    }
};

window.toggleStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (confirm(newStatus === 'inactive' ? "Xác nhận báo nghỉ việc?" : "Kích hoạt lại?")) {
        await updateDoc(doc(db, "users", id), { status: newStatus });
        loadStaffList();
    }
};

window.deleteStaff = async function(id) {
    if (confirm("XÓA VĨNH VIỄN?")) {
        await deleteDoc(doc(db, "users", id));
        loadStaffList();
    }
};

window.loadStaffList = async function() {
    const tbody = document.querySelector('#table-staff tbody');
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center'>Đang tải...</td></tr>";
    try {
        const q = query(collection(db, "users"), orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        staffDataList = [];
        tbody.innerHTML = "";
        let countActive = 0;

        snapshot.forEach(docSnap => {
            const s = { id: docSnap.id, ...docSnap.data() };
            staffDataList.push(s);
            if (s.status === 'active') countActive++;
            const isActive = s.status === 'active';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${s.fullName}</b><br><small>${s.position}</small></td>
                <td>CCCD: ${s.cccd}<br><small>${formatDate(s.issueDate)}</small></td>
                <td>${s.addrCurr}</td>
                <td>${isActive ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Nghỉ</span>'}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="openModal('modal-staff', 'edit', '${s.id}')"><i class="fas fa-pen"></i></button>
                    ${isActive ? `<button class="btn-action btn-resign" onclick="toggleStatus('${s.id}', 'active')"><i class="fas fa-user-slash"></i></button>` : `<button class="btn-action btn-restore" onclick="toggleStatus('${s.id}', 'inactive')"><i class="fas fa-user-check"></i></button>`}
                    <button class="btn-action btn-delete" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('stat-staff-active').innerText = countActive;
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan='5'>Lỗi tải data</td></tr>`;
    }
};

function formatDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}
