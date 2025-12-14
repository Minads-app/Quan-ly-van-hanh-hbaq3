import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let packageDataList = []; // Lưu danh sách gói tập

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

// Tìm và thay thế hàm navigate cũ bằng hàm này
window.navigate = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(`page-${pageId}`);
    if(target) target.classList.remove('hidden');

    // Logic tải dữ liệu cho từng trang
    if(pageId === 'hr') loadStaffList();
    if(pageId === 'settings') loadPackageList();
    
    if(pageId === 'sales') {
        loadStudentList(); 
        // Tải luôn danh sách Gói tập & Nhân viên để nạp vào Dropdown
        if(packageDataList.length === 0) loadPackageList();
        if(staffDataList.length === 0) loadStaffList(); 
    }
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
// ==========================================
// MODULE: QUẢN LÝ GÓI TẬP (SETTINGS)
// ==========================================

window.loadPackageList = async function() {
    const tbody = document.querySelector('#table-packages tbody');
    tbody.innerHTML = "<tr><td colspan='4' class='text-center'>Đang tải...</td></tr>";
    
    try {
        // Lấy dữ liệu từ collection 'packages'
        const q = query(collection(db, "packages"), orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        
        packageDataList = [];
        tbody.innerHTML = "";
        
        if (snapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='4' class='text-center'>Chưa có gói tập nào</td></tr>";
            return;
        }

        snapshot.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            packageDataList.push(p);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${p.name}</b><br><small class="badge badge-dept">${p.subject}</small></td>
                <td style="color: var(--primary); font-weight:bold">${parseInt(p.price).toLocaleString()} đ</td>
                <td>${p.sessions} buổi <br> <small>${p.duration} ngày</small></td>
                <td>
                    <button class="btn-action btn-edit" onclick="openModalPackage('edit', '${p.id}')"><i class="fas fa-pen"></i></button>
                    <button class="btn-action btn-delete" onclick="deletePackage('${p.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan='4' class='text-center text-danger'>Lỗi: ${err.message}</td></tr>`;
    }
};

window.openModalPackage = function(mode, pkgId = null) {
    window.openModal('modal-package'); // Mở modal chung
    const title = document.getElementById('modal-title-package');
    const form = document.getElementById('form-package');
    
    if (mode === 'add') {
        title.textContent = "Thêm gói tập mới";
        form.reset();
        document.getElementById('pkg-id').value = "";
    } else {
        title.textContent = "Cập nhật gói tập";
        const pkg = packageDataList.find(p => p.id === pkgId);
        if (pkg) {
            document.getElementById('pkg-id').value = pkg.id;
            document.getElementById('pkg-name').value = pkg.name;
            document.getElementById('pkg-subject').value = pkg.subject;
            document.getElementById('pkg-price').value = pkg.price;
            document.getElementById('pkg-sessions').value = pkg.sessions;
            document.getElementById('pkg-duration').value = pkg.duration;
            document.getElementById('pkg-schedule').value = pkg.schedule || "";
        }
    }
};

// CẬP NHẬT HÀM LƯU GÓI TẬP (Thông minh hơn)
window.savePackageData = async function() {
    const name = document.getElementById('pkg-name').value;
    const subject = document.getElementById('pkg-subject').value;
    const price = document.getElementById('pkg-price').value;
    const sessions = document.getElementById('pkg-sessions').value;
    const duration = document.getElementById('pkg-duration').value;
    const schedule = document.getElementById('pkg-schedule').value;
    const pkgId = document.getElementById('pkg-id').value; // Lấy ID (nếu có)

    // Validate dữ liệu
    if (!name || !price || !sessions || !duration) {
        alert("Vui lòng điền đủ thông tin bắt buộc!");
        return;
    }

    // Chuẩn bị dữ liệu
    const data = {
        name, subject, 
        price: Number(price), 
        sessions: Number(sessions), 
        duration: Number(duration),
        schedule: schedule || "",
        updatedAt: new Date()
    };

    const btnSave = document.querySelector('#form-package .btn-primary');
    const originalText = btnSave.textContent;
    btnSave.textContent = "Đang xử lý...";
    btnSave.disabled = true;

    try {
        if (pkgId) {
            // TRƯỜNG HỢP 1: CẬP NHẬT (EDIT)
            try {
                // Cố gắng cập nhật
                await updateDoc(doc(db, "packages", pkgId), data);
                alert("Cập nhật thành công!");
            } catch (err) {
                // Nếu lỗi là do không tìm thấy gói (No document to update)
                if (err.message.includes("No document to update")) {
                    // Hỏi người dùng có muốn tạo mới luôn không
                    if(confirm("Gói tập này không còn tồn tại trên hệ thống (có thể đã bị xóa). Bạn có muốn TẠO MỚI gói này không?")) {
                        // Chuyển sang tạo mới
                        data.createdAt = new Date();
                        await addDoc(collection(db, "packages"), data);
                        alert("Đã tạo mới thành công!");
                    }
                } else {
                    // Nếu lỗi khác thì báo ra
                    throw err;
                }
            }
        } else {
            // TRƯỜNG HỢP 2: THÊM MỚI (ADD)
            data.createdAt = new Date();
            await addDoc(collection(db, "packages"), data);
            alert("Thêm gói mới thành công!");
        }

        closeModal();
        loadPackageList(); // Tải lại danh sách ngay lập tức
    } catch (err) {
        console.error("Lỗi:", err);
        alert("Có lỗi xảy ra: " + err.message);
    } finally {
        btnSave.textContent = originalText;
        btnSave.disabled = false;
    }
};
// ==========================================
// MODULE: SALES (QUẢN LÝ HỌC VIÊN)
// ==========================================
let studentDataList = [];

// 1. Mở Modal & Chuẩn bị dữ liệu Dropdown
window.openModalSales = function(mode, studentId = null) {
    window.openModal('modal-sales');
    const form = document.getElementById('form-sales');
    const title = document.getElementById('modal-title-sales');
    
    // Nạp dữ liệu vào Dropdown Gói tập
    const pkgSelect = document.getElementById('sales-package-select');
    pkgSelect.innerHTML = '<option value="">-- Chọn gói tập --</option>';
    packageDataList.forEach(p => {
        // Lưu giá trị gói vào thuộc tính data để dùng sau
        pkgSelect.innerHTML += `<option value="${p.id}" 
            data-price="${p.price}" data-sessions="${p.sessions}" data-duration="${p.duration}">
            ${p.name} - ${parseInt(p.price).toLocaleString()}đ
        </option>`;
    });

    // Nạp dữ liệu vào Dropdown HLV (Lọc những ai có chức vụ chứa chữ 'HLV' hoặc 'Coach')
    const coachSelect = document.getElementById('sales-coach');
    coachSelect.innerHTML = '<option value="">-- Chọn HLV --</option>';
    staffDataList.forEach(s => {
        if (s.position.includes("HLV") || s.position.includes("Coach") || s.position.includes("Trợ giảng")) {
            coachSelect.innerHTML += `<option value="${s.id}">${s.fullName} (${s.position})</option>`;
        }
    });

    if (mode === 'add') {
        title.textContent = "Đăng ký khóa học mới";
        form.reset();
        document.getElementById('student-id').value = "";
        document.getElementById('guardian-info').classList.add('hidden'); // Mặc định ẩn phụ huynh
    } 
    // (Phần Edit chúng ta sẽ làm sau khi test xong phần Add)
};

// 2. Logic "Smart Form" - Tự động điền thông tin Gói
window.fillPackageInfo = function() {
    const select = document.getElementById('sales-package-select');
    const option = select.options[select.selectedIndex];
    
    if (option.value) {
        // Lấy dữ liệu từ attribute data- (đã gán ở bước mở Modal)
        document.getElementById('sales-price').value = parseInt(option.dataset.price).toLocaleString('vi-VN');
        document.getElementById('sales-sessions').value = option.dataset.sessions;
        document.getElementById('sales-duration').value = option.dataset.duration;
        
        // Nếu đã chọn ngày bắt đầu thì tính lại ngày kết thúc luôn
        calculateEndDate();
    } else {
        document.getElementById('sales-price').value = "";
        document.getElementById('sales-sessions').value = "";
        document.getElementById('sales-duration').value = "";
    }
};

// 3. Logic "Smart Form" - Tự động tính Ngày kết thúc
window.calculateEndDate = function() {
    const startDateVal = document.getElementById('sales-start-date').value;
    const durationVal = document.getElementById('sales-duration').value;

    if (startDateVal && durationVal) {
        const startDate = new Date(startDateVal);
        const duration = parseInt(durationVal);
        
        // Cộng ngày: Date + duration
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);
        
        // Format YYYY-MM-DD để gán vào input date
        document.getElementById('sales-end-date').value = endDate.toISOString().split('T')[0];
    }
};

