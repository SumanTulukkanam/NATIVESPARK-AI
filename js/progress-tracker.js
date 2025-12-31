// Progress Tracker System with Firebase Integration
// Enhanced version with initialize() method for proper integration

class ProgressTracker {
    constructor() {
        this.modules = {
            alphabets: { name: 'AI Alphabets', completed: false, progress: 0, order: 1 },
            vocabulary: { name: 'Smart Vocabulary', completed: false, progress: 0, order: 2 },
            grammar: { name: 'Intelligent Grammar', completed: false, progress: 0, order: 3 },
            assessment: { name: 'Adaptive Assessment', completed: false, progress: 0, order: 4 }
        };
        this.currentUser = null;
        this.userId = null;
        this.initialized = false;
        this.initializeAuth();
        this.initializeMenuButton();
    }

    // NEW: Initialize method for explicit initialization
    async initialize(userId) {
        console.log('🎯 Initializing progress tracker for user:', userId);
        this.userId = userId;
        
        try {
            await this.loadProgress();
            this.initialized = true;
            console.log('✅ Progress tracker initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize progress tracker:', error);
            // Try local storage fallback
            this.loadLocalProgress();
            this.initialized = true;
            return false;
        }
    }

    initializeAuth() {
        // Wait for Firebase to be loaded
        const checkFirebase = setInterval(() => {
            if (window.auth && window.onAuthStateChanged) {
                clearInterval(checkFirebase);
                
                // Listen for auth state changes
                window.onAuthStateChanged(window.auth, async (user) => {
                    if (user) {
                        this.currentUser = user;
                        this.userId = user.uid;
                        console.log('👤 User logged in:', user.email);
                        await this.loadProgress();
                    } else {
                        this.currentUser = null;
                        this.userId = null;
                        console.log('👤 No user logged in');
                        this.loadLocalProgress();
                    }
                });
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkFirebase);
            if (!window.auth) {
                console.warn('⚠️ Firebase not loaded, using local storage only');
                this.loadLocalProgress();
            }
        }, 5000);
    }

    async loadProgress() {
        const userId = this.userId || this.currentUser?.uid;
        
        if (!userId) {
            console.log('⚠️ No user ID available, using local storage');
            this.loadLocalProgress();
            return;
        }

        try {
            // Ensure Firebase is available
            if (!window.db || !window.doc || !window.getDoc) {
                console.warn('⚠️ Firebase Firestore not available');
                this.loadLocalProgress();
                return;
            }
            
            // Get user's progress from Firestore
            const userProgressRef = window.doc(window.db, 'userProgress', userId);
            const progressDoc = await window.getDoc(userProgressRef);

            if (progressDoc.exists()) {
                const data = progressDoc.data();
                const savedModules = data.modules || {};
                
                Object.keys(savedModules).forEach(key => {
                    if (this.modules[key]) {
                        this.modules[key].completed = savedModules[key].completed || false;
                        this.modules[key].progress = savedModules[key].progress || 0;
                    }
                });
                
                console.log('✅ Progress loaded from Firebase:', savedModules);
            } else {
                console.log('📝 No saved progress found, initializing new progress');
                await this.saveProgress();
            }
        } catch (error) {
            console.error('❌ Error loading progress from Firebase:', error);
            this.loadLocalProgress();
        }

        this.updateProgressBar();
    }

    loadLocalProgress() {
        // Fallback to sessionStorage when Firebase is unavailable
        const saved = sessionStorage.getItem('learningProgress');
        if (saved) {
            try {
                const savedModules = JSON.parse(saved);
                Object.keys(savedModules).forEach(key => {
                    if (this.modules[key]) {
                        this.modules[key].completed = savedModules[key].completed || false;
                        this.modules[key].progress = savedModules[key].progress || 0;
                    }
                });
                console.log('✅ Progress loaded from local storage');
            } catch (e) {
                console.error('❌ Failed to parse local progress:', e);
            }
        }
        this.updateProgressBar();
    }

