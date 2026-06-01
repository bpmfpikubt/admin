// ============= KONFIGURASI API =============
// const API_URL = 'https://script.google.com/macros/s/AKfycbwSIrtIIePFTLi9mYISG6Z1cw9ihZMOqKtcfQ6ZrIfeEKelZ3ct9vYfugc-llFaAaXTig/exec';

// // ============= KONFIGURASI CLOUDINARY =============
// const CLOUD_NAME = 'dvkejsfrp';
// const UPLOAD_PRESET = 'bpm_upload';

// ============= UTILITY =============
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeModalForm() {
    const modal = document.getElementById('modalForm');
    if (modal) modal.remove();
}

// ============= UPLOAD KE CLOUDINARY =============
async function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64 = e.target.result;
            
            const formData = new FormData();
            formData.append('file', base64);
            formData.append('upload_preset', UPLOAD_PRESET);
            
            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (result.secure_url) {
                    resolve({
                        success: true,
                        url: result.secure_url,
                        thumb: result.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill/')
                    });
                } else {
                    reject({ success: false, error: result.error?.message || 'Upload gagal' });
                }
            } catch (error) {
                reject({ success: false, error: error.message });
            }
        };
        reader.onerror = () => reject({ success: false, error: 'Gagal membaca file' });
        reader.readAsDataURL(file);
    });
}

// ============= TAB NAVIGATION DENGAN SCROLL OTOMATIS =============
function switchTab(tab) {
    // Sembunyikan semua tab pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Nonaktifkan semua tombol tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tampilkan tab pane yang dipilih
    const activePane = document.getElementById(`tab-${tab}`);
    if (activePane) {
        activePane.classList.add('active');
    }
    
    // Aktifkan tombol yang sesuai
    const buttons = document.querySelectorAll('.tab-btn');
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tab}'`)) {
            btn.classList.add('active');
            break;
        }
    }
    
    // SCROLL OTOMATIS KE KONTEN TAB
    setTimeout(() => {
        const activeContent = document.querySelector('.tab-pane.active');
        if (activeContent) {
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            const yOffset = navbarHeight + 15;
            const y = activeContent.getBoundingClientRect().top + window.pageYOffset - yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, 100);
    
    // Load data sesuai tab yang dipilih
    if (tab === 'kegiatan') {
        if (typeof loadKegiatan === 'function') loadKegiatan();
    } else if (tab === 'aspirasi') {
        if (typeof loadAspirasi === 'function') loadAspirasi();
    } else if (tab === 'berkas') {
        if (typeof loadBerkasList === 'function') loadBerkasList();
    } else {
        if (typeof loadAnggota === 'function') loadAnggota();
    }
}

// ============= LOGOUT ADMIN (SweetAlert) =============
function adminLogout() {
    Swal.fire({
        title: 'Yakin ingin logout?',
        text: 'Anda akan keluar dari dashboard admin',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Ya, Logout',
        cancelButtonText: '<i class="fas fa-times"></i> Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('adminUsername');
            
            Swal.fire({
                icon: 'success',
                title: 'Logout Berhasil!',
                text: 'Anda telah keluar dari dashboard admin',
                confirmButtonColor: '#0f3b5f',
                confirmButtonText: '<i class="fas fa-check"></i> OK',
                timer: 1500,
                timerProgressBar: true
            }).then(() => {
                window.location.href = 'admin-login.html';
            });
        }
    });
}