// 4. Logic "Smart Form" - Tự động tính Tuổi & Hiện Phụ huynh
window.calculateAge = function() {
    const dobVal = document.getElementById('sales-dob').value;
    if (dobVal) {
        const dob = new Date(dobVal);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        // Logic: Dưới 18 tuổi thì hiện form Phụ huynh
        const guardianSection = document.getElementById('guardian-info');
        if (age < 18) {
            guardianSection.classList.remove('hidden');
        } else {
            guardianSection.classList.add('hidden');
        }
    }
};
// Hàm kiểm tra trùng lặp SĐT
window.checkDuplicateStudent = async function() {
    const phoneInput = document.getElementById('sales-phone');
    const phone = phoneInput.value.trim();
    
    if (phone.length < 9) return; // Chưa đủ số thì chưa check

    // Query tìm trong database xem có SĐT này chưa
    const q = query(collection(db, "students"), where("phone", "==", phone), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const oldData = snapshot.docs[0].data();
        
        // Hiện cảnh báo
        const choice = confirm(
            `⚠️ CẢNH BÁO TRÙNG LẶP!\n\n` +
            `Số điện thoại ${phone} đã tồn tại trong hệ thống.\n` +
            `Học viên: ${oldData.fullName}\n` +
            `Ngày sinh: ${oldData.dob}\n\n` +
            `• Bấm OK: Để tự động điền thông tin cũ (Đăng ký khóa mới cho khách cũ).\n` +
            `• Bấm Cancel: Để tiếp tục nhập mới (Trường hợp trùng SĐT nhưng khác người).`
        );

        if (choice) {
            // Tự động điền thông tin cũ vào form
            document.getElementById('sales-name').value = oldData.fullName;
            document.getElementById('sales-dob').value = oldData.dob;
            document.getElementById('sales-gender').value = oldData.gender;
            document.getElementById('sales-address').value = oldData.address;
            document.getElementById('sales-card-id').value = oldData.cardId || ""; // Lấy thẻ cũ nếu có
            
            // Nếu có phụ huynh thì điền luôn
            if(oldData.guardian) {
                document.getElementById('sales-guardian').value = oldData.guardian;
                document.getElementById('sales-guardian-phone').value = oldData.guardianPhone;
                calculateAge(); // Để hiện form phụ huynh lên
            }
        } else {
            // Nếu chọn Cancel, người dùng tự nhập, không làm gì cả
            // Có thể clear input phone nếu muốn bắt buộc không trùng, nhưng ở đây ta cho phép trùng.
        }
    }
};
// 5. Lưu dữ liệu Học viên (Ghi danh)
window.saveStudentData = async function() {
    // 1. Lấy dữ liệu cơ bản
    const name = document.getElementById('sales-name').value;
    const phone = document.getElementById('sales-phone').value;
    const pkgId = document.getElementById('sales-package-select').value;
    const startDate = document.getElementById('sales-start-date').value;
    const coachId = document.getElementById('sales-coach').value;
    
    // 2. Lấy dữ liệu mới thêm
    const paymentMethod = document.getElementById('sales-payment-method').value;
    const receiptNumber = document.getElementById('sales-receipt-number').value;
    const cardId = document.getElementById('sales-card-id').value;

    if (!name || !phone || !pkgId || !startDate) {
        alert("Vui lòng điền đủ: Tên, SĐT, Gói tập, Ngày bắt đầu");
        return;
    }

    // Lấy thông tin chi tiết gói
    const pkgSelect = document.getElementById('sales-package-select');
    const pkgOption = pkgSelect.options[pkgSelect.selectedIndex];
    const pkgName = pkgOption.text;
    const tuition = parseInt(pkgOption.dataset.price);
    const totalSessions = parseInt(pkgOption.dataset.sessions);

    const data = {
        fullName: name.toUpperCase(),
        dob: document.getElementById('sales-dob').value,
        gender: document.getElementById('sales-gender').value,
        phone,
        cardId, // Lưu số thẻ tập
        address: document.getElementById('sales-address').value,
        guardian: document.getElementById('sales-guardian').value,
        guardianPhone: document.getElementById('sales-guardian-phone').value,
        
        // Thông tin khóa học & Thanh toán
        packageId,
        packageName: pkgName,
        coachId,
        tuition,
        paymentMethod, // Lưu hình thức thanh toán
        receiptNumber, // Lưu số phiếu thu
        
        totalSessions,
        sessionsLeft: totalSessions,
        startDate,
        endDate: document.getElementById('sales-end-date').value,
        note: document.getElementById('sales-note').value,
        
        status: 'active',
        createdAt: new Date()
    };

    const btnSave = document.querySelector('#form-sales .btn-primary');
    btnSave.textContent = "Đang xử lý...";
    btnSave.disabled = true;

    try {
        await addDoc(collection(db, "students"), data);
        alert("Đăng ký thành công! Đã tạo hồ sơ học viên.");
        closeModal();
        loadStudentList();
    } catch (err) {
        console.error(err);
        alert("Lỗi: " + err.message);
    } finally {
        btnSave.textContent = "Hoàn tất đăng ký";
        btnSave.disabled = false;
    }
};