    async saveProgress() {
        // Always save to sessionStorage as backup
        sessionStorage.setItem('learningProgress', JSON.stringify(this.modules));

        const userId = this.userId || this.currentUser?.uid;

        // If user is logged in and Firebase is available, save to Firebase
        if (userId && window.db && window.doc && window.setDoc) {
            try {
                const userProgressRef = window.doc(window.db, 'userProgress', userId);
                
                await window.setDoc(userProgressRef, {
                    userId: userId,
                    userEmail: this.currentUser?.email || 'unknown',
                    modules: this.modules,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });

                console.log('✅ Progress saved to Firebase');
            } catch (error) {
                console.error('❌ Error saving progress to Firebase:', error);
            }
        } else {
            console.log('💾 Progress saved locally (Firebase unavailable)');
        }
    }

    // NEW: Update module progress (percentage)
    async updateModuleProgress(moduleName, percentage) {
        if (this.modules[moduleName]) {
            this.modules[moduleName].progress = Math.min(100, Math.max(0, percentage));
            
            // Auto-complete if 100%
            if (percentage >= 100) {
                this.modules[moduleName].completed = true;
            }
            
            await this.saveProgress();
            this.updateProgressBar();
            
            console.log(`📊 ${moduleName} progress: ${percentage}%`);
        }
    }

    // NEW: Get module progress
    getModuleProgress(moduleName) {
        return this.modules[moduleName]?.progress || 0;
    }

    async markComplete(moduleName) {
        if (this.modules[moduleName]) {
            this.modules[moduleName].completed = true;
            this.modules[moduleName].progress = 100;
            await this.saveProgress();
            this.updateProgressBar();
            this.showCompletionMessage(moduleName);
            
            // Update menu if it's open
            const menu = document.getElementById('progressMenu');
            if (menu && menu.classList.contains('show')) {
                menu.innerHTML = this.generateMenuHTML();
            }
        }
    }

    updateProgressBar() {
        // Calculate weighted progress based on module progress percentages
        const moduleWeights = {
            alphabets: 0.25,
            vocabulary: 0.25,
            grammar: 0.25,
            assessment: 0.25
        };

        let totalProgress = 0;
        Object.keys(this.modules).forEach(key => {
            const weight = moduleWeights[key] || 0.25;
            const progress = this.modules[key].progress || 0;
            totalProgress += progress * weight;
        });

        const percentage = Math.round(totalProgress);
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('overallProgress');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
            progressFill.style.transition = 'width 0.5s ease-in-out';
        }
        if (progressText) {
            progressText.textContent = Math.round(percentage) + '%';
        }
        
