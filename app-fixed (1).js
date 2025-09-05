// Alarm Clock App - Fixed JavaScript File

class AlarmClockApp {
    constructor() {
        this.alarms = [];
        this.settings = {
            theme: 'light',
            enableRotation: true,
            gradualWakeup: true,
            defaultSnooze: 5,
            defaultVolume: 0.8
        };
        this.currentAlarm = null;
        this.snoozeTimeout = null;
        this.alarmCheckInterval = null;
        this.currentAudio = null;
        this.editingAlarmId = null;
        this.rotationSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 2)); // Changes every 2 days
        
        // Default alarm sounds
        this.alarmSounds = [
            {name: "Classic Beep", file: "classic-beep.mp3", duration: "0:05"},
            {name: "Gentle Chimes", file: "gentle-chimes.mp3", duration: "0:08"},
            {name: "Digital Bell", file: "digital-bell.mp3", duration: "0:06"},
            {name: "Morning Birds", file: "morning-birds.mp3", duration: "0:12"},
            {name: "Soft Piano", file: "soft-piano.mp3", duration: "0:10"},
            {name: "Ocean Waves", file: "ocean-waves.mp3", duration: "0:15"},
            {name: "Forest Dawn", file: "forest-dawn.mp3", duration: "0:14"},
            {name: "Electronic Pulse", file: "electronic-pulse.mp3", duration: "0:07"},
            {name: "Zen Bell", file: "zen-bell.mp3", duration: "0:09"},
            {name: "Rooster Call", file: "rooster-call.mp3", duration: "0:11"}
        ];

        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateTime();
        this.updateRotationDisplay();
        this.renderAlarms();
        this.startAlarmCheck();
        
        // Initialize theme
        this.applyTheme();
        
        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Add alarm button
        const addAlarmBtn = document.getElementById('addAlarmBtn');
        if (addAlarmBtn) {
            addAlarmBtn.addEventListener('click', () => this.showAlarmModal());
        }

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Preview sound button
        const previewSound = document.getElementById('previewSound');
        if (previewSound) {
            previewSound.addEventListener('click', () => this.previewCurrentSound());
        }

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModals();
            }
            if (e.target.classList.contains('modal-close')) {
                this.closeModals();
            }
        });

        // Alarm form submission
        const alarmForm = document.getElementById('alarmForm');
        if (alarmForm) {
            alarmForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAlarm();
            });
        }

        // Alarm notification buttons
        const stopAlarmBtn = document.getElementById('stopAlarm');
        const snoozeAlarmBtn = document.getElementById('snoozeAlarm');
        
        if (stopAlarmBtn) {
            stopAlarmBtn.addEventListener('click', () => this.stopAlarm());
        }
        
        if (snoozeAlarmBtn) {
            snoozeAlarmBtn.addEventListener('click', () => this.snoozeAlarm());
        }
    }

    showAlarmModal() {
        this.editingAlarmId = null;
        this.resetAlarmForm();
        
        const modal = document.getElementById('alarmModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('modal-show');
        }
    }

    resetAlarmForm() {
        // Reset all form fields to defaults
        const timeInput = document.getElementById('alarmTime');
        const labelInput = document.getElementById('alarmLabel');
        const soundSelect = document.getElementById('alarmSound');
        const volumeInput = document.getElementById('alarmVolume');
        const snoozeInput = document.getElementById('alarmSnooze');
        
        if (timeInput) timeInput.value = '07:00';
        if (labelInput) labelInput.value = '';
        if (soundSelect) soundSelect.value = 'rotating';
        if (volumeInput) volumeInput.value = this.settings.defaultVolume;
        if (snoozeInput) snoozeInput.value = this.settings.defaultSnooze;
        
        // Reset day checkboxes
        const dayCheckboxes = document.querySelectorAll('input[name="alarmDays"]');
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Check Monday by default
        const mondayCheckbox = document.querySelector('input[name="alarmDays"][value="mon"]');
        if (mondayCheckbox) {
            mondayCheckbox.checked = true;
        }
        
        // Update modal title
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Add New Alarm';
        }
    }

    saveAlarm() {
        // Get form values
        const timeInput = document.getElementById('alarmTime');
        const labelInput = document.getElementById('alarmLabel');
        const soundSelect = document.getElementById('alarmSound');
        const volumeInput = document.getElementById('alarmVolume');
        const snoozeInput = document.getElementById('alarmSnooze');
        
        // Validate required fields
        if (!timeInput || !timeInput.value) {
            alert('Please set an alarm time');
            return;
        }
        
        // Get selected days
        const selectedDays = [];
        const dayCheckboxes = document.querySelectorAll('input[name="alarmDays"]:checked');
        dayCheckboxes.forEach(checkbox => {
            selectedDays.push(checkbox.value);
        });
        
        if (selectedDays.length === 0) {
            alert('Please select at least one day');
            return;
        }
        
        // Create alarm object
        const alarmData = {
            id: this.editingAlarmId || 'alarm_' + Date.now(),
            time: timeInput.value,
            label: labelInput ? labelInput.value || 'Alarm' : 'Alarm',
            days: selectedDays,
            sound: soundSelect ? soundSelect.value : 'rotating',
            volume: volumeInput ? parseFloat(volumeInput.value) : this.settings.defaultVolume,
            snooze: snoozeInput ? parseInt(snoozeInput.value) : this.settings.defaultSnooze,
            enabled: true
        };
        
        // Add or update alarm
        if (this.editingAlarmId) {
            const index = this.alarms.findIndex(a => a.id === this.editingAlarmId);
            if (index !== -1) {
                this.alarms[index] = alarmData;
            }
        } else {
            this.alarms.push(alarmData);
        }
        
        this.saveData();
        this.renderAlarms();
        this.closeModals();
        this.updateNextAlarmDisplay();
    }

    editAlarm(alarmId) {
        const alarm = this.alarms.find(a => a.id === alarmId);
        if (!alarm) return;
        
        this.editingAlarmId = alarmId;
        
        // Populate form with alarm data
        const timeInput = document.getElementById('alarmTime');
        const labelInput = document.getElementById('alarmLabel');
        const soundSelect = document.getElementById('alarmSound');
        const volumeInput = document.getElementById('alarmVolume');
        const snoozeInput = document.getElementById('alarmSnooze');
        
        if (timeInput) timeInput.value = alarm.time;
        if (labelInput) labelInput.value = alarm.label;
        if (soundSelect) soundSelect.value = alarm.sound;
        if (volumeInput) volumeInput.value = alarm.volume;
        if (snoozeInput) snoozeInput.value = alarm.snooze;
        
        // Set day checkboxes
        const dayCheckboxes = document.querySelectorAll('input[name="alarmDays"]');
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = alarm.days.includes(checkbox.value);
        });
        
        // Update modal title
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Alarm';
        }
        
        // Show modal
        const modal = document.getElementById('alarmModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('modal-show');
        }
    }

    deleteAlarm(alarmId) {
        if (confirm('Are you sure you want to delete this alarm?')) {
            this.alarms = this.alarms.filter(a => a.id !== alarmId);
            this.saveData();
            this.renderAlarms();
            this.updateNextAlarmDisplay();
        }
    }

    toggleAlarm(alarmId) {
        const alarm = this.alarms.find(a => a.id === alarmId);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            this.saveData();
            this.renderAlarms();
            this.updateNextAlarmDisplay();
        }
    }

    renderAlarms() {
        const alarmsList = document.getElementById('alarmsList');
        if (!alarmsList) return;
        
        if (this.alarms.length === 0) {
            alarmsList.innerHTML = `
                <div class="no-alarms">
                    <div class="no-alarms-icon">⏰</div>
                    <div class="no-alarms-text">No alarms set</div>
                    <div class="no-alarms-subtext">Tap the + button to add your first alarm</div>
                </div>
            `;
            return;
        }
        
        const alarmsHTML = this.alarms.map(alarm => {
            const daysText = this.formatDays(alarm.days);
            const soundName = alarm.sound === 'rotating' ? 'Rotating Sound' : 
                             this.alarmSounds.find(s => s.file === alarm.sound)?.name || alarm.sound;
            
            return `
                <div class="alarm-card ${alarm.enabled ? 'enabled' : 'disabled'}">
                    <div class="alarm-main">
                        <div class="alarm-time">${this.formatTime(alarm.time)}</div>
                        <div class="alarm-info">
                            <div class="alarm-label">${alarm.label}</div>
                            <div class="alarm-schedule">${daysText}</div>
                            <div class="alarm-sound">${soundName}</div>
                        </div>
                        <div class="alarm-controls">
                            <label class="alarm-toggle">
                                <input type="checkbox" ${alarm.enabled ? 'checked' : ''} 
                                       onchange="app.toggleAlarm('${alarm.id}')">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="alarm-actions">
                        <button class="btn btn--sm btn--outline" onclick="app.editAlarm('${alarm.id}')">
                            Edit
                        </button>
                        <button class="btn btn--sm btn--danger" onclick="app.deleteAlarm('${alarm.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        alarmsList.innerHTML = alarmsHTML;
    }

    formatTime(time24) {
        const [hours, minutes] = time24.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }

    formatDays(days) {
        const dayNames = {
            'mon': 'Mon', 'tue': 'Tue', 'wed': 'Wed', 'thu': 'Thu',
            'fri': 'Fri', 'sat': 'Sat', 'sun': 'Sun'
        };
        
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && !days.includes('sat') && !days.includes('sun')) return 'Weekdays';
        if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'Weekends';
        
        return days.map(day => dayNames[day]).join(', ');
    }

    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const currentTimeEl = document.getElementById('currentTime');
        const currentDateEl = document.getElementById('currentDate');
        
        if (currentTimeEl) currentTimeEl.textContent = timeStr;
        if (currentDateEl) currentDateEl.textContent = dateStr;
        
        // Update every second
        setTimeout(() => this.updateTime(), 1000);
    }

    updateNextAlarmDisplay() {
        const nextAlarmEl = document.getElementById('nextAlarm');
        if (!nextAlarmEl) return;
        
        const nextAlarm = this.getNextAlarm();
        if (nextAlarm) {
            const timeUntil = this.getTimeUntilAlarm(nextAlarm);
            nextAlarmEl.textContent = `Next alarm in ${timeUntil}`;
            nextAlarmEl.style.display = 'block';
        } else {
            nextAlarmEl.style.display = 'none';
        }
    }

    getNextAlarm() {
        const enabledAlarms = this.alarms.filter(a => a.enabled);
        if (enabledAlarms.length === 0) return null;
        
        const now = new Date();
        const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        let nextAlarm = null;
        let minTimeUntil = Infinity;
        
        enabledAlarms.forEach(alarm => {
            const [hours, minutes] = alarm.time.split(':').map(Number);
            const alarmTime = hours * 60 + minutes;
            
            alarm.days.forEach(day => {
                let daysUntil = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day) - 
                               ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(currentDay) + 7) % 7;
                
                if (daysUntil === 0 && alarmTime <= currentTime) {
                    daysUntil = 7; // Next week
                }
                
                const timeUntil = daysUntil * 24 * 60 + (alarmTime - currentTime);
                
                if (timeUntil < minTimeUntil) {
                    minTimeUntil = timeUntil;
                    nextAlarm = alarm;
                }
            });
        });
        
        return nextAlarm;
    }

    getTimeUntilAlarm(alarm) {
        const now = new Date();
        const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [hours, minutes] = alarm.time.split(':').map(Number);
        const alarmTime = hours * 60 + minutes;
        
        let minTimeUntil = Infinity;
        
        alarm.days.forEach(day => {
            let daysUntil = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day) - 
                           ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(currentDay) + 7) % 7;
            
            if (daysUntil === 0 && alarmTime <= currentTime) {
                daysUntil = 7;
            }
            
            const timeUntil = daysUntil * 24 * 60 + (alarmTime - currentTime);
            minTimeUntil = Math.min(minTimeUntil, timeUntil);
        });
        
        const hours = Math.floor(minTimeUntil / 60);
        const mins = minTimeUntil % 60;
        
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days}d ${remainingHours}h ${mins}m`;
        } else {
            return `${hours}h ${mins}m`;
        }
    }

    updateRotationDisplay() {
        const currentSound = this.getCurrentRotationSound();
        const rotationSoundEl = document.getElementById('currentRotationSound');
        const rotationTimerEl = document.getElementById('rotationTimer');
        
        if (rotationSoundEl) {
            rotationSoundEl.textContent = currentSound.name;
        }
        
        if (rotationTimerEl) {
            const nextRotation = this.getTimeUntilNextRotation();
            rotationTimerEl.textContent = `Changes in ${nextRotation}`;
        }
    }

    getCurrentRotationSound() {
        const soundIndex = this.rotationSeed % this.alarmSounds.length;
        return this.alarmSounds[soundIndex];
    }

    getTimeUntilNextRotation() {
        const now = Date.now();
        const rotationInterval = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
        const nextRotationTime = (this.rotationSeed + 1) * rotationInterval;
        const timeUntil = nextRotationTime - now;
        
        const days = Math.floor(timeUntil / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeUntil % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else {
            return `${hours}h`;
        }
    }

    previewCurrentSound() {
        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        const currentSound = this.getCurrentRotationSound();
        // Use a beep sound as fallback since we don't have actual sound files
        this.playBeep();
        
        // Show feedback
        const previewBtn = document.getElementById('previewSound');
        if (previewBtn) {
            const originalText = previewBtn.textContent;
            previewBtn.textContent = 'Playing...';
            setTimeout(() => {
                previewBtn.textContent = originalText;
            }, 2000);
        }
    }

    playBeep() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    startAlarmCheck() {
        // Check for alarms every 30 seconds
        this.alarmCheckInterval = setInterval(() => {
            this.checkAlarms();
        }, 30000);
        
        // Also check immediately
        this.checkAlarms();
    }

    checkAlarms() {
        const now = new Date();
        const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        this.alarms.forEach(alarm => {
            if (alarm.enabled && alarm.days.includes(currentDay) && alarm.time === currentTime) {
                this.triggerAlarm(alarm);
            }
        });
        
        this.updateNextAlarmDisplay();
    }

    triggerAlarm(alarm) {
        this.currentAlarm = alarm;
        
        // Show alarm notification
        const alarmNotification = document.getElementById('alarmNotification');
        if (alarmNotification) {
            alarmNotification.style.display = 'flex';
            alarmNotification.classList.add('alarm-active');
        }
        
        // Update notification content
        const alarmTimeEl = document.getElementById('alarmNotificationTime');
        const alarmLabelEl = document.getElementById('alarmNotificationLabel');
        
        if (alarmTimeEl) alarmTimeEl.textContent = this.formatTime(alarm.time);
        if (alarmLabelEl) alarmLabelEl.textContent = alarm.label;
        
        // Play alarm sound
        this.playAlarmSound(alarm);
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Alarm: ${alarm.label}`, {
                body: `Time: ${this.formatTime(alarm.time)}`,
                icon: '/icon-192.png'
            });
        }
        
        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    }

    playAlarmSound(alarm) {
        // Use beep sound as fallback
        this.playBeep();
        
        // Continue playing every 3 seconds
        this.alarmSoundInterval = setInterval(() => {
            this.playBeep();
        }, 3000);
    }

    stopAlarm() {
        this.currentAlarm = null;
        
        // Hide notification
        const alarmNotification = document.getElementById('alarmNotification');
        if (alarmNotification) {
            alarmNotification.style.display = 'none';
            alarmNotification.classList.remove('alarm-active');
        }
        
        // Stop sound
        if (this.alarmSoundInterval) {
            clearInterval(this.alarmSoundInterval);
            this.alarmSoundInterval = null;
        }
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }

    snoozeAlarm() {
        if (!this.currentAlarm) return;
        
        const snoozeMinutes = this.currentAlarm.snooze || 5;
        
        // Stop current alarm
        this.stopAlarm();
        
        // Set snooze timeout
        this.snoozeTimeout = setTimeout(() => {
            this.triggerAlarm(this.currentAlarm);
        }, snoozeMinutes * 60 * 1000);
        
        // Show snooze feedback
        alert(`Alarm snoozed for ${snoozeMinutes} minutes`);
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveData();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = this.settings.theme === 'light' ? '🌙' : '☀️';
            }
        }
    }

    showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
            settingsModal.classList.add('modal-show');
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('modal-show');
        });
    }

    loadData() {
        try {
            const savedAlarms = localStorage.getItem('alarmClockAlarms');
            const savedSettings = localStorage.getItem('alarmClockSettings');
            
            if (savedAlarms) {
                this.alarms = JSON.parse(savedAlarms);
            }
            
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (e) {
            console.log('Error loading data:', e);
        }
    }

    saveData() {
        try {
            localStorage.setItem('alarmClockAlarms', JSON.stringify(this.alarms));
            localStorage.setItem('alarmClockSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.log('Error saving data:', e);
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new AlarmClockApp();
});