// 6. Tải danh sách học viên
window.loadStudentList = async function() {
    const tbody = document.querySelector('#table-students tbody');
    tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Đang tải dữ liệu...</td></tr>";

    try {
        const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        studentDataList = [];
        tbody.innerHTML = "";

        if (snapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Chưa có học viên nào</td></tr>";
            return;
        }

        snapshot.forEach(docSnap => {
            const s = { id: docSnap.id, ...docSnap.data() };
            studentDataList.push(s);
            
            // Tìm tên HLV trong list staff (để hiển thị cho đẹp)
            const coach = staffDataList.find(st => st.id === s.coachId);
            const coachName = coach ? coach.fullName : "Chưa xếp lớp";

            // Tính % tiến độ
            const progress = ((s.totalSessions - s.sessionsLeft) / s.totalSessions) * 100;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <b>${s.fullName}</b> <br>
                    <small><i class="fas fa-phone"></i> ${s.phone}</small>
                </td>
                <td>
                    <span class="badge badge-dept">${s.packageName.split('-')[0]}</span><br>
                    <small>HLV: ${coachName}</small>
                </td>
                <td>
                    <b>${s.totalSessions - s.sessionsLeft}</b> / ${s.totalSessions} buổi
                    <div style="background:#e2e8f0; height:6px; border-radius:3px; margin-top:5px; width: 100px;">
                        <div style="background:var(--primary); height:100%; width:${progress}%; border-radius:3px;"></div>
                    </div>
                </td>
                <td>
                    <small>Start: ${formatDate(s.startDate)}</small><br>
                    <small style="color:var(--danger)">End: ${formatDate(s.endDate)}</small>
                </td>
                <td><span class="badge badge-active">Đang học</span></td>
                <td>
                    <button class="btn-action btn-edit"><i class="fas fa-eye"></i></button>
                    <button class="btn-action btn-delete"><i class="fas fa-print"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan='6'>Lỗi: ${err.message}</td></tr>`;
    }
};

// Hàm tìm kiếm nhanh (Search)
window.searchStudent = function() {
    const keyword = document.getElementById('search-student').value.toLowerCase();
    const rows = document.querySelectorAll('#table-students tbody tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
    });
};