// ============= ANGGOTA BPM =============
async function loadAnggota() {
    const grid = document.getElementById('memberGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Memuat data anggota...</div>';
    
    try {
        const response = await fetch(API_URL + '?action=getAnggota');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            renderAnggota(result.data);
        } else {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>Belum ada data anggota</p>
                    <button class="btn-primary" onclick="showTambahAnggotaForm()" style="margin-top:15px;">
                        <i class="fas fa-plus"></i> Tambah Anggota Pertama
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data. Periksa koneksi API.</div>';
    }
}

function renderAnggota(anggotaList) {
    const grid = document.getElementById('memberGrid');
    if (!grid) return;
    
    const addButton = `
        <div class="admin-card add-card" onclick="showTambahAnggotaForm()">
            <div class="card-body" style="text-align:center;">
                <div style="font-size:48px; color:var(--primary);"><i class="fas fa-plus-circle"></i></div>
                <h3>Tambah Anggota Baru</h3>
                <p style="font-size:12px;">Klik untuk menambah anggota</p>
            </div>
        </div>
    `;
    
    const cardsHtml = anggotaList.map(m => `
        <div class="admin-card">
            <div class="card-header">
                <span><i class="fas fa-tag"></i> ${escapeHtml(m.jabatan)}</span>
                <button class="btn-delete" onclick="hapusAnggota('${m.id}', '${escapeHtml(m.nama)}', ${m.rowIndex})">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
            <div class="card-body" style="text-align:center;">
                <div class="member-avatar-preview" onclick="document.getElementById('file_member_${m.id}').click()">
                    ${m.fotoUrl ? 
                        `<img src="${m.fotoUrl}">` : 
                        `<div class="avatar-placeholder"><i class="fas fa-camera"></i> Upload Foto</div>`
                    }
                </div>
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Nama</label>
                    <input type="text" id="m_nama_${m.id}" value="${escapeHtml(m.nama)}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-tag"></i> Jabatan</label>
                    <input type="text" id="m_jabatan_${m.id}" value="${escapeHtml(m.jabatan)}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-align-left"></i> Deskripsi</label>
                    <textarea id="m_deskripsi_${m.id}" rows="2">${escapeHtml(m.deskripsi || '')}</textarea>
                </div>
                <div class="row-2cols">
                    <div class="form-group">
                        <label><i class="fab fa-instagram"></i> Instagram</label>
                        <input type="text" id="m_ig_${m.id}" value="${escapeHtml(m.instagram || '')}">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-envelope"></i> Email</label>
                        <input type="email" id="m_email_${m.id}" value="${escapeHtml(m.email || '')}">
                    </div>
                </div>
                <div class="row-2cols">
                    <div class="form-group">
                        <label><i class="fab fa-whatsapp"></i> WhatsApp</label>
                        <input type="text" id="m_wa_${m.id}" value="${escapeHtml(m.whatsapp || '')}">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-users"></i> Anggota Tim</label>
                        <input type="text" id="m_tim_${m.id}" value="${escapeHtml(m.anggotaTim || '')}">
                    </div>
                </div>
                <button class="btn-primary" onclick="saveMember('${m.id}', ${m.rowIndex})" style="width:100%;">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = addButton + cardsHtml;
    
    // Hidden file inputs untuk upload foto
    anggotaList.forEach(m => {
        if (!document.getElementById(`file_member_${m.id}`)) {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = `file_member_${m.id}`;
            input.accept = 'image/*';
            input.style.display = 'none';
            input.onchange = (e) => handleMemberUpload(m.id, m.rowIndex, e);
            document.body.appendChild(input);
        }
    });
}

function showTambahAnggotaForm() {
    const modal = document.createElement('div');
    modal.id = 'modalForm';
    modal.className = 'modal-form';
    modal.innerHTML = `
        <div class="modal-form-content">
            <span class="modal-close" onclick="closeModalForm()">&times;</span>
            <h3><i class="fas fa-user-plus"></i> Tambah Anggota Baru</h3>
            <div class="form-group">
                <label>Nama Lengkap</label>
                <input type="text" id="new_nama" placeholder="Contoh: Dr. Asbar Laga">
            </div>
            <div class="form-group">
                <label>Jabatan</label>
                <input type="text" id="new_jabatan" placeholder="Contoh: Penasehat">
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea id="new_deskripsi" rows="2" placeholder="Deskripsi jabatan"></textarea>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="new_email" placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>Instagram</label>
                <input type="text" id="new_instagram" placeholder="@username">
            </div>
            <div class="form-group">
                <label>WhatsApp</label>
                <input type="text" id="new_whatsapp" placeholder="0812xxxx">
            </div>
            <button class="btn-primary" onclick="tambahAnggota()">
                <i class="fas fa-save"></i> Simpan Anggota
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

async function tambahAnggota() {
    const nama = document.getElementById('new_nama')?.value.trim();
    const jabatan = document.getElementById('new_jabatan')?.value.trim();
    const deskripsi = document.getElementById('new_deskripsi')?.value.trim();
    const email = document.getElementById('new_email')?.value.trim();
    const instagram = document.getElementById('new_instagram')?.value.trim();
    const whatsapp = document.getElementById('new_whatsapp')?.value.trim();
    
    if (!nama) {
        showToast('Nama lengkap wajib diisi', 'error');
        return;
    }
    
    if (!jabatan) {
        showToast('Jabatan wajib diisi', 'error');
        return;
    }
    
    const data = {
        action: 'tambahAnggota',
        nama: nama,
        jabatan: jabatan,
        deskripsi: deskripsi || '',
        email: email || '',
        instagram: instagram || '',
        whatsapp: whatsapp || ''
    };
    
    try {
        showToast('Menyimpan data...', 'success');
        
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        });
        
        showToast('Anggota baru ditambahkan', 'success');
        closeModalForm();
        loadAnggota();
    } catch (error) {
        showToast('Gagal menambahkan', 'error');
    }
}

// HAPUS ANGGOTA DENGAN SWEETALERT
async function hapusAnggota(id, nama, rowIndex) {
    const result = await Swal.fire({
        title: 'Hapus Anggota?',
        text: `Apakah Anda yakin ingin menghapus anggota "${nama}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-trash"></i> Ya, Hapus',
        cancelButtonText: '<i class="fas fa-times"></i> Batal'
    });
    
    if (!result.isConfirmed) return;
    
    showToast('Menghapus data...', 'success');
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'hapusAnggota',
                rowIndex: rowIndex
            })
        });
        
        showToast(`Anggota "${nama}" berhasil dihapus`, 'success');
        loadAnggota();
    } catch (error) {
        showToast('Gagal menghapus anggota', 'error');
    }
}

async function handleMemberUpload(memberId, rowIndex, event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { 
        showToast('Maksimal 2MB', 'error'); 
        return; 
    }
    
    showToast('Mengupload foto ke Cloudinary...', 'success');
    
    try {
        const result = await uploadToCloudinary(file);
        
        if (result.success) {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'uploadFotoAnggota',
                    rowIndex: rowIndex,
                    fotoUrl: result.url
                })
            });
            
            showToast('Foto anggota terupload!', 'success');
            loadAnggota();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal upload foto: ' + (error.error || error.message), 'error');
    }
    event.target.value = '';
}

async function saveMember(memberId, rowIndex) {
    const data = {
        action: 'updateAnggota',
        rowIndex: rowIndex,
        nama: document.getElementById(`m_nama_${memberId}`).value,
        jabatan: document.getElementById(`m_jabatan_${memberId}`).value,
        deskripsi: document.getElementById(`m_deskripsi_${memberId}`).value,
        instagram: document.getElementById(`m_ig_${memberId}`).value,
        email: document.getElementById(`m_email_${memberId}`).value,
        whatsapp: document.getElementById(`m_wa_${memberId}`).value,
        anggotaTim: document.getElementById(`m_tim_${memberId}`).value
    };
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        });
        showToast('Data tersimpan', 'success');
        loadAnggota();
    } catch (error) {
        showToast('Gagal menyimpan', 'error');
    }
}

// ============= KEGIATAN =============
async function loadKegiatan() {
    const grid = document.getElementById('kegiatanGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Memuat data kegiatan...</div>';
    
    try {
        const response = await fetch(API_URL + '?action=getKegiatan');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            renderKegiatan(result.data);
        } else {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-image" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>Belum ada data kegiatan</p>
                    <button class="btn-primary" onclick="showTambahKegiatanForm()" style="margin-top:15px;">
                        <i class="fas fa-plus"></i> Tambah Kegiatan Pertama
                    </button>
                </div>
            `;
        }
    } catch (error) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data</div>';
    }
}

