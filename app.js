// Alarm Clock App - Main JavaScript File

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

        // Initialize sample alarms
        this.alarms = [
            {
                id: "alarm1",
                time: "07:00",
                days: ["mon", "tue", "wed", "thu", "fri"],
                label: "Work Alarm",
                sound: "rotating",
                enabled: true,
                snooze: 5,
                volume: 0.8
            },
            {
                id: "alarm2", 
                time: "09:00",
                days: ["sat", "sun"],
                label: "Weekend Wake-up",
                sound: "rotating", 
                enabled: false,
                snooze: 10,
                volume: 0.6
            }
        ];
    }

    init() {
        this.bindEvents();
        this.updateTime();
        this.updateRotationDisplay();
        this.renderAlarms();
        this.startTimeUpdate();
        this.startAlarmCheck();
        this.applyTheme();
    }

    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
        
        // Settings
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSettings();
            });
        }
        
        const settingsModalClose = document.getElementById('settingsModalClose');
        if (settingsModalClose) {
            settingsModalClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSettings();
            });
        }
        
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
        
        // Add alarm FAB
        const addAlarmBtn = document.getElementById('addAlarmBtn');
        if (addAlarmBtn) {
            addAlarmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAlarmModal();
            });
        }
        
        // Modal controls
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAlarmModal();
            });
        }
        
        const modalBackdrop = document.getElementById('modalBackdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    this.closeAlarmModal();
                }
            });
        }
        
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAlarmModal();
            });
        }
        
        const saveAlarmBtn = document.getElementById('saveAlarmBtn');
        if (saveAlarmBtn) {
            saveAlarmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveAlarm();
            });
        }
        
        const deleteAlarmBtn = document.getElementById('deleteAlarmBtn');
        if (deleteAlarmBtn) {
            deleteAlarmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteAlarm();
            });
        }
        
        // Time inputs
        const hourInput = document.getElementById('hourInput');
        if (hourInput) {
            hourInput.addEventListener('input', (e) => this.validateTimeInput(e.target, 1, 12));
        }
        
        const minuteInput = document.getElementById('minuteInput');
        if (minuteInput) {
            minuteInput.addEventListener('input', (e) => this.validateTimeInput(e.target, 0, 59));
        }
        
        // Days selector
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDay(e.target);
            });
        });
        
        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volumeValue = document.getElementById('volumeValue');
                if (volumeValue) {
                    volumeValue.textContent = e.target.value + '%';
                }
            });
        }
        
        // Preview sound
        const previewSound = document.getElementById('previewSound');
        if (previewSound) {
            previewSound.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewCurrentRotationSound();
            });
        }
        
        // Alarm notification controls
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stopAlarm();
            });
        }
        
        const snoozeBtn = document.getElementById('snoozeBtn');
        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.snoozeAlarm();
            });
        }
    }

    // Time Management
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const currentTimeEl = document.getElementById('currentTime');
        const currentDateEl = document.getElementById('currentDate');
        
        if (currentTimeEl) currentTimeEl.textContent = timeString;
        if (currentDateEl) currentDateEl.textContent = dateString;
        
        this.updateNextAlarmDisplay();
    }

    startTimeUpdate() {
        setInterval(() => this.updateTime(), 1000);
    }

    updateNextAlarmDisplay() {
        const nextAlarm = this.getNextAlarm();
        const nextAlarmEl = document.getElementById('nextAlarm');
        
        if (nextAlarmEl) {
            if (nextAlarm) {
                const timeUntil = this.getTimeUntilAlarm(nextAlarm);
                nextAlarmEl.textContent = `Next alarm in ${timeUntil}`;
                nextAlarmEl.style.display = 'inline-block';
            } else {
                nextAlarmEl.style.display = 'none';
            }
        }
    }

    getNextAlarm() {
        const now = new Date();
        const enabledAlarms = this.alarms.filter(alarm => alarm.enabled);
        
        if (enabledAlarms.length === 0) return null;
        
        let nextAlarm = null;
        let shortestTime = Infinity;
        
        enabledAlarms.forEach(alarm => {
            const alarmTime = this.getNextAlarmTime(alarm, now);
            if (alarmTime && alarmTime.getTime() - now.getTime() < shortestTime) {
                shortestTime = alarmTime.getTime() - now.getTime();
                nextAlarm = alarm;
            }
        });
        
        return nextAlarm;
    }

    getNextAlarmTime(alarm, now) {
        const [hours, minutes] = alarm.time.split(':').map(Number);
        const currentDay = now.getDay();
        const dayMap = {
            sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
        };
        
        // Check if alarm should ring today
        const todayName = Object.keys(dayMap).find(key => dayMap[key] === currentDay);
        if (alarm.days.includes(todayName)) {
            const alarmToday = new Date(now);
            alarmToday.setHours(hours, minutes, 0, 0);
            
            if (alarmToday > now) {
                return alarmToday;
            }
        }
        
        // Find next day when alarm should ring
        for (let i = 1; i <= 7; i++) {
            const futureDay = (currentDay + i) % 7;
            const futureDayName = Object.keys(dayMap).find(key => dayMap[key] === futureDay);
            
            if (alarm.days.includes(futureDayName)) {
                const alarmFuture = new Date(now);
                alarmFuture.setDate(now.getDate() + i);
                alarmFuture.setHours(hours, minutes, 0, 0);
                return alarmFuture;
            }
        }
        
        return null;
    }

    getTimeUntilAlarm(alarm) {
        const now = new Date();
        const alarmTime = this.getNextAlarmTime(alarm, now);
        
        if (!alarmTime) return 'Never';
        
        const diff = alarmTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Rotation System
    getCurrentRotationSound() {
        const soundIndex = this.rotationSeed % this.alarmSounds.length;
        return this.alarmSounds[soundIndex];
    }

    updateRotationDisplay() {
        const currentSound = this.getCurrentRotationSound();
        const currentRotationSoundEl = document.getElementById('currentRotationSound');
        if (currentRotationSoundEl) {
            currentRotationSoundEl.textContent = currentSound.name;
        }
        
        // Calculate time until next rotation
        const now = new Date();
        const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const daysUntilNextRotation = 2 - (daysSinceEpoch % 2);
        const msUntilMidnight = (24 * 60 * 60 * 1000) - (now.getTime() % (24 * 60 * 60 * 1000));
        
        let timeUntilRotation;
        if (daysUntilNextRotation === 2) {
            timeUntilRotation = '1 day';
        } else {
            const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
            timeUntilRotation = `${hoursUntilMidnight}h`;
        }
        
        const rotationTimerEl = document.getElementById('rotationTimer');
        if (rotationTimerEl) {
            rotationTimerEl.textContent = `Changes in ${timeUntilRotation}`;
        }
    }

    previewCurrentRotationSound() {
        const currentSound = this.getCurrentRotationSound();
        this.playAlarmSound(currentSound.file, 0.5, false);
        
        // Stop the preview after 2 seconds
        setTimeout(() => {
            if (this.currentAudio) {
                this.currentAudio.stop();
                this.currentAudio = null;
            }
        }, 2000);
    }

    // Alarm Management
    renderAlarms() {
        const alarmsList = document.getElementById('alarmsList');
        const alarmsCount = document.getElementById('alarmsCount');
        
        if (!alarmsList || !alarmsCount) return;
        
        if (this.alarms.length === 0) {
            alarmsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⏰</div>
                    <p>No alarms set. Tap the + button to add your first alarm.</p>
                </div>
            `;
            alarmsCount.textContent = '0 alarms';
            return;
        }
        
        const activeCount = this.alarms.filter(alarm => alarm.enabled).length;
        alarmsCount.textContent = `${activeCount} active`;
        
        alarmsList.innerHTML = this.alarms.map(alarm => {
            const soundName = alarm.sound === 'rotating' ? '🔄 Rotating Sound' : 
                this.alarmSounds.find(s => s.file === alarm.sound)?.name || 'Unknown Sound';
            
            const daysText = alarm.days.length === 7 ? 'Every day' :
                alarm.days.length === 5 && !alarm.days.includes('sat') && !alarm.days.includes('sun') ? 'Weekdays' :
                alarm.days.length === 2 && alarm.days.includes('sat') && alarm.days.includes('sun') ? 'Weekends' :
                alarm.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
            
            const nextTime = alarm.enabled ? this.getTimeUntilAlarm(alarm) : 'Disabled';
            
            return `
                <div class="alarm-card ${!alarm.enabled ? 'disabled' : ''}" data-alarm-id="${alarm.id}">
                    <div class="alarm-header">
                        <div class="alarm-time">${this.formatTime12Hour(alarm.time)}</div>
                        <label class="alarm-toggle">
                            <input type="checkbox" ${alarm.enabled ? 'checked' : ''} 
                                   data-alarm-id="${alarm.id}" class="alarm-toggle-input">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="alarm-details">
                        <div class="alarm-info">
                            <div class="alarm-label">${alarm.label || 'Alarm'}</div>
                            <div class="alarm-days">${daysText}</div>
                            <div class="alarm-sound">${soundName}</div>
                        </div>
                        <div class="alarm-next">
                            ${nextTime}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Bind events for alarm cards and toggles
        this.bindAlarmEvents();
    }

    bindAlarmEvents() {
        // Bind click events for alarm cards (editing)
        document.querySelectorAll('.alarm-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger edit if clicking on toggle
                if (e.target.closest('.alarm-toggle')) return;
                
                const alarmId = card.dataset.alarmId;
                if (alarmId) {
                    this.editAlarm(alarmId);
                }
            });
        });
        
        // Bind toggle events
        document.querySelectorAll('.alarm-toggle-input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent card click
                const alarmId = toggle.dataset.alarmId;
                if (alarmId) {
                    this.toggleAlarm(alarmId);
                }
            });
        });
    }

    formatTime12Hour(time24) {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            this.renderAlarms();
            this.updateNextAlarmDisplay();
        }
    }

    editAlarm(id) {
        this.editingAlarmId = id;
        const alarm = this.alarms.find(a => a.id === id);
        if (!alarm) return;
        
        // Fill form with alarm data
        const [hours, minutes] = alarm.time.split(':').map(Number);
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        const hourInput = document.getElementById('hourInput');
        const minuteInput = document.getElementById('minuteInput');
        const ampmSelect = document.getElementById('ampmSelect');
        const alarmLabel = document.getElementById('alarmLabel');
        const soundSelect = document.getElementById('soundSelect');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        const snoozeSelect = document.getElementById('snoozeSelect');
        
        if (hourInput) hourInput.value = hours12;
        if (minuteInput) minuteInput.value = minutes.toString().padStart(2, '0');
        if (ampmSelect) ampmSelect.value = ampm;
        if (alarmLabel) alarmLabel.value = alarm.label || '';
        if (soundSelect) soundSelect.value = alarm.sound;
        if (volumeSlider) volumeSlider.value = Math.round(alarm.volume * 100);
        if (volumeValue) volumeValue.textContent = Math.round(alarm.volume * 100) + '%';
        if (snoozeSelect) snoozeSelect.value = alarm.snooze.toString();
        
        // Set days
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.toggle('active', alarm.days.includes(btn.dataset.day));
        });
        
        const modalTitle = document.getElementById('modalTitle');
        const deleteAlarmBtn = document.getElementById('deleteAlarmBtn');
        const alarmModal = document.getElementById('alarmModal');
        
        if (modalTitle) modalTitle.textContent = 'Edit Alarm';
        if (deleteAlarmBtn) deleteAlarmBtn.classList.remove('hidden');
        if (alarmModal) alarmModal.classList.remove('hidden');
    }

    openAlarmModal() {
        this.editingAlarmId = null;
        
        // Reset form
        const hourInput = document.getElementById('hourInput');
        const minuteInput = document.getElementById('minuteInput');
        const ampmSelect = document.getElementById('ampmSelect');
        const alarmLabel = document.getElementById('alarmLabel');
        const soundSelect = document.getElementById('soundSelect');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        const snoozeSelect = document.getElementById('snoozeSelect');
        
        if (hourInput) hourInput.value = '7';
        if (minuteInput) minuteInput.value = '00';
        if (ampmSelect) ampmSelect.value = 'AM';
        if (alarmLabel) alarmLabel.value = '';
        if (soundSelect) soundSelect.value = 'rotating';
        if (volumeSlider) volumeSlider.value = '80';
        if (volumeValue) volumeValue.textContent = '80%';
        if (snoozeSelect) snoozeSelect.value = '5';
        
        // Reset days (default to weekdays)
        document.querySelectorAll('.day-btn').forEach(btn => {
            const isWeekday = ['mon', 'tue', 'wed', 'thu', 'fri'].includes(btn.dataset.day);
            btn.classList.toggle('active', isWeekday);
        });
        
        const modalTitle = document.getElementById('modalTitle');
        const deleteAlarmBtn = document.getElementById('deleteAlarmBtn');
        const alarmModal = document.getElementById('alarmModal');
        
        if (modalTitle) modalTitle.textContent = 'Add New Alarm';
        if (deleteAlarmBtn) deleteAlarmBtn.classList.add('hidden');
        if (alarmModal) alarmModal.classList.remove('hidden');
    }

    closeAlarmModal() {
        const alarmModal = document.getElementById('alarmModal');
        if (alarmModal) {
            alarmModal.classList.add('hidden');
        }
        this.editingAlarmId = null;
    }

    saveAlarm() {
        const hourInput = document.getElementById('hourInput');
        const minuteInput = document.getElementById('minuteInput');
        const ampmSelect = document.getElementById('ampmSelect');
        const alarmLabel = document.getElementById('alarmLabel');
        const soundSelect = document.getElementById('soundSelect');
        const volumeSlider = document.getElementById('volumeSlider');
        const snoozeSelect = document.getElementById('snoozeSelect');
        
        if (!hourInput || !minuteInput || !ampmSelect) {
            alert('Please fill in all required fields.');
            return;
        }
        
        const hours12 = parseInt(hourInput.value);
        const minutes = parseInt(minuteInput.value);
        const ampm = ampmSelect.value;
        const label = alarmLabel ? alarmLabel.value : '';
        const sound = soundSelect ? soundSelect.value : 'rotating';
        const volume = volumeSlider ? parseInt(volumeSlider.value) / 100 : 0.8;
        const snooze = snoozeSelect ? parseInt(snoozeSelect.value) : 5;
        
        // Convert to 24-hour format
        let hours24 = hours12;
        if (ampm === 'PM' && hours12 !== 12) hours24 += 12;
        if (ampm === 'AM' && hours12 === 12) hours24 = 0;
        
        const time24 = `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Get selected days
        const selectedDays = Array.from(document.querySelectorAll('.day-btn.active')).map(btn => btn.dataset.day);
        
        if (selectedDays.length === 0) {
            alert('Please select at least one day for the alarm.');
            return;
        }
        
        const alarmData = {
            time: time24,
            days: selectedDays,
            label: label || 'Alarm',
            sound: sound,
            enabled: true,
            snooze: snooze,
            volume: volume
        };
        
        if (this.editingAlarmId) {
            // Edit existing alarm
            const alarm = this.alarms.find(a => a.id === this.editingAlarmId);
            if (alarm) {
                Object.assign(alarm, alarmData);
            }
        } else {
            // Add new alarm
            alarmData.id = 'alarm_' + Date.now();
            this.alarms.push(alarmData);
        }
        
        this.renderAlarms();
        this.closeAlarmModal();
    }

    deleteAlarm() {
        if (this.editingAlarmId && confirm('Are you sure you want to delete this alarm?')) {
            this.alarms = this.alarms.filter(a => a.id !== this.editingAlarmId);
            this.renderAlarms();
            this.closeAlarmModal();
        }
    }

    toggleDay(button) {
        button.classList.toggle('active');
    }

    validateTimeInput(input, min, max) {
        let value = parseInt(input.value);
        if (isNaN(value) || value < min) {
            input.value = min.toString().padStart(2, '0');
        } else if (value > max) {
            input.value = max.toString().padStart(2, '0');
        } else {
            input.value = value.toString().padStart(2, '0');
        }
    }

    // Alarm Checking and Triggering
    startAlarmCheck() {
        this.alarmCheckInterval = setInterval(() => {
            this.checkAlarms();
        }, 1000);
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        
        this.alarms.forEach(alarm => {
            if (alarm.enabled && 
                alarm.time === currentTime && 
                alarm.days.includes(currentDay) &&
                now.getSeconds() === 0) { // Only trigger at the exact minute
                this.triggerAlarm(alarm);
            }
        });
    }

    triggerAlarm(alarm) {
        this.currentAlarm = alarm;
        
        // Determine which sound to play
        let soundFile;
        if (alarm.sound === 'rotating' && this.settings.enableRotation) {
            soundFile = this.getCurrentRotationSound().file;
        } else {
            soundFile = alarm.sound;
        }
        
        // Play alarm sound
        this.playAlarmSound(soundFile, alarm.volume, this.settings.gradualWakeup);
        
        // Show notification
        this.showAlarmNotification(alarm, soundFile);
    }

    playAlarmSound(soundFile, volume = 0.8, gradualWakeup = true) {
        // Stop any currently playing sound
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        
        // Since we can't load actual audio files, we'll simulate with a beep
        this.simulateAlarmSound(volume, gradualWakeup);
    }

    simulateAlarmSound(volume, gradualWakeup) {
        // Create an audio context for generating beep sounds
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            
            const playBeep = (frequency, duration, vol) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(vol, audioContext.currentTime);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            };
            
            // Play repeating beep pattern
            let beepVolume = gradualWakeup ? 0.1 : volume;
            const maxVolume = volume;
            const beepInterval = setInterval(() => {
                if (!this.currentAlarm) {
                    clearInterval(beepInterval);
                    return;
                }
                
                playBeep(800, 0.2, beepVolume);
                setTimeout(() => playBeep(600, 0.2, beepVolume), 300);
                
                // Gradually increase volume if gradual wakeup is enabled
                if (gradualWakeup && beepVolume < maxVolume) {
                    beepVolume = Math.min(beepVolume + 0.1, maxVolume);
                }
            }, 1000);
            
            this.currentAudio = { stop: () => clearInterval(beepInterval) };
        }
    }

    showAlarmNotification(alarm, soundFile) {
        const soundName = soundFile === 'rotating' ? this.getCurrentRotationSound().name :
            this.alarmSounds.find(s => s.file === soundFile)?.name || 'Unknown Sound';
        
        const notificationTime = document.getElementById('notificationTime');
        const notificationLabel = document.getElementById('notificationLabel');
        const notificationSound = document.getElementById('notificationSound');
        const snoozeTime = document.getElementById('snoozeTime');
        const alarmNotification = document.getElementById('alarmNotification');
        
        if (notificationTime) notificationTime.textContent = this.formatTime12Hour(alarm.time);
        if (notificationLabel) notificationLabel.textContent = alarm.label || 'Alarm';
        if (notificationSound) notificationSound.textContent = soundName;
        if (snoozeTime) snoozeTime.textContent = `${alarm.snooze} min`;
        if (alarmNotification) alarmNotification.classList.remove('hidden');
    }

    stopAlarm() {
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        
        if (this.snoozeTimeout) {
            clearTimeout(this.snoozeTimeout);
            this.snoozeTimeout = null;
        }
        
        const alarmNotification = document.getElementById('alarmNotification');
        if (alarmNotification) {
            alarmNotification.classList.add('hidden');
        }
        
        this.currentAlarm = null;
    }

    snoozeAlarm() {
        if (!this.currentAlarm) return;
        
        // Stop current alarm
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        
        const alarmNotification = document.getElementById('alarmNotification');
        if (alarmNotification) {
            alarmNotification.classList.add('hidden');
        }
        
        // Set snooze timeout
        this.snoozeTimeout = setTimeout(() => {
            this.triggerAlarm(this.currentAlarm);
        }, this.currentAlarm.snooze * 60 * 1000);
    }

    // Settings Management
    openSettings() {
        const themeSelect = document.getElementById('themeSelect');
        const rotationEnabled = document.getElementById('rotationEnabled');
        const gradualWakeup = document.getElementById('gradualWakeup');
        const settingsModal = document.getElementById('settingsModal');
        
        if (themeSelect) themeSelect.value = this.settings.theme;
        if (rotationEnabled) rotationEnabled.checked = this.settings.enableRotation;
        if (gradualWakeup) gradualWakeup.checked = this.settings.gradualWakeup;
        if (settingsModal) settingsModal.classList.remove('hidden');
    }

    closeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.add('hidden');
        }
    }

    saveSettings() {
        const themeSelect = document.getElementById('themeSelect');
        const rotationEnabled = document.getElementById('rotationEnabled');
        const gradualWakeup = document.getElementById('gradualWakeup');
        
        if (themeSelect) this.settings.theme = themeSelect.value;
        if (rotationEnabled) this.settings.enableRotation = rotationEnabled.checked;
        if (gradualWakeup) this.settings.gradualWakeup = gradualWakeup.checked;
        
        this.applyTheme();
        this.closeSettings();
    }

    // Theme Management
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
    }

    applyTheme() {
        if (this.settings.theme === 'auto') {
            document.body.removeAttribute('data-color-scheme');
        } else {
            document.body.setAttribute('data-color-scheme', this.settings.theme);
        }
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            if (this.settings.theme === 'dark') {
                themeIcon.textContent = '☀️';
            } else {
                themeIcon.textContent = '🌙';
            }
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AlarmClockApp();
    app.init();
});

// Handle page visibility changes to keep alarms working
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && app) {
        app.updateTime();
        app.updateRotationDisplay();
    }
});

// Request notification permissions (for future enhancement)
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}