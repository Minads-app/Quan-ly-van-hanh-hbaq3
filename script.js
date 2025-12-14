// 1. Import các hàm cần thiết (đã thêm 'where')
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Cấu hình Firebase CỦA BẠN (Đã cập nhật)
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

// Các biến giao diện
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnAdd = document.getElementById('btn-add');
const inputData = document.getElementById('input-data');
const userStatus = document.getElementById('user-status');
const authSection = document.getElementById('auth-section');
const dataSection = document.getElementById('data-section');
const dataList = document.getElementById('data-list');

let currentUser = null;
let unsubscribe = null; // Biến để hủy theo dõi dữ liệu khi đăng xuất

// --- XỬ LÝ ĐĂNG NHẬP ---
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => alert("Lỗi đăng nhập: " + err.message));
});

btnLogout.addEventListener('click', () => {
    // Khi đăng xuất thì hủy theo dõi dữ liệu cũ
    if (unsubscribe) unsubscribe(); 
    signOut(auth);
});

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        userStatus.textContent = `Xin chào, ${user.displayName}`;
        authSection.classList.add('hidden');
        dataSection.classList.remove('hidden');
        loadData(); // Tải dữ liệu của user này
    } else {
        userStatus.textContent = "Vui lòng đăng nhập";
        authSection.classList.remove('hidden');
        dataSection.classList.add('hidden');
        dataList.innerHTML = ''; 
    }
});

// --- XỬ LÝ DỮ LIỆU ---

// Thêm mới (kèm uid người tạo)
btnAdd.addEventListener('click', async () => {
    const text = inputData.value;
    if (!text) return;

    try {
        await addDoc(collection(db, "todos"), {
            content: text,
            isDone: false,
            createdAt: Date.now(),
            uid: currentUser.uid // QUAN TRỌNG: Đánh dấu chủ sở hữu
        });
        inputData.value = '';
    } catch (e) {
        console.error("Lỗi thêm:", e);
        alert("Không thể thêm dữ liệu. Kiểm tra Console.");
    }
});

// Tải dữ liệu (Chỉ tải của người dùng hiện tại)
function loadData() {
    if (!currentUser) return;

    // QUERY PHỨC TẠP: Lọc theo UID + Sắp xếp theo Thời gian
    // Lưu ý: Lần đầu chạy sẽ báo lỗi yêu cầu tạo Index trong Console (F12)
    const q = query(
        collection(db, "todos"), 
        where("uid", "==", currentUser.uid), // Chỉ lấy của mình
        orderBy("createdAt", "desc")        // Mới nhất lên đầu
    );
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        dataList.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const li = document.createElement("li");
            li.textContent = data.content;
            if (data.isDone) li.classList.add("completed");

            // Sự kiện click để đổi trạng thái
            li.addEventListener('click', () => toggleDone(id, data.isDone));

            // Nút xóa
            const btnDelete = document.createElement("button");
            btnDelete.textContent = "X"; // Nút X gọn hơn cho mobile
            btnDelete.className = "btn-delete";
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation(); 
                deleteTask(id);
            });

            li.appendChild(btnDelete);
            dataList.appendChild(li);
        });
    }, (error) => {
        // Bắt lỗi nếu chưa tạo Index
        console.error("Lỗi tải dữ liệu:", error);
        if (error.code === 'failed-precondition') {
            alert("Lần đầu chạy query lọc + sắp xếp, bạn cần mở Console (F12) và bấm vào link Firebase cung cấp để tạo Index.");
        }
    });
}

async function deleteTask(id) {
    if(confirm("Xóa nhé?")) {
        await deleteDoc(doc(db, "todos", id));
    }
}

async function toggleDone(id, currentStatus) {
    await updateDoc(doc(db, "todos", id), { isDone: !currentStatus });
}