function renderKegiatan(kegiatanList) {
    const grid = document.getElementById('kegiatanGrid');
    if (!grid) return;
    
    const addButton = `
        <div class="admin-card add-card" onclick="showTambahKegiatanForm()">
            <div class="card-body" style="text-align:center;">
                <div style="font-size:48px; color:var(--primary);"><i class="fas fa-plus-circle"></i></div>
                <h3>Tambah Kegiatan Baru</h3>
                <p style="font-size:12px;">Klik untuk menambah kegiatan</p>
            </div>
        </div>
    `;
    
    const cardsHtml = kegiatanList.map(k => {
        let images = [];
        try { images = JSON.parse(k.images || '[]'); } catch(e) { images = []; }
        
        return `
            <div class="admin-card">
                <div class="card-header">
                    <span><i class="fas fa-calendar-alt"></i> ${escapeHtml(k.title)}</span>
                    <button class="btn-delete" onclick="hapusKegiatan(${k.rowIndex}, '${escapeHtml(k.title)}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label><i class="fas fa-heading"></i> Judul Kegiatan</label>
                        <input type="text" id="k_title_${k.id}" value="${escapeHtml(k.title)}">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-align-left"></i> Deskripsi</label>
                        <textarea id="k_deskripsi_${k.id}" rows="2">${escapeHtml(k.deskripsi || '')}</textarea>
                    </div>
                    <div class="gallery-manager">
                        <div class="gallery-title"><i class="fas fa-images"></i> Galeri Foto (${images.length} foto)</div>
                        <div class="gallery-images" id="gallery_${k.id}">
                            ${renderGalleryImages(k.id, images)}
                        </div>
                        <div class="upload-area" onclick="document.getElementById('file_kegiatan_${k.id}').click()">
                            <i class="fas fa-cloud-upload-alt"></i> + Upload Foto Baru
                        </div>
                        <input type="file" id="file_kegiatan_${k.id}" accept="image/*" style="display:none" onchange="handleKegiatanUpload('${k.id}', ${k.rowIndex}, event)">
                    </div>
                    <button class="btn-primary" onclick="saveKegiatan('${k.id}', ${k.rowIndex})" style="width:100%; margin-top:15px;">
                        <i class="fas fa-save"></i> Simpan Kegiatan
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = addButton + cardsHtml;
}

function showTambahKegiatanForm() {
    const modal = document.createElement('div');
    modal.id = 'modalForm';
    modal.className = 'modal-form';
    modal.innerHTML = `
        <div class="modal-form-content">
            <span class="modal-close" onclick="closeModalForm()">&times;</span>
            <h3><i class="fas fa-plus-circle"></i> Tambah Kegiatan Baru</h3>
            <div class="form-group">
                <label>Judul Kegiatan</label>
                <input type="text" id="new_title" placeholder="Contoh: Rapat Pleno BPM">
            </div>
            <div class="form-group">
                <label>Deskripsi</label>
                <textarea id="new_deskripsi_kegiatan" rows="2" placeholder="Deskripsi kegiatan"></textarea>
            </div>
            <div class="form-group">
                <label>Tujuan</label>
                <textarea id="new_tujuan" rows="2" placeholder="Tujuan kegiatan"></textarea>
            </div>
            <div class="form-group">
                <label>Kontak</label>
                <input type="text" id="new_kontak" placeholder="Email/WA untuk info">
            </div>
            <button class="btn-primary" onclick="tambahKegiatan()">
                <i class="fas fa-save"></i> Simpan Kegiatan
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

async function tambahKegiatan() {
    const data = {
        action: 'tambahKegiatan',
        title: document.getElementById('new_title').value,
        deskripsi: document.getElementById('new_deskripsi_kegiatan').value,
        tujuan: document.getElementById('new_tujuan').value,
        kontak: document.getElementById('new_kontak').value
    };
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        });
        showToast('Kegiatan baru ditambahkan', 'success');
        closeModalForm();
        loadKegiatan();
    } catch (error) {
        showToast('Gagal menambahkan', 'error');
    }
}

