// Parse URL query parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        timer: params.get('timer') || '00',
        wall: params.get('wall') || 'dots',
        msg: params.get('msg') || 'Timer'
    };
}

// Set background based on wall parameter
async function setBackground(wall) {
    const container = document.querySelector('.container');
    
    // Remove all pattern classes
    container.classList.remove('dots-pattern', 'boxes-pattern');
    
    if (wall === 'dots') {
        container.classList.add('dots-pattern');
        container.style.backgroundImage = 'none';
    } else if (wall === 'boxes') {
        container.classList.add('boxes-pattern');
        container.style.backgroundImage = 'none';
    } else if (wall.startsWith('img_')) {
        // Load from localStorage
        const imageId = wall.replace('img_', '');
        const images = ImageStorage.getAll();
        const image = images.find(img => img.id === imageId);
        if (image) {
            container.style.backgroundImage = `url('${image.data}')`;
        }
    } else if (wall.startsWith('http://') || wall.startsWith('https://')) {
        // Try to load from cache first, if not save it
        try {
            const images = ImageStorage.getAll();
            const cached = images.find(img => img.url === wall);
            if (cached) {
                container.style.backgroundImage = `url('${cached.data}')`;
            } else {
                container.style.backgroundImage = `url('${wall}')`;
                // Save in background
                ImageStorage.saveFromUrl(wall).catch(() => {
                    // Silently fail if save doesn't work
                });
            }
        } catch (e) {
            container.style.backgroundImage = `url('${wall}')`;
        }
    } else {
        // Assume it's a relative path or filename
        container.style.backgroundImage = `url('${wall}')`;
    }
}

// Parse timer value and determine if it's minutes or end time
function parseTimer(timerValue) {
    // Check if it's in HH:MM format (end time)
    if (timerValue.includes(':')) {
        const [hours, minutes] = timerValue.split(':').map(Number);
        const now = new Date();
        const endTime = new Date();
        endTime.setHours(hours, minutes, 0, 0);
        
        // If end time is earlier than now, assume it's tomorrow
        if (endTime < now) {
            endTime.setDate(endTime.getDate() + 1);
        }
        
        return {
            type: 'endTime',
            endTime: endTime
        };
    } else {
        // Assume it's minutes
        const minutes = parseInt(timerValue, 10) || 0;
        const endTime = new Date();
        endTime.setMinutes(endTime.getMinutes() + minutes);
        
        return {
            type: 'minutes',
            endTime: endTime
        };
    }
}

// Format time as MM:SS with better visual formatting
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Image storage management
const ImageStorage = {
    STORAGE_KEY: 'timer_background_images',
    
    getAll() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading images:', e);
            return [];
        }
    },
    
    save(images) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(images));
        } catch (e) {
            console.error('Error saving images:', e);
            // If storage is full, try to remove oldest images
            if (e.name === 'QuotaExceededError') {
                const all = this.getAll();
                const reduced = all.slice(-10); // Keep only last 10
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reduced));
            }
        }
    },
    
    add(imageData) {
        const images = this.getAll();
        const id = Date.now().toString();
        images.push({ id, data: imageData, timestamp: Date.now() });
        this.save(images);
        return id;
    },
    
    remove(id) {
        const images = this.getAll();
        const filtered = images.filter(img => img.id !== id);
        this.save(filtered);
    },
    
    async saveFromUrl(url) {
        try {
            // Check if already saved
            const images = this.getAll();
            const existing = images.find(img => img.url === url);
            if (existing) {
                return existing.id;
            }
            
            // Fetch and convert to base64
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            
            return new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    const base64 = reader.result;
                    const images = this.getAll();
                    const id = Date.now().toString();
                    images.push({ id, data: base64, url, timestamp: Date.now() });
                    this.save(images);
                    resolve(id);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error('Error saving image from URL:', e);
            throw e;
        }
    }
};

