// 1. Import thêm: deleteDoc, updateDoc, doc
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- QUAN TRỌNG: DÁN LẠI CONFIG CỦA BẠN VÀO ĐÂY ---
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

// Tham chiếu DOM
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnAdd = document.getElementById('btn-add');
const inputData = document.getElementById('input-data');
const userStatus = document.getElementById('user-status');
const authSection = document.getElementById('auth-section');
const dataSection = document.getElementById('data-section');
const dataList = document.getElementById('data-list');

// Biến toàn cục lưu user hiện tại
let currentUser = null;

// --- AUTHENTICATION ---
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => alert(err.message));
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        userStatus.textContent = `Xin chào, ${user.displayName}`;
        authSection.classList.add('hidden');
        dataSection.classList.remove('hidden');
        loadData();
    } else {
        userStatus.textContent = "Vui lòng đăng nhập";
        authSection.classList.remove('hidden');
        dataSection.classList.add('hidden');
        dataList.innerHTML = ''; 
    }
});

// --- LOGIC DATABASE ---

// 1. Thêm mới
btnAdd.addEventListener('click', async () => {
    const text = inputData.value;
    if (!text) return;

    try {
        await addDoc(collection(db, "todos"), {
            content: text,
            isDone: false, // Mặc định là chưa làm xong
            createdAt: Date.now(),
            uid: currentUser.uid // Lưu ID người dùng để bảo mật sau này
        });
        inputData.value = '';
    } catch (e) {
        console.error("Lỗi:", e);
    }
});

// 2. Tải dữ liệu và Tạo nút Xóa/Sửa
function loadData() {
    // Chỉ tải dữ liệu CỦA NGƯỜI DÙNG ĐANG ĐĂNG NHẬP (Lọc theo uid)
    // Hiện tại tạm thời lấy hết, bài sau sẽ học cách lọc 'where'
    const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        dataList.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id; // Lấy ID của văn bản để xóa/sửa

            // Tạo thẻ li
            const li = document.createElement("li");
            li.textContent = data.content;
            
            // Nếu đã xong thì thêm class 'completed'
            if (data.isDone) {
                li.classList.add("completed");
            }

            // A. Sự kiện: Click vào dòng chữ để đánh dấu Xong/Chưa xong
            li.addEventListener('click', () => toggleDone(id, data.isDone));

            // B. Nút xóa
            const btnDelete = document.createElement("button");
            btnDelete.textContent = "Xóa";
            btnDelete.className = "btn-delete";
            
            // Ngăn sự kiện click lan ra ngoài (để không bị kích hoạt toggleDone khi bấm xóa)
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation(); 
                deleteTask(id);
            });

            li.appendChild(btnDelete);
            dataList.appendChild(li);
        });
    });
}

// 3. Hàm Xóa
async function deleteTask(id) {
    if(confirm("Bạn muốn xóa việc này?")) {
        await deleteDoc(doc(db, "todos", id));
    }
}

// 4. Hàm Đổi trạng thái (Xong/Chưa)
async function toggleDone(id, currentStatus) {
    await updateDoc(doc(db, "todos", id), {
        isDone: !currentStatus // Đảo ngược trạng thái
    });
}