// HAPUS KEGIATAN DENGAN SWEETALERT
async function hapusKegiatan(rowIndex, title) {
    const result = await Swal.fire({
        title: 'Hapus Kegiatan?',
        text: `Apakah Anda yakin ingin menghapus kegiatan "${title}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-trash"></i> Ya, Hapus',
        cancelButtonText: '<i class="fas fa-times"></i> Batal'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'hapusKegiatan',
                rowIndex: rowIndex
            })
        });
        showToast('Kegiatan dihapus', 'success');
        loadKegiatan();
    } catch (error) {
        showToast('Gagal menghapus', 'error');
    }
}

function renderGalleryImages(kegiatanId, images) {
    if (!images.length) return '<div style="color:#999;"><i class="fas fa-image"></i> Belum ada foto</div>';
    return images.map((img, idx) => `
        <div class="gallery-img-item">
            <img src="${img}">
            <div class="delete-img" onclick="deleteKegiatanImage('${kegiatanId}', ${idx})">
                <i class="fas fa-times"></i>
            </div>
        </div>
    `).join('');
}

async function handleKegiatanUpload(kegiatanId, rowIndex, event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast('Maksimal 2MB', 'error');
        return;
    }
    
    showToast('Mengupload foto ke Cloudinary...', 'success');
    
    try {
        const result = await uploadToCloudinary(file);
        
        if (result.success) {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'uploadFotoKegiatan',
                    rowIndex: rowIndex,
                    fotoUrl: result.url
                })
            });
            
            showToast('Foto terupload!', 'success');
            loadKegiatan();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal upload: ' + (error.error || error.message), 'error');
    }
    event.target.value = '';
}

// HAPUS FOTO KEGIATAN DENGAN SWEETALERT
async function deleteKegiatanImage(kegiatanId, imgIndex) {
    const result = await Swal.fire({
        title: 'Hapus Foto?',
        text: 'Apakah Anda yakin ingin menghapus foto ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-trash"></i> Ya, Hapus',
        cancelButtonText: '<i class="fas fa-times"></i> Batal'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'hapusFotoKegiatan',
                kegiatanId: kegiatanId,
                imgIndex: imgIndex
            })
        });
        showToast('Foto dihapus', 'success');
        loadKegiatan();
    } catch (error) {
        showToast('Gagal hapus', 'error');
    }
}

async function saveKegiatan(kegiatanId, rowIndex) {
    const data = {
        action: 'updateKegiatan',
        rowIndex: rowIndex,
        title: document.getElementById(`k_title_${kegiatanId}`).value,
        deskripsi: document.getElementById(`k_deskripsi_${kegiatanId}`).value
    };
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        });
        showToast('Data tersimpan', 'success');
        loadKegiatan();
    } catch (error) {
        showToast('Gagal menyimpan', 'error');
    }
}

// ============= ASPIRASI =============
async function loadAspirasi() {
    const container = document.getElementById('aspirasiGrid');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Memuat aspirasi...</div>';
    
    try {
        const response = await fetch(API_URL + '?action=getAspirasi');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            let html = '';
            for (const a of result.data) {
                const statusClass = a.status === 'Belum Dibaca' ? 'status-belum' : (a.status === 'Sudah Dibaca' ? 'status-dibaca' : 'status-tindak');
                html += `
                    <div class="aspirasi-card">
                        <div class="aspirasi-header">
                            <div>
                                <span class="aspirasi-nama"><i class="fas fa-user"></i> ${escapeHtml(a.nama)}</span>
                                <span class="aspirasi-nim">(${escapeHtml(a.nim)})</span>
                                <div class="aspirasi-tanggal"><i class="far fa-calendar-alt"></i> ${escapeHtml(a.timestamp)}</div>
                            </div>
                            <span class="status-badge ${statusClass}">${escapeHtml(a.status)}</span>
                        </div>
                        <div class="aspirasi-kategori"><i class="fas fa-tag"></i> ${escapeHtml(a.kategori)}</div>
                        <div class="aspirasi-pesan">${escapeHtml(a.pesan)}</div>
                        <div class="aspirasi-actions">
                            <button class="btn-status read" onclick="updateStatusAspirasi(${a.rowIndex}, 'Sudah Dibaca')">
                                <i class="fas fa-check-circle"></i> Tandai Dibaca
                            </button>
                            <button class="btn-status followup" onclick="updateStatusAspirasi(${a.rowIndex}, 'Dalam Tindak Lanjut')">
                                <i class="fas fa-clipboard-list"></i> Tindak Lanjut
                            </button>
                        </div>
                    </div>
                `;
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comment-dots" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i><p>Belum ada aspirasi yang masuk</p></div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> Gagal memuat aspirasi</div>';
    }
}

async function updateStatusAspirasi(rowIndex, statusBaru) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'updateStatusAspirasi',
                rowIndex: rowIndex,
                status: statusBaru
            })
        });
        showToast('Status diperbarui', 'success');
        loadAspirasi();
    } catch (error) {
        showToast('Gagal update', 'error');
    }
}

// ============= BERKAS =============
async function loadBerkasList() {
    const container = document.getElementById('berkasListContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Memuat berkas...</div>';
    
    try {
        const response = await fetch(API_URL + '?action=getBerkas');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            let html = '<table class="berkas-table"><thead><tr><th><i class="fas fa-file-alt"></i> Judul</th><th><i class="fas fa-tag"></i> Kategori</th><th><i class="far fa-calendar-alt"></i> Tanggal</th><th><i class="fas fa-cog"></i> Aksi</th></tr></thead><tbody>';
            for (const b of result.data) {
                html += `
                    <tr>
                        <td>${escapeHtml(b.judul)}</td>
                        <td><span class="badge badge-success">${escapeHtml(b.kategori)}</span></td>
                        <td>${escapeHtml(b.tanggal)}</td>
                        <td>
                            <a href="${escapeHtml(b.link)}" target="_blank" style="margin-right: 10px; color: var(--primary);">
                                <i class="fas fa-download"></i>
                            </a>
                            <button class="btn-delete-berkas" onclick="hapusBerkas('${b.fileId}', ${b.rowIndex})">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </td>
                    </tr>
                `;
            }
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i><p>Belum ada berkas. Upload berkas pertama di atas.</p></div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> Gagal memuat berkas</div>';
    }
}

async function uploadBerkasBaru() {
    const judul = document.getElementById('berkasJudul').value.trim();
    const kategori = document.getElementById('berkasKategori').value;
    const deskripsi = document.getElementById('berkasDeskripsi').value.trim();
    const fileInput = document.getElementById('berkasFile');
    const file = fileInput.files[0];
    
    if (!judul) { showToast('Masukkan judul berkas', 'error'); return; }
    if (!file) { showToast('Pilih file', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('Maksimal 10MB', 'error'); return; }
    
    showToast('Mengupload...', 'success');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result.split(',')[1];
        
        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'uploadBerkas',
                    base64Data: base64,
                    namaFile: file.name,
                    judul: judul,
                    kategori: kategori,
                    deskripsi: deskripsi
                })
            });
            showToast('Berkas diupload', 'success');
            document.getElementById('berkasJudul').value = '';
            document.getElementById('berkasDeskripsi').value = '';
            fileInput.value = '';
            loadBerkasList();
        } catch (error) {
            showToast('Gagal upload', 'error');
        }
    };
    reader.readAsDataURL(file);
}

// HAPUS BERKAS DENGAN SWEETALERT
async function hapusBerkas(fileId, rowIndex) {
    const result = await Swal.fire({
        title: 'Hapus Berkas?',
        text: 'Apakah Anda yakin ingin menghapus berkas ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-trash"></i> Ya, Hapus',
        cancelButtonText: '<i class="fas fa-times"></i> Batal'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'hapusBerkas',
                fileId: fileId,
                rowIndex: rowIndex
            })
        });
        showToast('Berkas dihapus', 'success');
        loadBerkasList();
    } catch (error) {
        showToast('Gagal hapus', 'error');
    }
}

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', function() {
    loadAnggota();
});