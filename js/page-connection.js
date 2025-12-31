// Enhanced Page Connection & Navigation System with AI Integration
import authManager from './firebase-auth.js';
// Add this import at the top of page-connection.js
import { doc, setDoc, getDoc, updateDoc } from '../config/firebase-config.js';

class PageConnectionManager {
    constructor() {
        this.currentPage = '';
        this.userProfile = null;
        this.navigationHistory = [];
        this.init();
    }

    init() {
        console.log('🔗 Page Connection Manager Initialized');
        this.setupNavigation();
        this.setupAuthHandling();
        this.setupAIListeners();
    }

    setupNavigation() {
        // Handle browser navigation
        window.addEventListener('popstate', (event) => {
            this.handleNavigationChange(event.state?.page || 'home');
        });

        // Intercept link clicks for SPA-like navigation
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-internal]');
            if (link) {
                event.preventDefault();
                this.navigateTo(link.href);
            }
        });
    }

    setupAuthHandling() {
        // Listen for auth state changes
        authManager.onAuthStateChanged(async (user) => {
            if (user) {
                await this.loadUserProfile();
                this.handleAuthenticatedNavigation();
            } else {
                this.handleUnauthenticatedNavigation();
            }
        });
    }

    setupAIListeners() {
        // Listen for AI-related events
        document.addEventListener('aiTranslationComplete', (event) => {
            this.handleAITranslation(event.detail);
        });

        document.addEventListener('learningProgressUpdate', (event) => {
            this.handleProgressUpdate(event.detail);
        });
    }

    async navigateTo(url, options = {}) {
        const targetPage = this.extractPageFromUrl(url);
        
        // Save current state
        this.navigationHistory.push({
            page: this.currentPage,
            timestamp: Date.now()
        });

        // Check authentication requirements
        if (this.requiresAuthentication(targetPage) && !authManager.isAuthenticated()) {
            this.redirectToAuth();
            return;
        }

        // Load target page
        await this.loadPage(targetPage, options);
        
        // Update browser history
        window.history.pushState({ page: targetPage }, '', url);
        
        // Trigger AI enhancements for new page
        this.enhancePageWithAI(targetPage);
    }

    async loadPage(page, options = {}) {
        console.log(`📄 Loading page: ${page}`);
        
        try {
            // Show loading state
            this.showLoadingState();

            // Load page content
            const content = await this.fetchPageContent(page);
            
            // Update main content area
            this.updateContentArea(content);
            
            // Update current page
            this.currentPage = page;
            
            // Initialize page-specific functionality
            this.initializePageFunctionality(page);
            
            // Hide loading state
            this.hideLoadingState();

            // Trigger page load event
            this.triggerPageLoadEvent(page);

        } catch (error) {
            console.error(`Failed to load page ${page}:`, error);
            this.showErrorState(error);
        }
    }

    async fetchPageContent(page) {
        const pageMap = {
            'home': '../pages/home-ai.html',
            'alphabets': '../pages/alphabets-ai.html',
            'vocabulary': '../pages/vocabulary-ai.html',
            'grammar': '../pages/grammar-ai.html',
            'assessment': '../pages/final-assessment-ai.html',
            'results': '../pages/results.html',
            'profile': '../pages/botinteraction.html'
        };

        const pageUrl = pageMap[page] || pageMap['home'];
        
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status}`);
        }
        
        return await response.text();
    }

    updateContentArea(content) {
        const mainContent = document.getElementById('main-content') || document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = content;
        } else {
            document.body.innerHTML = content;
        }
    }

    initializePageFunctionality(page) {
        // Initialize page-specific JavaScript
        const pageInitializers = {
            'home': () => this.initializeHomePage(),
            'alphabets': () => this.initializeAlphabetsPage(),
            'vocabulary': () => this.initializeVocabularyPage(),
            'grammar': () => this.initializeGrammarPage(),
            'assessment': () => this.initializeAssessmentPage(),
            'profile': () => this.initializeProfilePage()
        };

        const initializer = pageInitializers[page];
        if (initializer) {
            setTimeout(initializer, 100);
        }
    }

    // Page-specific initializers
    initializeHomePage() {
        if (window.initializeHomePage) {
            window.initializeHomePage();
        }
        
        // Apply AI translations if needed
        if (this.userProfile && this.userProfile.teachingLanguage !== 'en') {
            setTimeout(() => {
                translator.translatePage(this.userProfile.teachingLanguage);
            }, 1000);
        }

        // Show AI welcome message
        this.showAIWelcomeMessage();
    }

    initializeAlphabetsPage() {
        // Initialize alphabet learning with AI
        if (window.initializeAlphabetsAI) {
            window.initializeAlphabetsAI();
        }
        
        // Load AI-powered alphabet content
        this.loadAIAlphabetContent();
    }

    initializeVocabularyPage() {
        // Initialize vocabulary learning with AI
        if (window.initializeVocabularyAI) {
            window.initializeVocabularyAI();
        }
    }

    initializeGrammarPage() {
        // Initialize grammar learning with AI
        if (window.initializeGrammarAI) {
            window.initializeGrammarAI();
        }
    }

    initializeAssessmentPage() {
        // Initialize AI assessment
        if (window.initializeAssessmentAI) {
            window.initializeAssessmentAI();
        }
    }

    initializeProfilePage() {
        // Profile page doesn't need special initialization
        console.log('Profile page loaded');
    }

    // AI Enhancement Methods
    enhancePageWithAI(page) {
        // Apply AI personalization based on user profile and learning patterns
        if (this.userProfile) {
            this.applyAIPersonalization();
            this.adaptiveContentDifficulty();
            this.personalizedLearningPath();
        }
    }

    applyAIPersonalization() {
        // Adjust UI based on AI learning analytics
        const analytics = this.userProfile?.aiAnalytics;
        if (analytics) {
            // Adjust content based on learning style
            if (analytics.learningPattern === 'visual') {
                document.body.classList.add('visual-learning');
            } else if (analytics.learningPattern === 'auditory') {
                document.body.classList.add('auditory-learning');
            }

            // Adjust pace based on user's learning speed
            if (analytics.pace === 'fast') {
                document.body.classList.add('fast-pace');
            } else if (analytics.pace === 'slow') {
                document.body.classList.add('slow-pace');
            }
        }
    }

    adaptiveContentDifficulty() {
        // Adjust content difficulty based on user progress
        const progress = this.userProfile?.progress;
        if (progress && progress.overall > 70) {
            document.body.classList.add('advanced-mode');
        }
    }

    personalizedLearningPath() {
        // Highlight recommended modules based on AI analysis
        const weakAreas = this.userProfile?.aiAnalytics?.weakAreas || [];
        weakAreas.forEach(area => {
            const element = document.querySelector(`[data-module="${area}"]`);
            if (element) {
                element.classList.add('ai-recommended');
            }
        });
    }

    // User Profile Management
    async loadUserProfile() {
        this.userProfile = await authManager.getUserProfile();
        if (this.userProfile) {
            console.log('👤 User profile loaded:', this.userProfile);
            
            // Store in global state for easy access
            window.userProfile = this.userProfile;
            
            // Trigger profile load event
            document.dispatchEvent(new CustomEvent('userProfileLoaded', {
                detail: this.userProfile
            }));
        }
    }

    async updateUserProgress(progressData) {
        if (!authManager.isAuthenticated()) return;

        try {
            // Update local state
            if (this.userProfile) {
                this.userProfile.progress = { ...this.userProfile.progress, ...progressData };
            }

            // Update Firestore
            const userRef = doc(db, 'users', authManager.currentUser.uid);
            await updateDoc(userRef, {
                progress: progressData,
                lastUpdated: new Date().toISOString()
            });

            // Send to AI analytics
            await this.sendProgressToAI(progressData);

            console.log('📈 Progress updated:', progressData);
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    async sendProgressToAI(progressData) {
        try {
            const response = await fetch('http://localhost:8000/api/v1/analyze/learning-analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: authManager.currentUser.uid,
                    progress_data: progressData,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                const analytics = await response.json();
                this.handleAIAnalytics(analytics);
            }
        } catch (error) {
            console.warn('Failed to send progress to AI:', error);
        }
    }

    handleAIAnalytics(analytics) {
        // Update UI based on AI recommendations
        console.log('🧠 AI Analytics received:', analytics);
        
        // Trigger event for other components to listen to
        document.dispatchEvent(new CustomEvent('aiAnalyticsUpdated', {
            detail: analytics
        }));
    }

    // Utility Methods
    requiresAuthentication(page) {
        const publicPages = ['botinteraction'];
        return !publicPages.includes(page);
    }

    redirectToAuth() {
        window.location.href = '../pages/botinteraction.html';
    }

    extractPageFromUrl(url) {
        const urlObj = new URL(url, window.location.origin);
        const path = urlObj.pathname;
        return path.split('/').pop().replace('.html', '') || 'home';
    }

    showLoadingState() {
        // Show loading spinner or skeleton screen
        document.body.classList.add('page-loading');
    }

    hideLoadingState() {
        document.body.classList.remove('page-loading');
    }

    showErrorState(error) {
        // Show error message to user
        console.error('Page load error:', error);
        // You could show a toast notification here
    }

    triggerPageLoadEvent(page) {
        document.dispatchEvent(new CustomEvent('pageLoaded', {
            detail: { page, timestamp: Date.now() }
        }));
    }

    showAIWelcomeMessage() {
        // Show personalized AI welcome message
        if (this.userProfile && this.currentPage === 'home') {
            const welcomeEvent = new CustomEvent('showAIWelcome', {
                detail: {
                    userName: this.userProfile.displayName,
                    learningLanguage: this.userProfile.targetLanguage,
                    streak: this.userProfile.progress.currentStreak
                }
            });
            document.dispatchEvent(welcomeEvent);
        }
    }
// Add this method to the PageConnectionManager class in js/page-connection.js

// User Profile Management Methods
async saveProfile(profileData) {
    try {
        console.log('💾 Saving profile data:', profileData);
        
        if (!authManager.isAuthenticated()) {
            console.error('❌ Cannot save profile: User not authenticated');
            throw new Error('User not authenticated');
        }

        // Ensure profile has required fields
        const completeProfile = {
            ...profileData,
            uid: authManager.currentUser.uid,
            lastUpdated: new Date().toISOString(),
            profileComplete: true
        };

        // Save to Firestore
        const userRef = doc(db, 'users', authManager.currentUser.uid);
        await setDoc(userRef, completeProfile, { merge: true });
        
        console.log('✅ Profile saved successfully to Firestore');
        
        // Update local state
        this.userProfile = completeProfile;
        window.userProfile = completeProfile;
        
        // Trigger profile update event
        document.dispatchEvent(new CustomEvent('profileSaved', {
            detail: completeProfile
        }));
        
        return { success: true, profile: completeProfile };
        
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        throw new Error(`Failed to save profile: ${error.message}`);
    }
}

async loadProfile() {
    try {
        if (!authManager.isAuthenticated()) {
            console.log('🔐 User not authenticated, cannot load profile');
            return null;
        }
        
        const userRef = doc(db, 'users', authManager.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const profile = userDoc.data();
            console.log('📋 Profile loaded:', profile);
            
            // Update local state
            this.userProfile = profile;
            window.userProfile = profile;
            
            return profile;
        } else {
            console.log('📋 No existing profile found');
            return null;
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        return null;
    }
}

async isProfileComplete() {
    try {
        const profile = await this.loadProfile();
        return profile && profile.profileComplete === true;
    } catch (error) {
        console.error('Error checking profile completion:', error);
        return false;
    }
}

async initializeModules() {
    try {
        if (!this.userProfile) {
            await this.loadProfile();
        }
        
        if (this.userProfile) {
            console.log('🎮 Initializing learning modules for user');
            
            // Initialize module progress if not exists
            const modules = this.userProfile.modules || {
                alphabets: { completed: false, progress: 0, locked: false },
                vocabulary: { completed: false, progress: 0, locked: true },
                grammar: { completed: false, progress: 0, locked: true },
                assessment: { completed: false, progress: 0, locked: true }
            };
            
            // Update profile with modules
            await this.saveProfile({ modules });
            
            console.log('✅ Learning modules initialized');
        }
    } catch (error) {
        console.error('Error initializing modules:', error);
    }
}
    async loadAIAlphabetContent() {
        // Load AI-generated alphabet content based on user's native language
        if (this.userProfile) {
            try {
                const response = await fetch('http://localhost:8000/api/v1/analyze/personalized-content', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: authManager.currentUser.uid,
                        content_type: 'alphabets',
                        native_language: this.userProfile.teachingLanguage,
                        target_language: this.userProfile.targetLanguage
                    })
                });

                if (response.ok) {
                    const content = await response.json();
                    this.displayAIContent(content);
                }
            } catch (error) {
                console.warn('Failed to load AI alphabet content:', error);
            }
        }
    }

    displayAIContent(content) {
        // Display AI-generated content in the page
        console.log('📝 Displaying AI-generated content:', content);
        // Implementation would depend on the content structure
    }

    // Navigation History
    getNavigationHistory() {
        return this.navigationHistory;
    }

    goBack() {
        if (this.navigationHistory.length > 0) {
            const previous = this.navigationHistory.pop();
            this.navigateTo(previous.page);
        } else {
            window.history.back();
        }
    }

    // Event Handlers
    handleNavigationChange(page) {
        this.loadPage(page);
    }

    handleAITranslation(translation) {
        console.log('AI Translation completed:', translation);
    }

    handleProgressUpdate(progress) {
        this.updateUserProgress(progress);
    }

    handleAuthenticatedNavigation() {
        // Redirect to home if on auth page
        if (this.currentPage === 'botinteraction') {
            this.navigateTo('../pages/home-ai.html');
        }
    }

    handleUnauthenticatedNavigation() {
        // Redirect to auth if on protected page
        if (this.requiresAuthentication(this.currentPage)) {
            this.redirectToAuth();
        }
    }
}

// Create and export singleton instance
const pageManager = new PageConnectionManager();

// Export for global access
if (typeof window !== 'undefined') {
    window.pageManager = pageManager;
}

export default pageManager;