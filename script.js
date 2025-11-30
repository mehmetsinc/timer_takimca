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
function setBackground(wall) {
    const container = document.querySelector('.container');
    
    if (wall === 'dots') {
        container.classList.add('dots-pattern');
        container.style.backgroundImage = 'none';
    } else if (wall.startsWith('http://') || wall.startsWith('https://')) {
        container.style.backgroundImage = `url('${wall}')`;
        container.classList.remove('dots-pattern');
    } else {
        // Assume it's a relative path or filename
        container.style.backgroundImage = `url('${wall}')`;
        container.classList.remove('dots-pattern');
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

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update timer display
function updateTimer() {
    const params = getQueryParams();
    const timerConfig = parseTimer(params.timer);
    const timeDisplay = document.getElementById('timeDisplay');
    const messageDisplay = document.getElementById('messageDisplay');
    
    // Set message
    messageDisplay.textContent = decodeURIComponent(params.msg);
    
    // Set background
    setBackground(params.wall);
    
    // Timer update function
    function tick() {
        const now = new Date();
        const diff = Math.max(0, Math.floor((timerConfig.endTime - now) / 1000));
        
        if (diff === 0) {
            timeDisplay.textContent = '00:00';
            timeDisplay.classList.add('timer-ended');
            return;
        }
        
        timeDisplay.textContent = formatTime(diff);
        timeDisplay.classList.remove('timer-ended');
    }
    
    // Initial update
    tick();
    
    // Update every second
    setInterval(tick, 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', updateTimer);