        console.log(`📊 Overall progress updated: ${percentage}%`);
    }

    isModuleComplete(moduleName) {
        return this.modules[moduleName]?.completed || false;
    }

    showCompletionMessage(moduleName) {
        const message = document.createElement('div');
        message.className = 'completion-toast';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 18px;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        message.innerHTML = `
            <span style="font-size: 32px;">🎉</span>
            <span>${this.modules[moduleName].name} completed!</span>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    initializeMenuButton() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createMenuButton());
        } else {
            this.createMenuButton();
        }
    }

    createMenuButton() {
        const progressSection = document.querySelector('.progress-bar-container');
        if (!progressSection) {
            console.warn('⚠️ Progress bar container not found');
            return;
        }

        const menuBtn = document.createElement('button');
        menuBtn.className = 'progress-menu-btn';
        menuBtn.style.cssText = `
            position: absolute;
            right: 0;
            margin-right: 25px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            z-index: 10;
        `;
        menuBtn.innerHTML = '📋';
        menuBtn.title = 'View Progress Details';
        menuBtn.onclick = () => this.toggleMenu();
        
        menuBtn.onmouseenter = function() {
            this.style.transform = 'translateY(-50%) scale(1.1)';
            this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        };
        
        menuBtn.onmouseleave = function() {
            this.style.transform = 'translateY(-50%) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        };
        
        progressSection.style.position = 'relative';
        progressSection.appendChild(menuBtn);
        console.log('✅ Progress menu button created');
    }

    toggleMenu() {
        let menu = document.getElementById('progressMenu');
        let backdrop = document.getElementById('menuBackdrop');
        
        if (menu) {
            if (menu.classList.contains('show')) {
                menu.style.opacity = '0';
                menu.style.transform = 'translate(-50%, -50%) scale(0.9)';
                if (backdrop) backdrop.style.opacity = '0';
                
                setTimeout(() => {
                    menu.remove();
                    if (backdrop) backdrop.remove();
                }, 300);
            } else {
                menu.classList.add('show');
            }
            return;
        }

        menu = document.createElement('div');
        menu.id = 'progressMenu';
        menu.className = 'progress-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: white;
            border-radius: 20px;
            padding: 0;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 10001;
            min-width: 400px;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            opacity: 0;
            transition: all 0.3s ease;
        `;
        menu.innerHTML = this.generateMenuHTML();
        
        backdrop = document.createElement('div');
        backdrop.id = 'menuBackdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        backdrop.onclick = () => this.toggleMenu();
        
        document.body.appendChild(backdrop);
        document.body.appendChild(menu);
        
        setTimeout(() => {
            backdrop.style.opacity = '1';
            menu.style.opacity = '1';
            menu.style.transform = 'translate(-50%, -50%) scale(1)';
            menu.classList.add('show');
        }, 10);
    }

    generateMenuHTML() {
        const sortedModules = Object.entries(this.modules).sort((a, b) => a[1].order - b[1].order);
        
        // Calculate overall progress
        const moduleWeights = { alphabets: 0.25, vocabulary: 0.25, grammar: 0.25, assessment: 0.25 };
        let totalProgress = 0;
        Object.keys(this.modules).forEach(key => {
            const weight = moduleWeights[key] || 0.25;
            const progress = this.modules[key].progress || 0;
            totalProgress += progress * weight;
        });
        const percentage = Math.round(totalProgress);
        
        const completed = Object.values(this.modules).filter(m => m.completed).length;
        const total = Object.keys(this.modules).length;
        
        const loginStatus = this.currentUser 
            ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">☁️ Synced with ${this.currentUser.email}</div>`
            : `<div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">💾 Local storage mode</div>`;
        
        let html = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 20px 20px 0 0; color: white; position: relative;">
                <button onclick="tracker.toggleMenu()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
                <h3 style="margin: 0 0 15px 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">📊</span>
                    Learning Journey
                </h3>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">${percentage}%</div>
                    <div style="font-size: 14px; opacity: 0.9;">${completed} of ${total} modules completed</div>
                    ${loginStatus}
                </div>
            </div>
            
            <div style="padding: 25px;">
        `;
        
        sortedModules.forEach(([key, module], index) => {
            const progress = module.progress || 0;
            const isCompleted = module.completed;
            const statusIcon = isCompleted ? '✅' : progress > 0 ? '🔄' : '⬜';
            const statusColor = isCompleted ? '#4CAF50' : progress > 0 ? '#FF9800' : '#9E9E9E';
            
            html += `
                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: ${isCompleted ? '#e8f5e9' : progress > 0 ? '#fff3e0' : '#f5f5f5'}; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${statusColor};">
                    <div style="font-size: 32px; min-width: 40px; text-align: center;">
                        ${statusIcon}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 5px;">
                            ${module.name}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
                            ${isCompleted ? '✓ Completed' : progress > 0 ? `In Progress: ${progress}%` : 'Not Started'}
                        </div>
                        ${progress > 0 ? `
                            <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                                <div style="background: ${statusColor}; height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            if (index < sortedModules.length - 1) {
                html += `
                    <div style="text-align: center; margin: 5px 0; color: #667eea; font-size: 24px;">
                        ↓
                    </div>
                `;
            }
        });
        
        html += `
                <button onclick="tracker.resetProgress()" style="width: 100%; padding: 15px; background: #f44336; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 15px; transition: all 0.3s ease;" onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'">
                    🔄 Reset Progress
                </button>
            </div>
        `;
        
        return html;
    }

    async resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            Object.keys(this.modules).forEach(key => {
                this.modules[key].completed = false;
                this.modules[key].progress = 0;
            });
            await this.saveProgress();
            this.updateProgressBar();
            
            const menu = document.getElementById('progressMenu');
            if (menu) {
                menu.innerHTML = this.generateMenuHTML();
            }
            
            alert('✅ Progress has been reset!');
        }
    }
}

// Initialize tracker globally
const tracker = new ProgressTracker();
window.tracker = tracker;

console.log('✅ Enhanced Progress Tracker with initialize() method loaded');