// Update timer display
function updateTimer() {
    const params = getQueryParams();
    const timerConfig = parseTimer(params.timer);
    const timeDisplay = document.getElementById('timeDisplay');
    const messageDisplay = document.getElementById('messageDisplay');
    
    // Set message
    messageDisplay.textContent = decodeURIComponent(params.msg);
    
    // Set background
    setBackground(params.wall).catch(() => {
        // Silently handle errors
    });
    
    // Timer update function
    function tick() {
        const now = new Date();
        const diff = Math.max(0, Math.floor((timerConfig.endTime - now) / 1000));
        
        if (diff === 0) {
            timeDisplay.textContent = '00:00';
            timeDisplay.setAttribute('data-time', '00:00');
            timeDisplay.classList.add('timer-ended');
            return;
        }
        
        const formatted = formatTime(diff);
        timeDisplay.textContent = formatted;
        timeDisplay.setAttribute('data-time', formatted);
        timeDisplay.classList.remove('timer-ended');
    }
    
    // Initial update
    tick();
    
    // Update every second
    setInterval(tick, 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateTimer();
    initModal();
});

// Modal functionality
function initModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeBtn');
    const timerTypeRadios = document.querySelectorAll('input[name="timerType"]');
    const minutesGroup = document.getElementById('minutesGroup');
    const endTimeGroup = document.getElementById('endTimeGroup');
    const backgroundSelect = document.getElementById('backgroundSelect');
    const urlGroup = document.getElementById('urlGroup');
    const uploadedGroup = document.getElementById('uploadedGroup');
    const imageGallery = document.getElementById('imageGallery');
    const imageUpload = document.getElementById('imageUpload');
    const urlInput = document.getElementById('urlInput');
    const saveUrlBtn = document.getElementById('saveUrlBtn');
    const minutesInput = document.getElementById('minutesInput');
    const endTimeInput = document.getElementById('endTimeInput');
    const messageInput = document.getElementById('messageInput');
    const fullUrlInput = document.getElementById('fullUrl');
    const copyBtn = document.getElementById('copyBtn');
    const startTimerBtn = document.getElementById('startTimerBtn');
    
    let selectedImageId = null;

    // Open modal
    settingsBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        loadCurrentSettings();
        updateUrl();
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            modalOverlay.classList.remove('active');
        }
    });

    // Timer type change
    timerTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'minutes') {
                minutesGroup.style.display = 'block';
                endTimeGroup.style.display = 'none';
            } else {
                minutesGroup.style.display = 'none';
                endTimeGroup.style.display = 'block';
            }
            updateUrl();
        });
    });

    // Background type change
    backgroundSelect.addEventListener('change', () => {
        if (backgroundSelect.value === 'url') {
            urlGroup.style.display = 'block';
            uploadedGroup.style.display = 'none';
        } else if (backgroundSelect.value === 'uploaded') {
            urlGroup.style.display = 'none';
            uploadedGroup.style.display = 'block';
            renderImageGallery();
        } else {
            urlGroup.style.display = 'none';
            uploadedGroup.style.display = 'none';
        }
        selectedImageId = null;
        updateUrl();
    });
    
    // Image upload
    imageUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    ImageStorage.add(reader.result);
                    renderImageGallery();
                };
                reader.readAsDataURL(file);
            }
        });
        e.target.value = ''; // Reset input
    });
    
    // Save URL button
    saveUrlBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            saveUrlBtn.textContent = '⏳';
            saveUrlBtn.disabled = true;
            try {
                await ImageStorage.saveFromUrl(url);
                renderImageGallery();
                backgroundSelect.value = 'uploaded';
                urlGroup.style.display = 'none';
                uploadedGroup.style.display = 'block';
                urlInput.value = '';
                alert('Image saved successfully!');
            } catch (e) {
                alert('Error saving image. Please check the URL.');
            } finally {
                saveUrlBtn.textContent = '💾';
                saveUrlBtn.disabled = false;
            }
        }
    });
    
    // Render image gallery
    function renderImageGallery() {
        const images = ImageStorage.getAll();
        imageGallery.innerHTML = '';
        
        if (images.length === 0) {
            imageGallery.innerHTML = '<div class="image-item empty">No images uploaded</div>';
            return;
        }
        
        images.forEach(image => {
            const item = document.createElement('div');
            item.className = 'image-item';
            if (selectedImageId === image.id) {
                item.classList.add('selected');
            }
            
            const img = document.createElement('img');
            img.src = image.data;
            img.alt = 'Background';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Delete this image?')) {
                    ImageStorage.remove(image.id);
                    if (selectedImageId === image.id) {
                        selectedImageId = null;
                    }
                    renderImageGallery();
                    updateUrl();
                }
            };
            
            item.appendChild(img);
            item.appendChild(deleteBtn);
            item.onclick = () => {
                selectedImageId = image.id;
                renderImageGallery();
                updateUrl();
            };
            
            imageGallery.appendChild(item);
        });
    }

    // Input changes
    minutesInput.addEventListener('input', updateUrl);
    endTimeInput.addEventListener('input', updateUrl);
    urlInput.addEventListener('input', updateUrl);
    messageInput.addEventListener('input', updateUrl);

    // Copy URL
    copyBtn.addEventListener('click', () => {
        fullUrlInput.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓';
        copyBtn.style.background = '#4caf50';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 1000);
    });

    // Start Timer
    startTimerBtn.addEventListener('click', () => {
        const url = fullUrlInput.value;
        if (url) {
            window.location.href = url;
        }
    });

    // Update URL based on current settings
    function updateUrl() {
        const timerType = document.querySelector('input[name="timerType"]:checked').value;
        let timerValue = '';
        
        if (timerType === 'minutes') {
            timerValue = minutesInput.value || '0';
        } else {
            const timeValue = endTimeInput.value;
            if (timeValue) {
                const [hours, minutes] = timeValue.split(':');
                timerValue = `${hours}:${minutes}`;
            } else {
                timerValue = '00:00';
            }
        }

        const background = backgroundSelect.value;
        let wallValue = background;
        if (background === 'url') {
            wallValue = urlInput.value || 'dots';
        } else if (background === 'uploaded' && selectedImageId) {
            wallValue = `img_${selectedImageId}`;
        }

        const message = messageInput.value || 'Timer';
        const baseUrl = window.location.origin + window.location.pathname;
        const url = `${baseUrl}?timer=${encodeURIComponent(timerValue)}&wall=${encodeURIComponent(wallValue)}&msg=${encodeURIComponent(message)}`;
        
        fullUrlInput.value = url;
    }

    // Load current URL parameters into modal
    function loadCurrentSettings() {
        const params = getQueryParams();
        
        // Set timer type and value
        if (params.timer.includes(':')) {
            document.querySelector('input[name="timerType"][value="endTime"]').checked = true;
            endTimeGroup.style.display = 'block';
            minutesGroup.style.display = 'none';
            const [hours, minutes] = params.timer.split(':');
            endTimeInput.value = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        } else {
            document.querySelector('input[name="timerType"][value="minutes"]').checked = true;
            minutesGroup.style.display = 'block';
            endTimeGroup.style.display = 'none';
            minutesInput.value = params.timer || '0';
        }

        // Set background
        if (params.wall === 'dots') {
            backgroundSelect.value = 'dots';
            urlGroup.style.display = 'none';
            uploadedGroup.style.display = 'none';
        } else if (params.wall === 'boxes') {
            backgroundSelect.value = 'boxes';
            urlGroup.style.display = 'none';
            uploadedGroup.style.display = 'none';
        } else if (params.wall && params.wall.startsWith('img_')) {
            backgroundSelect.value = 'uploaded';
            urlGroup.style.display = 'none';
            uploadedGroup.style.display = 'block';
            selectedImageId = params.wall.replace('img_', '');
            renderImageGallery();
        } else if (params.wall) {
            backgroundSelect.value = 'url';
            urlGroup.style.display = 'block';
            uploadedGroup.style.display = 'none';
            urlInput.value = params.wall;
        } else {
            backgroundSelect.value = 'dots';
            urlGroup.style.display = 'none';
            uploadedGroup.style.display = 'none';
        }

        // Set message
        messageInput.value = decodeURIComponent(params.msg);
        
        updateUrl();
    }
}

