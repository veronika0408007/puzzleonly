/* module auth  */
const authModule = {
  elements: {
    loginSection: document.getElementById('loginSection'),
    registerSection: document.getElementById('registerSection'),
    verificationSection: document.getElementById('verificationSection'),
    successSection: document.getElementById('successSection'),
    
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),

    regFullName: document.getElementById('regFullName'),
    regEmail: document.getElementById('regEmail'),
    regPassword: document.getElementById('regPassword'),
    regPasswordConfirm: document.getElementById('regPasswordConfirm'),
    registerError: document.getElementById('registerError'),

    switchToRegister: document.getElementById('switchToRegister'),
    switchToLogin: document.getElementById('switchToLogin'),

    verificationEmail: document.getElementById('verificationEmail'),
    resendEmailBtn: document.getElementById('resendEmailBtn'),
    backToLoginBtn: document.getElementById('backToLoginBtn'),

    welcomeMessage: document.getElementById('welcomeMessage'),
    playGameBtn: document.getElementById('playGameBtn'),
  },
  init() {
    this.checkVerification();
    this.attachEventListeners();
  },
  attachEventListeners() {
    this.elements.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
    this.elements.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });
    this.elements.switchToRegister.addEventListener('click', () => this.showRegister());
    this.elements.switchToLogin.addEventListener('click', () => this.showLogin());
    
    this.elements.resendEmailBtn.addEventListener('click', () => this.resendEmail());
    this.elements.backToLoginBtn.addEventListener('click', () => this.showLogin());

    this.elements.playGameBtn.addEventListener('click', () => this.redirectToGame());
  },

  /* login */
  async handleLogin() {
    const email = this.elements.loginEmail.value.trim();
    const password = this.elements.loginPassword.value.trim();
    if (!email || !password) {
      this.showError('loginError', 'Please fill in all fields');
      return;
    }
    this.setLoading(this.elements.loginForm.querySelector('button[type="submit"]'), true);
    this.clearError('loginError');

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await db
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', data.user.id)
        .single();

      const userData = {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || email
      };
      sessionStorage.setItem('userToken', data.session.access_token);
      sessionStorage.setItem('userData', JSON.stringify(userData));
      this.showSuccess(userData);
    } catch (error) {
      this.showError('loginError', error.message);
    } finally {
      this.setLoading(this.elements.loginForm.querySelector('button[type="submit"]'), false);
    }
  },

  /* registration */
  async handleRegister() {
    const fullName = this.elements.regFullName.value.trim();
    const email = this.elements.regEmail.value.trim();
    const password = this.elements.regPassword.value.trim();
    const confirmPassword = this.elements.regPasswordConfirm.value.trim();

    if (!fullName || !email || !password || !confirmPassword) {
      this.showError('registerError', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      this.showError('registerError', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      this.showError('registerError', 'Passwords do not match');
      return;
    }
    this.setLoading(this.elements.registerForm.querySelector('button[type="submit"]'), true);
    this.clearError('registerError');
    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await db
          .from('user_profiles')
          .insert([{ user_id: data.user.id, full_name: fullName, email }]);

        if (profileError) console.error('Profile error:', profileError);
      }

      this.showVerification(email);
    } catch (error) {
      this.showError('registerError', error.message);
    } finally {
      this.setLoading(this.elements.registerForm.querySelector('button[type="submit"]'), false);
    }
  },

  /* e-mail verification */
  checkVerification() {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('type=signup')) {
      this.verifyEmail();
    }
  },

  async verifyEmail() {
    try {
      const { data, error } = await db.auth.verifyOtp({
        token_hash: window.location.hash,
        type: 'email'
      });
      if (error) throw error;

      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || data.user.email
        };
        sessionStorage.setItem('userToken', data.session.access_token);
        sessionStorage.setItem('userData', JSON.stringify(userData));
        this.showSuccess(userData);
      }
    } catch (error) {
      console.error('Verification error:', error);
      this.showLogin();
    }
  },

  async resendEmail() {
    const emailText = this.elements.verificationEmail.textContent;
    const email = emailText.replace('Verification email sent to ', '').trim();
    if (!email) return;
    this.setLoading(this.elements.resendEmailBtn, true);
    try {
      const { error } = await db.auth.resend({ type: 'signup', email });
      if (error) throw error;
      alert('Verification email sent!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      this.setLoading(this.elements.resendEmailBtn, false);
    }
  },

  /* user interface*/
  showLogin() {
    this.elements.loginSection.style.display = 'block';
    this.elements.registerSection.style.display = 'none';
    this.elements.verificationSection.style.display = 'none';
    this.elements.successSection.style.display = 'none';
    this.clearError('loginError');
    this.elements.loginForm.reset();
  },

  showRegister() {
    this.elements.loginSection.style.display = 'none';
    this.elements.registerSection.style.display = 'block';
    this.elements.verificationSection.style.display = 'none';
    this.elements.successSection.style.display = 'none';
    this.clearError('registerError');
    this.elements.registerForm.reset();
  },

  showVerification(email) {
    this.elements.loginSection.style.display = 'none';
    this.elements.registerSection.style.display = 'none';
    this.elements.verificationSection.style.display = 'block';
    this.elements.successSection.style.display = 'none';
    this.elements.verificationEmail.textContent = `Verification email sent to ${email}`;
  },

  showSuccess(userData) {
    this.elements.loginSection.style.display = 'none';
    this.elements.registerSection.style.display = 'none';
    this.elements.verificationSection.style.display = 'none';
    this.elements.successSection.style.display = 'block';
    this.elements.welcomeMessage.textContent = `Welcome, ${userData.fullName}!`;
  },

  showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.add('show');
  },

  clearError(elementId) {
    const el = document.getElementById(elementId);
    el.textContent = '';
    el.classList.remove('show');
  },

  setLoading(button, isLoading) {
    button.classList.toggle('loading', isLoading);
    button.disabled = isLoading;
  },

  redirectToGame() {
    window.location.href = '../game/index.html';
  }
};

document.addEventListener('DOMContentLoaded', () => authModule.init());
