class HenriqueMail {
    constructor() {
        // Ensure clean initialization
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.loggedInUser = null;
        this.grupos = []; // Initialize grupos as an empty array
        this.initializeAdminUser();
        this.initializeApp();
    }

    initializeAdminUser() {
        // Check if admin user exists, if not create
        const adminUser = this.users.find(u => u.username === 'iago05');
        if (!adminUser) {
            const adminUserData = {
                id: Date.now(),
                username: 'iago05',
                password: 'admin123', // Set a default admin password
                displayName: 'Iago Admin',
                email: 'iago05@henriquemail.com',
                profilePicture: this.generateDefaultProfilePicture(),
                role: 'admin', // Add admin role
                theme: 'dark',
                permissions: {
                    manageUsers: true,
                    viewAllEmails: true,
                    deleteUsers: true,
                    editUserProfiles: true
                }
            };

            this.users.push(adminUserData);
            localStorage.setItem('users', JSON.stringify(this.users));
        } else {
            // Ensure admin user has full permissions
            adminUser.role = 'admin';
            adminUser.permissions = {
                manageUsers: true,
                viewAllEmails: true,
                deleteUsers: true,
                editUserProfiles: true
            };
            
            // Update the admin user in localStorage
            const userIndex = this.users.findIndex(u => u.username === 'iago05');
            this.users[userIndex] = adminUser;
            localStorage.setItem('users', JSON.stringify(this.users));
        }
    }

    initializeApp() {
        try {
            this.setupAuthEventListeners();
            this.checkPreviousLogin();
            this.setupProfilePictureGeneration();
            this.carregarGrupos(); // Ensure grupos are loaded
            
            // Add error handling
            window.addEventListener('error', (event) => {
                this.handleUnexpectedError(event.error);
            });
        } catch (error) {
            this.handleUnexpectedError(error);
        }
    }

    setupAuthEventListeners() {
        // Login tab switching
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        });

        registerTab.addEventListener('click', () => {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });

        // Login form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form submission
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
    }

    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const messageEl = document.getElementById('auth-message');

        // Clear previous messages
        messageEl.textContent = '';
        messageEl.classList.remove('error', 'success');

        // Validate input
        if (!username || !password) {
            messageEl.textContent = 'Por favor, preencha todos os campos';
            messageEl.classList.add('error');
            return;
        }

        // Find user
        const user = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );

        if (user) {
            // Successful login
            this.loggedInUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Hide login page and show main app
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
            // Initialize main app view
            this.showMainApp();
        } else {
            // Login failed
            messageEl.textContent = 'Usuário ou senha incorretos';
            messageEl.classList.add('error');
        }
    }

    register() {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        const displayName = document.getElementById('register-display-name').value.trim();
        const bio = document.getElementById('register-bio').value.trim();
        const profilePicture = document.getElementById('register-profile-picture').src;
        const messageEl = document.getElementById('auth-message');

        // Clear previous messages
        messageEl.textContent = '';
        messageEl.classList.remove('error', 'success');

        // Validate inputs
        if (!username || !password || !confirmPassword || !displayName) {
            messageEl.textContent = 'Por favor, preencha todos os campos obrigatórios';
            messageEl.classList.add('error');
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            messageEl.textContent = 'As senhas não correspondem';
            messageEl.classList.add('error');
            return;
        }

        // Check if username already exists
        const userExists = this.users.some(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );

        if (userExists) {
            messageEl.textContent = 'Nome de usuário já existe';
            messageEl.classList.add('error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            username: username,
            password: password,
            displayName: displayName,
            email: `${username}@henriquemail.com`,
            profilePicture: profilePicture || this.generateRandomProfilePicture(),
            theme: 'dark',
            bio: bio,
            emails: [
                {
                    id: 1,
                    remetente: 'Equipe Henrique Mail',
                    assunto: 'Bem-vindo ao Henrique Mail!',
                    data: new Date().toLocaleDateString(),
                    corpo: 'Olá! Bem-vindo ao Henrique Mail. Esperamos que goste da nossa plataforma de email.'
                }
            ]
        };

        // Add user to users array and save to localStorage
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));

        // Show success message and switch to login tab
        messageEl.textContent = 'Registro realizado com sucesso!';
        messageEl.classList.add('success');

        // Switch back to login tab
        document.getElementById('login-tab').click();
    }

    setupProfilePictureGeneration() {
        const generateProfileBtn = document.getElementById('generate-profile-btn');
        const profilePictureUpload = document.getElementById('profile-picture-upload');
        const profilePreview = document.getElementById('register-profile-picture');

        // Generate random profile picture
        generateProfileBtn.addEventListener('click', () => {
            profilePreview.src = this.generateRandomProfilePicture();
        });

        // Upload custom profile picture
        profilePictureUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    profilePreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Set default profile picture on page load
        profilePreview.src = this.generateRandomProfilePicture();
    }

    generateRandomProfilePicture() {
        // Generate a more detailed SVG profile picture
        const colors = [
            '#0078d4', '#6264a7', '#13a10e', '#ff4d4d', 
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f95738'
        ];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        const initials = this.generateInitials();

        return `data:image/svg+xml;utf8,
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="${bgColor}"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
                      fill="white" font-size="80" font-family="Arial, sans-serif">
                    ${initials}
                </text>
            </svg>`;
    }

    generateInitials() {
        // Get initials from username or display a random letter
        const registerUsername = document.getElementById('register-username');
        if (registerUsername && registerUsername.value.trim()) {
            return registerUsername.value.trim()[0].toUpperCase();
        }
        
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return letters[Math.floor(Math.random() * letters.length)];
    }

    checkPreviousLogin() {
        const currentUser = localStorage.getItem('currentUser');
        
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                this.loggedInUser = user;
                
                // Hide login page and show main app
                document.getElementById('login-page').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                
                // Initialize main app view
                this.showMainApp();
            } catch (error) {
                console.error('Error parsing current user:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    generateDefaultProfilePicture() {
        return this.generateRandomProfilePicture();
    }

    showMainApp() {
        document.getElementById('logged-username').textContent = this.loggedInUser.username;
        this.renderCaixaEntrada(); // Default view after login
        this.setupMainAppEventListeners();
        this.setupProfileHeaderInteractions();

        // Add admin-specific functionality if the user is an admin
        if (this.loggedInUser.role === 'admin') {
            this.setupAdminFeatures();
        }
    }

    setupMainAppEventListeners() {
        // Sidebar Navigation
        document.getElementById('compor-btn').addEventListener('click', () => this.renderComporEmail());
        document.getElementById('caixa-entrada-btn').addEventListener('click', () => this.renderCaixaEntrada());
        document.getElementById('enviados-btn').addEventListener('click', () => this.renderEmailsEnviados());
        document.getElementById('grupos-btn').addEventListener('click', () => this.renderGrupos());
        document.getElementById('perfil-btn').addEventListener('click', () => this.renderProfileSettings());
        document.getElementById('contatos-btn').addEventListener('click', () => this.renderContatos());
        document.getElementById('usuarios-btn').addEventListener('click', () => this.renderTodosUsuarios());

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Carregar grupos ao inicializar
        this.carregarGrupos();
        
        // Use setTimeout to ensure content is rendered before setting up rich compose
        setTimeout(() => {
            this.setupRichEmailCompose();
        }, 200);

        this.enhanceEmailInteractions();
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.loggedInUser = null;
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('auth-message').textContent = '';
        document.getElementById('login-form').reset();
        document.getElementById('login-tab').click(); // Reset to login tab
    }

    renderProfileSettings() {
        const user = this.loggedInUser;
        const content = `
            <div class="profile-settings-container">
                <div class="profile-settings-header">
                    <h2>Configurações de Perfil</h2>
                </div>
                <div class="profile-settings-content">
                    <div class="profile-preview-section">
                        <div class="profile-avatar-container">
                            <img src="${user.profilePicture}" alt="Profile Picture" class="profile-avatar-large">
                            <div class="avatar-overlay">
                                <label for="avatar-upload" class="avatar-edit-btn">
                                    <i class="fas fa-camera"></i>
                                </label>
                                <input type="file" id="avatar-upload" accept="image/*" class="hidden">
                            </div>
                        </div>
                        <div class="profile-basic-info">
                            <h3>${user.displayName}</h3>
                            <p>${user.email}</p>
                        </div>
                    </div>
                    
                    <form id="profile-details-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="display-name">Nome de Exibição</label>
                                <input type="text" id="display-name" value="${user.displayName}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="username">Nome de Usuário</label>
                                <input type="text" id="username" value="${user.username}" readonly>
                            </div>
                            
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" value="${user.email}" readonly>
                            </div>
                            
                            <div class="form-group">
                                <label for="bio">Biografia</label>
                                <textarea id="bio" placeholder="Conte sobre você">${user.bio || ''}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="theme-select">Tema</label>
                                <select id="theme-select">
                                    <option value="dark" ${user.theme === 'dark' ? 'selected' : ''}>Escuro</option>
                                    <option value="light" ${user.theme === 'light' ? 'selected' : ''}>Claro</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="language-select">Idioma</label>
                                <select id="language-select">
                                    <option value="pt-BR" selected>Português (Brasil)</option>
                                    <option value="en-US">English (US)</option>
                                    <option value="es-ES">Español</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button type="submit" class="btn-primary">Salvar Alterações</button>
                            <button type="button" id="change-password-btn" class="btn-secondary">Alterar Senha</button>
                        </div>
                    </form>
                </div>
                
                <div id="change-password-modal" class="modal hidden">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>Alterar Senha</h3>
                        <form id="change-password-form">
                            <div class="form-group">
                                <label for="current-password">Senha Atual</label>
                                <input type="password" id="current-password" required>
                            </div>
                            <div class="form-group">
                                <label for="new-password">Nova Senha</label>
                                <input type="password" id="new-password" required>
                            </div>
                            <div class="form-group">
                                <label for="confirm-new-password">Confirmar Nova Senha</label>
                                <input type="password" id="confirm-new-password" required>
                            </div>
                            <button type="submit" class="btn-primary">Alterar Senha</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
        this.setupProfileSettingsEventListeners();
    }

    setupProfileSettingsEventListeners() {
        const avatarUpload = document.getElementById('avatar-upload');
        const profileAvatar = document.querySelector('.profile-avatar-large');
        const profileForm = document.getElementById('profile-details-form');
        const changePasswordBtn = document.getElementById('change-password-btn');
        const changePasswordModal = document.getElementById('change-password-modal');
        const closeModalBtn = changePasswordModal.querySelector('.close-modal');
        const changePasswordForm = document.getElementById('change-password-form');

        // Avatar upload
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // Added null checks
                    if (profileAvatar) {
                        profileAvatar.src = event.target.result;
                    }
                    
                    if (this.loggedInUser) {
                        this.loggedInUser.profilePicture = event.target.result;
                        this.updateUserInStorage();
                    }
                    
                    // Update header profile pic
                    const headerProfilePic = document.getElementById('header-profile-pic');
                    if (headerProfilePic) {
                        headerProfilePic.src = event.target.result;
                    }
                };
                
                // Error handling for file reading
                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                    this.showNotification('Erro ao carregar imagem', 'error');
                };
                
                reader.readAsDataURL(file);
            }
        });

        // Profile details form submission
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const displayName = document.getElementById('display-name').value.trim();
            const bio = document.getElementById('bio').value.trim();
            const theme = document.getElementById('theme-select').value;
            const language = document.getElementById('language-select').value;

            // Update user profile
            this.loggedInUser.displayName = displayName;
            this.loggedInUser.bio = bio;
            this.loggedInUser.theme = theme;
            this.loggedInUser.language = language;

            this.updateUserInStorage();
            this.applyTheme(theme);
            this.showNotification('Perfil atualizado com sucesso!');
        });

        // Change password modal
        changePasswordBtn.addEventListener('click', () => {
            changePasswordModal.classList.remove('hidden');
        });

        closeModalBtn.addEventListener('click', () => {
            changePasswordModal.classList.add('hidden');
        });

        // Change password form submission
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;

            // Basic validation
            if (currentPassword !== this.loggedInUser.password) {
                this.showNotification('Senha atual incorreta', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                this.showNotification('Novas senhas não correspondem', 'error');
                return;
            }

            // Update password
            this.loggedInUser.password = newPassword;
            this.updateUserInStorage();
            
            // Close modal and show success
            changePasswordModal.classList.add('hidden');
            this.showNotification('Senha alterada com sucesso!');
            
            // Reset form
            changePasswordForm.reset();
        });
    }

    updateUserInStorage() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.loggedInUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.loggedInUser;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Update current user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.loggedInUser));
        }
    }

    applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
    }

    renderContatos() {
        this.updateActiveNavButton('contatos-btn');
        const content = `
            <div class="contatos-container">
                <h2>Contatos</h2>
                <div class="adicionar-contato">
                    <input type="text" id="novo-contato-input" placeholder="Nome de usuário">
                    <button id="adicionar-contato-btn" class="btn-primary">Adicionar Contato</button>
                </div>
                <div id="lista-contatos">
                    ${this.renderContatosList()}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
        this.setupContatosEventListeners();
    }

    renderContatosList() {
        const user = this.loggedInUser;
        if (!user.contacts || user.contacts.length === 0) {
            return '<p>Nenhum contato adicionado</p>';
        }

        return user.contacts.map(contato => `
            <div class="contato-item">
                <img src="${contato.profilePicture}" alt="${contato.username}">
                <div class="contato-info">
                    <h3>${contato.username}</h3>
                    <p>${contato.email}</p>
                </div>
                <button class="btn-secondary" data-username="${contato.username}">Enviar Email</button>
            </div>
        `).join('');
    }

    setupContatosEventListeners() {
        const adicionarContatoBtn = document.getElementById('adicionar-contato-btn');
        const novoContatoInput = document.getElementById('novo-contato-input');

        adicionarContatoBtn.addEventListener('click', () => {
            const username = novoContatoInput.value.trim();
            if (username) {
                const userToAdd = this.users.find(u => u.username === username);
                if (userToAdd && userToAdd.username !== this.loggedInUser.username) {
                    // Prevent adding duplicate contacts
                    if (!this.loggedInUser.contacts) {
                        this.loggedInUser.contacts = [];
                    }
                    
                    const contactExists = this.loggedInUser.contacts.some(c => c.username === username);
                    if (!contactExists) {
                        this.loggedInUser.contacts.push({
                            username: userToAdd.username,
                            email: userToAdd.email,
                            profilePicture: userToAdd.profilePicture
                        });
                        this.updateUserInStorage();
                        this.renderContatos();
                        this.showNotification(`${username} adicionado aos contatos`);
                    } else {
                        this.showNotification('Contato já existe');
                    }
                } else {
                    this.showNotification('Usuário não encontrado');
                }
                novoContatoInput.value = ''; // Clear input
            }
        });

        // Enviar email para contato
        const contatosList = document.getElementById('lista-contatos');
        contatosList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-secondary')) {
                const username = e.target.dataset.username;
                this.renderComporEmail(username);
            }
        });
    }

    renderComporEmail(destinatario = '') {
        this.updateActiveNavButton('compor-btn');
        const content = `
            <div class="compor-email">
                <h2>Compor Email</h2>
                <form id="compose-email-form">
                    <input type="text" id="email-destinatario" placeholder="Para:" value="${destinatario}" required>
                    <input type="text" id="email-assunto" placeholder="Assunto:" required>
                    <textarea id="email-corpo" placeholder="Mensagem:" required></textarea>
                    
                    <div class="image-upload-container">
                        <label class="image-upload-btn">
                            <i class="fas fa-image"></i> Adicionar Imagem
                            <input type="file" id="email-image-upload" accept="image/*">
                        </label>
                        <img id="email-image-preview" class="email-image-preview hidden" src="" alt="Imagem do Email">
                    </div>
                    
                    <button type="submit">Enviar</button>
                </form>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;

        // Add event listeners for image upload
        const imageUpload = document.getElementById('email-image-upload');
        const imagePreview = document.getElementById('email-image-preview');

        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagePreview.src = event.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        // Add event listener for sending email
        document.getElementById('compose-email-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.enviarEmail(imagePreview.src);
        });
    }

    enviarEmail(imagemAnexada = null) {
        const destinatario = document.getElementById('email-destinatario').value.trim();
        const assunto = document.getElementById('email-assunto').value.trim();
        const corpo = document.getElementById('email-corpo').value.trim();

        // Validate inputs
        if (!destinatario || !assunto || !corpo) {
            this.showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }

        // Find recipient user
        const recipientUser = this.users.find(u => 
            u.username.toLowerCase() === destinatario.toLowerCase()
        );

        if (!recipientUser) {
            this.showNotification('Usuário destinatário não encontrado', 'error');
            return;
        }

        // Prevent sending email to yourself
        if (recipientUser.username === this.loggedInUser.username) {
            this.showNotification('Você não pode enviar email para si mesmo', 'error');
            return;
        }

        // Create email object with comprehensive details
        const novoEmail = {
            id: Date.now(),
            remetente: {
                username: this.loggedInUser.username,
                profilePicture: this.loggedInUser.profilePicture
            },
            destinatario: {
                username: recipientUser.username,
                email: recipientUser.email
            },
            assunto: assunto,
            corpo: corpo,
            imagem: imagemAnexada, // Optional image attachment
            data: new Date().toLocaleString(), // More detailed timestamp
            hora: new Date().toLocaleTimeString(),
            lido: false,
            importante: false,
            anexos: [], // Potential for future file attachments
            tags: [] // For future email organization
        };

        // Add email to recipient's inbox
        if (!recipientUser.emails) {
            recipientUser.emails = [];
        }
        recipientUser.emails.unshift(novoEmail); // Add to top of inbox

        // Update sent emails for the sender
        if (!this.loggedInUser.emailsEnviados) {
            this.loggedInUser.emailsEnviados = [];
        }
        this.loggedInUser.emailsEnviados.unshift(novoEmail);

        // Update users in localStorage
        const updatedUsers = this.users.map(user => {
            if (user.username === recipientUser.username) {
                return recipientUser;
            }
            if (user.username === this.loggedInUser.username) {
                return this.loggedInUser;
            }
            return user;
        });

        localStorage.setItem('users', JSON.stringify(updatedUsers));
        localStorage.setItem('currentUser', JSON.stringify(this.loggedInUser));

        // Show success notification
        this.showNotification(`Email enviado para ${destinatario}`, 'success');

        // Clear form and reset image preview
        document.getElementById('compose-email-form').reset();
        const imagePreview = document.getElementById('email-image-preview');
        if (imagePreview) {
            imagePreview.src = '';
            imagePreview.classList.add('hidden');
        }

        // Optionally, re-render the current view to reflect changes
        this.renderCaixaEntrada();
    }

    renderEmailsEnviados() {
        this.updateActiveNavButton('enviados-btn');
        const content = `
            <div class="emails-enviados">
                <h2>Emails Enviados</h2>
                ${this.renderSentEmailsList()}
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
    }

    renderSentEmailsList() {
        const emailsEnviados = (this.loggedInUser && this.loggedInUser.emailsEnviados) ? this.loggedInUser.emailsEnviados : [];
        
        if (emailsEnviados.length === 0) {
            return '<p>Nenhum email enviado ainda</p>';
        }

        return emailsEnviados.map(email => `
            <div class="email-item sent-email-item" data-email-id="${email.id}">
                <div class="email-item-details">
                    <div class="email-item-sender">Para: ${email.destinatario.username}</div>
                    <div class="email-item-subject">${email.assunto}</div>
                </div>
                <div class="email-item-date">${email.data}</div>
            </div>
        `).join('');
    }

    renderCaixaEntrada() {
        this.updateActiveNavButton('caixa-entrada-btn');
        const content = `
            <div class="caixa-entrada">
                <h2>Caixa de Entrada</h2>
                ${this.renderEmailList()}
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;

        // Add click event to email items to show email details
        document.querySelectorAll('.email-item').forEach(item => {
            item.addEventListener('click', () => this.showEmailDetails(item.dataset.emailId));
        });
    }

    renderEmailList() {
        // Ensure emails exists and is an array
        const userEmails = (this.loggedInUser && this.loggedInUser.emails) ? this.loggedInUser.emails : [];
        
        if (userEmails.length === 0) {
            return '<p>Nenhum email recebido</p>';
        }

        return userEmails.map(email => `
            <div class="email-item" data-email-id="${email.id}">
                <div class="email-item-details">
                    <div class="email-item-sender">${email.remetente.username}</div>
                    <div class="email-item-subject">${email.assunto}</div>
                </div>
                <div class="email-item-date">${email.data}</div>
            </div>
        `).join('');
    }

    showEmailDetails(emailId) {
        const email = (this.loggedInUser && this.loggedInUser.emails) ? this.loggedInUser.emails.find(e => e.id === parseInt(emailId)) : null;
        if (email) {
            const content = `
                <div class="email-details">
                    <div class="email-header">
                        <h2>${email.assunto}</h2>
                        <div class="email-meta">
                            <strong>De: ${email.remetente.username}</strong>
                            <small>${email.data}</small>
                        </div>
                    </div>
                    <div class="email-body">
                        ${email.corpo}
                        ${email.imagem ? `<img src="${email.imagem}" alt="Imagem anexada" class="email-attached-image">` : ''}
                    </div>
                    <div class="email-actions">
                        <button id="back-to-inbox" class="btn-secondary">Voltar para Caixa de Entrada</button>
                        <button id="reply-email" class="btn-primary">Responder</button>
                    </div>
                </div>
            `;
            document.getElementById('app-content').innerHTML = content;

            document.getElementById('back-to-inbox').addEventListener('click', () => this.renderCaixaEntrada());
            
            document.getElementById('reply-email').addEventListener('click', () => {
                this.renderComporEmail(email.remetente.username);
            });
        }
    }

    renderGrupos() {
        this.updateActiveNavButton('grupos-btn');
        const content = `
            <div class="grupos-container">
                <div class="grupos-header">
                    <h2>Grupos</h2>
                    <button id="criar-grupo-btn" class="btn-primary">
                        <i class="fas fa-plus"></i> Criar Novo Grupo
                    </button>
                </div>
                <div id="grupos-lista">
                    ${this.renderGruposList()}
                </div>
                
                <div id="criar-grupo-modal" class="modal hidden">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>Criar Novo Grupo</h3>
                        <form id="criar-grupo-form">
                            <input type="text" id="grupo-nome" placeholder="Nome do Grupo" required>
                            <textarea id="grupo-descricao" placeholder="Descrição do Grupo (opcional)"></textarea>
                            <div class="grupo-membros">
                                <h4>Adicionar Membros</h4>
                                <input type="text" id="grupo-membros-input" placeholder="Nome de usuário">
                                <button type="button" id="adicionar-membro-btn">Adicionar</button>
                                <ul id="membros-lista"></ul>
                            </div>
                            <button type="submit" class="btn-primary">Criar Grupo</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;

        // Add event listeners for group creation
        this.setupGruposEventListeners();
    }

    setupGruposEventListeners() {
        const criarGrupoBtn = document.getElementById('criar-grupo-btn');
        const criarGrupoModal = document.getElementById('criar-grupo-modal');
        const closeModalBtn = document.querySelector('.close-modal');
        const criarGrupoForm = document.getElementById('criar-grupo-form');
        const adicionarMembroBtn = document.getElementById('adicionar-membro-btn');
        const membrosLista = document.getElementById('membros-lista');

        // Open modal
        criarGrupoBtn.addEventListener('click', () => {
            criarGrupoModal.classList.remove('hidden');
        });

        // Close modal
        closeModalBtn.addEventListener('click', () => {
            criarGrupoModal.classList.add('hidden');
        });

        // Add member to group
        adicionarMembroBtn.addEventListener('click', () => {
            const membroInput = document.getElementById('grupo-membros-input');
            if (membroInput.value.trim()) {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${membroInput.value} 
                    <span class="remove-membro">&times;</span>
                `;
                membrosLista.appendChild(li);
                
                // Add remove member functionality
                li.querySelector('.remove-membro').addEventListener('click', () => {
                    li.remove();
                });

                membroInput.value = ''; // Clear input
            }
        });

        // Submit group creation form
        criarGrupoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomeGrupo = document.getElementById('grupo-nome').value;
            const descricaoGrupo = document.getElementById('grupo-descricao').value;
            const membros = Array.from(membrosLista.children).map(li => li.textContent.trim().replace('×', ''));

            const novoGrupo = {
                id: Date.now(),
                nome: nomeGrupo,
                descricao: descricaoGrupo,
                membros: membros,
                mensagens: []
            };

            this.grupos.push(novoGrupo);
            this.salvarGrupos();
            
            criarGrupoModal.classList.add('hidden');
            this.renderGrupos();
        });
    }

    renderGruposList() {
        if (this.grupos.length === 0) {
            return '<p>Nenhum grupo criado ainda.</p>';
        }

        return this.grupos.map(grupo => `
            <div class="grupo-item">
                <h3>${grupo.nome}</h3>
                <p>${grupo.descricao}</p>
                <div class="grupo-membros-preview">
                    <span>Membros: ${grupo.membros.join(', ')}</span>
                </div>
                <div class="grupo-acoes">
                    <button class="btn-secondary">Ver Detalhes</button>
                    <button class="btn-danger">Excluir</button>
                </div>
            </div>
        `).join('');
    }

    salvarGrupos() {
        const grupos = JSON.parse(localStorage.getItem('grupos') || '[]');
        const updatedGrupos = grupos.concat(this.grupos);
        localStorage.setItem('grupos', JSON.stringify(updatedGrupos));
    }

    carregarGrupos() {
        const grupos = localStorage.getItem('grupos');
        this.grupos = grupos ? JSON.parse(grupos) : [];
    }

    updateActiveNavButton(activeButtonId) {
        const buttons = ['compor-btn', 'caixa-entrada-btn', 'enviados-btn', 'grupos-btn', 'perfil-btn', 'contatos-btn', 'usuarios-btn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btnId === activeButtonId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupRichEmailCompose() {
        // Use a setTimeout to ensure the DOM is fully loaded
        setTimeout(() => {
            const composeForm = document.getElementById('compose-email-form');
            if (composeForm) {
                composeForm.addEventListener('input', this.autoResizeTextarea);
                
                // Optional: Add file attachment capability
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.style.display = 'none';
                composeForm.appendChild(fileInput);

                const attachButton = document.createElement('button');
                attachButton.type = 'button';
                attachButton.innerHTML = '<i class="fas fa-paperclip"></i> Anexar';
                attachButton.addEventListener('click', () => fileInput.click());
                composeForm.insertBefore(attachButton, composeForm.lastChild);
            }
        }, 100);
    }

    autoResizeTextarea(event) {
        event.target.style.height = 'auto';
        event.target.style.height = event.target.scrollHeight + 'px';
    }

    setupAdminFeatures() {
        // Check if the current user is the admin (iago05)
        if (this.loggedInUser.username === 'iago05') {
            // Add admin-specific sidebar section
            const adminSection = document.createElement('div');
            adminSection.innerHTML = `
                <h3>Painel Administrativo</h3>
                <button id="admin-users-btn" class="sidebar-btn">
                    <i class="fas fa-user-shield"></i> Gerenciar Usuários
                </button>
                <button id="admin-emails-btn" class="sidebar-btn">
                    <i class="fas fa-envelope-open-text"></i> Todas as Mensagens
                </button>
                <button id="admin-system-logs-btn" class="sidebar-btn">
                    <i class="fas fa-clipboard-list"></i> Logs do Sistema
                </button>
                <button id="admin-analytics-btn" class="sidebar-btn">
                    <i class="fas fa-chart-pie"></i> Estatísticas
                </button>
            `;
            
            const sidebarNav = document.querySelector('.sidebar nav');
            sidebarNav.appendChild(adminSection);

            // Add event listeners for admin buttons
            document.getElementById('admin-users-btn').addEventListener('click', () => this.renderAdminUserManagement());
            document.getElementById('admin-emails-btn').addEventListener('click', () => this.renderAdminEmailManagement());
            document.getElementById('admin-system-logs-btn').addEventListener('click', () => this.renderSystemLogs());
            document.getElementById('admin-analytics-btn').addEventListener('click', () => this.renderSystemAnalytics());
        }
    }

    renderSystemLogs() {
        // Create a comprehensive system log view
        const content = `
            <div class="admin-system-logs">
                <h2>Logs do Sistema</h2>
                <div class="logs-container">
                    ${this.generateSystemLogs()}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
    }

    generateSystemLogs() {
        // Collect and generate system logs
        const logs = [
            { 
                timestamp: new Date().toLocaleString(), 
                type: 'USER_LOGIN', 
                details: `Usuário ${this.loggedInUser.username} fez login`
            },
            ...this.collectUserActivityLogs()
        ];

        return logs.map(log => `
            <div class="system-log-item">
                <div class="log-timestamp">${log.timestamp}</div>
                <div class="log-type">${log.type}</div>
                <div class="log-details">${log.details}</div>
            </div>
        `).join('');
    }

    collectUserActivityLogs() {
        // Collect user activity logs from localStorage or other sources
        const logs = [];
        
        this.users.forEach(user => {
            // Example log generation
            logs.push({
                timestamp: new Date(user.createdAt || Date.now()).toLocaleString(),
                type: 'USER_CREATED',
                details: `Usuário ${user.username} criado`
            });
        });

        return logs;
    }

    renderSystemAnalytics() {
        // Create a comprehensive system analytics dashboard
        const userCount = this.users.length;
        const emailCount = this.users.reduce((total, user) => 
            total + (user.emails ? user.emails.length : 0), 0
        );
        const groupCount = this.grupos ? this.grupos.length : 0;

        const content = `
            <div class="admin-analytics-container">
                <h2>Estatísticas do Sistema</h2>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <i class="fas fa-users"></i>
                        <h3>Total de Usuários</h3>
                        <p>${userCount}</p>
                    </div>
                    <div class="analytics-card">
                        <i class="fas fa-envelope"></i>
                        <h3>Total de Emails</h3>
                        <p>${emailCount}</p>
                    </div>
                    <div class="analytics-card">
                        <i class="fas fa-comments"></i>
                        <h3>Total de Grupos</h3>
                        <p>${groupCount}</p>
                    </div>
                    <div class="analytics-card">
                        <i class="fas fa-chart-line"></i>
                        <h3>Crescimento de Usuários</h3>
                        <canvas id="user-growth-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;

        // Optional: Add chart rendering if Chart.js is available
        this.renderUserGrowthChart();
    }

    renderUserGrowthChart() {
        // Placeholder for chart rendering
        // In a real implementation, you'd use Chart.js or another charting library
        const chartCanvas = document.getElementById('user-growth-chart');
        if (window.Chart && chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Novos Usuários',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                }
            });
        }
    }

    renderAdminUserManagement() {
        const content = `
            <div class="admin-users-container">
                <h2>Gerenciamento Avançado de Usuários</h2>
                <div class="admin-users-actions">
                    <button id="create-user-btn" class="btn-primary">
                        <i class="fas fa-user-plus"></i> Criar Novo Usuário
                    </button>
                    <input type="text" id="user-search" placeholder="Buscar usuário...">
                </div>
                <table class="admin-users-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Última Atividade</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderAdvancedUserManagementRows()}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
        this.setupAdvancedUserManagementListeners();
    }

    renderAdvancedUserManagementRows() {
        // Exclude admin user from editable list, but show in view
        return this.users.map(user => `
            <tr class="${user.username === 'iago05' ? 'admin-user' : ''}">
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${new Date(user.lastLogin || Date.now()).toLocaleString()}</td>
                <td>
                    <span class="user-status ${user.status || 'active'}">
                        ${this.getUserStatusLabel(user.status)}
                    </span>
                </td>
                <td>
                    <button class="btn-edit-user" data-username="${user.username}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-suspend-user" data-username="${user.username}">
                        <i class="fas fa-user-slash"></i>
                    </button>
                    ${user.username !== 'iago05' ? `
                    <button class="btn-delete-user" data-username="${user.username}">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    getUserStatusLabel(status) {
        switch(status) {
            case 'suspended': return 'Suspenso';
            case 'inactive': return 'Inativo';
            default: return 'Ativo';
        }
    }

    setupAdvancedUserManagementListeners() {
        const createUserBtn = document.getElementById('create-user-btn');
        const userSearch = document.getElementById('user-search');
        const editButtons = document.querySelectorAll('.btn-edit-user');
        const suspendButtons = document.querySelectorAll('.btn-suspend-user');
        const deleteButtons = document.querySelectorAll('.btn-delete-user');

        // Create new user
        createUserBtn.addEventListener('click', () => this.showCreateUserModal());

        // Search functionality
        userSearch.addEventListener('input', (e) => this.filterUsers(e.target.value));

        // Edit user
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.closest('button').dataset.username;
                this.showUserEditModal(username);
            });
        });

        // Suspend user
        suspendButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.closest('button').dataset.username;
                this.suspendUser(username);
            });
        });

        // Delete user
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.closest('button').dataset.username;
                this.deleteUser(username);
            });
        });
    }

    showCreateUserModal() {
        const modalContent = `
            <div class="modal admin-create-user-modal">
                <div class="modal-content">
                    <h3>Criar Novo Usuário</h3>
                    <form id="admin-create-user-form">
                        <input type="text" id="create-username" placeholder="Nome de Usuário" required>
                        <input type="email" id="create-email" placeholder="Email" required>
                        <input type="password" id="create-password" placeholder="Senha" required>
                        <select id="create-role">
                            <option value="user">Usuário Padrão</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <button type="submit">Criar Usuário</button>
                    </form>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        const form = modal.querySelector('#admin-create-user-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewUserByAdmin();
            modal.remove();
        });
    }

    createNewUserByAdmin() {
        const username = document.getElementById('create-username').value.trim();
        const email = document.getElementById('create-email').value.trim();
        const password = document.getElementById('create-password').value.trim();
        const role = document.getElementById('create-role').value;

        // Check if user already exists
        if (this.users.some(u => u.username === username)) {
            this.showNotification('Usuário já existe', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            role: role,
            profilePicture: this.generateRandomProfilePicture(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        this.showNotification(`Usuário ${username} criado com sucesso`);
        this.renderAdminUserManagement();
    }

    showUserEditModal(username) {
        const user = this.users.find(u => u.username === username);
        
        if (!user) {
            this.showNotification('Usuário não encontrado', 'error');
            return;
        }

        const modalContent = `
            <div class="modal admin-edit-user-modal">
                <div class="modal-content">
                    <h3>Editar Usuário: ${username}</h3>
                    <form id="admin-edit-user-form">
                        <div class="form-group">
                            <label for="edit-display-name">Nome de Exibição</label>
                            <input type="text" id="edit-display-name" value="${user.displayName || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-role">Função</label>
                            <select id="edit-role">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuário Padrão</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-status">Status</label>
                            <select id="edit-status">
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Ativo</option>
                                <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspenso</option>
                                <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-bio">Biografia</label>
                            <textarea id="edit-bio">${user.bio || ''}</textarea>
                        </div>
                        <button type="submit" class="btn-primary">Salvar Alterações</button>
                    </form>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        const form = modal.querySelector('#admin-edit-user-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUserByAdmin(username);
            modal.remove();
        });
    }

    updateUserByAdmin(username) {
        const userIndex = this.users.findIndex(u => u.username === username);
        
        if (userIndex === -1) {
            this.showNotification('Usuário não encontrado', 'error');
            return;
        }

        // Get updated values from form
        const displayName = document.getElementById('edit-display-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const role = document.getElementById('edit-role').value;
        const status = document.getElementById('edit-status').value;
        const bio = document.getElementById('edit-bio').value.trim();

        // Update user object
        this.users[userIndex] = {
            ...this.users[userIndex],
            displayName,
            email,
            role,
            status,
            bio
        };

        // Update localStorage
        localStorage.setItem('users', JSON.stringify(this.users));
        
        // Show success notification
        this.showNotification(`Usuário ${username} atualizado com sucesso`);

        // Refresh admin user management view
        this.renderAdminUserManagement();
    }

    renderTodosUsuarios() {
        this.updateActiveNavButton('usuarios-btn');
        const content = `
            <div class="usuarios-container">
                <h2>Todos os Usuários</h2>
                <div id="usuarios-lista">
                    ${this.renderUsersList()}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
        this.setupUsersListEventListeners();
    }

    renderUsersList() {
        // Exclude the current logged-in user
        const users = this.users.filter(user => 
            user.username !== this.loggedInUser.username
        );
        
        if (users.length === 0) {
            return '<p>Nenhum outro usuário encontrado</p>';
        }

        return users.map(user => `
            <div class="usuario-item">
                <img src="${user.profilePicture}" alt="${user.username}" class="usuario-avatar">
                <div class="usuario-info">
                    <h3>${user.username}</h3>
                    <p>${user.email}</p>
                </div>
                <div class="usuario-acoes">
                    <button class="btn-primary enviar-email-btn" data-username="${user.username}">
                        <i class="fas fa-envelope"></i> Enviar Email
                    </button>
                    <button class="btn-secondary adicionar-contato-btn" data-username="${user.username}">
                        <i class="fas fa-user-plus"></i> Adicionar Contato
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupUsersListEventListeners() {
        const usuariosList = document.getElementById('usuarios-lista');
        
        usuariosList.addEventListener('click', (e) => {
            // Enviar Email
            if (e.target.classList.contains('enviar-email-btn') || 
                e.target.closest('.enviar-email-btn')) {
                const username = e.target.closest('.enviar-email-btn').dataset.username;
                this.renderComporEmail(username);
            }
            
            // Adicionar Contato
            if (e.target.classList.contains('adicionar-contato-btn') || 
                e.target.closest('.adicionar-contato-btn')) {
                const username = e.target.closest('.adicionar-contato-btn').dataset.username;
                this.adicionarContato(username);
            }
        });
    }

    adicionarContato(username) {
        const userToAdd = this.users.find(u => u.username === username);
        
        if (userToAdd) {
            // Prevent adding duplicate contacts
            if (!this.loggedInUser.contacts) {
                this.loggedInUser.contacts = [];
            }
            
            const contactExists = this.loggedInUser.contacts.some(c => c.username === username);
            
            if (!contactExists) {
                this.loggedInUser.contacts.push({
                    username: userToAdd.username,
                    email: userToAdd.email,
                    profilePicture: userToAdd.profilePicture
                });
                
                this.updateUserInStorage();
                this.showNotification(`${username} adicionado aos contatos`);
            } else {
                this.showNotification('Contato já existe');
            }
        } else {
            this.showNotification('Usuário não encontrado');
        }
    }

    setupLoadingSkeletons() {
        // Add loading skeletons during content load
        const contentArea = document.getElementById('app-content');
        contentArea.innerHTML = `
            <div class="loading-container">
                <div class="loading-skeleton" style="height: 50px; margin-bottom: 10px;"></div>
                <div class="loading-skeleton" style="height: 50px; margin-bottom: 10px;"></div>
                <div class="loading-skeleton" style="height: 50px;"></div>
            </div>
        `;
    }

    addTooltips() {
        const elementsTooltip = [
            { selector: '#compor-btn', tooltip: 'Compor novo email' },
            { selector: '#caixa-entrada-btn', tooltip: 'Caixa de Entrada' },
            { selector: '#enviados-btn', tooltip: 'Emails Enviados' },
            { selector: '#perfil-btn', tooltip: 'Configurações de Perfil' }
        ];

        elementsTooltip.forEach(item => {
            const element = document.querySelector(item.selector);
            if (element) {
                element.classList.add('tooltip');
                element.setAttribute('data-tooltip', item.tooltip);
            }
        });
    }

    enhancedErrorHandling() {
        window.addEventListener('error', (event) => {
            this.showNotification(`Erro: ${event.message}`, 'error');
        });
    }

    renderAdminEmailManagement() {
        const content = `
            <div class="admin-emails-container">
                <h2>Todas as Mensagens</h2>
                <div id="admin-emails-list">
                    ${this.renderAllEmailsList()}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
    }

    renderAllEmailsList() {
        let allEmails = [];
        
        // Collect all emails from all users
        this.users.forEach(user => {
            if (user.emails) {
                allEmails = allEmails.concat(
                    user.emails.map(email => ({
                        ...email,
                        userFrom: user.username
                    }))
                );
            }
        });

        // Sort emails by date (most recent first)
        allEmails.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Render emails
        return allEmails.map(email => `
            <div class="admin-email-item">
                <div class="email-header">
                    <strong>De: ${email.userFrom}</strong>
                    <span>${email.data}</span>
                </div>
                <div class="email-subject">${email.assunto}</div>
                <div class="email-body">${email.corpo}</div>
            </div>
        `).join('') || '<p>Nenhuma mensagem encontrada</p>';
    }

    setupProfileHeaderInteractions() {
        const headerProfilePic = document.getElementById('header-profile-pic');
        const profileDropdown = document.querySelector('.profile-dropdown-content');
        const profileDropdownSettings = document.getElementById('profile-dropdown-settings');
        const profileDropdownLogout = document.getElementById('profile-dropdown-logout');

        // Set profile picture
        headerProfilePic.src = this.loggedInUser.profilePicture || this.generateRandomProfilePicture();

        // Toggle dropdown
        headerProfilePic.addEventListener('click', () => {
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!headerProfilePic.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.add('hidden');
            }
        });

        // Settings and logout from dropdown
        profileDropdownSettings.addEventListener('click', (e) => {
            e.preventDefault();
            this.renderProfileSettings();
            profileDropdown.classList.add('hidden');
        });

        profileDropdownLogout.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    enhanceEmailInteractions() {
        // Add more interactive email features
        const emailItems = document.querySelectorAll('.email-item');
        emailItems.forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showEmailContextMenu(e);
            });
        });
    }

    showEmailContextMenu(event) {
        const contextMenu = document.createElement('div');
        contextMenu.classList.add('email-context-menu');
        contextMenu.innerHTML = `
            <ul>
                <li><i class="fas fa-reply"></i> Responder</li>
                <li><i class="fas fa-trash"></i> Excluir</li>
                <li><i class="fas fa-archive"></i> Arquivar</li>
            </ul>
        `;
        
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        
        document.body.appendChild(contextMenu);

        // Remove context menu when clicking outside
        const removeMenu = () => {
            contextMenu.remove();
            document.removeEventListener('click', removeMenu);
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    }

    deleteUser(username) {
        // Confirm deletion
        if (confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
            // Remove user from users array
            const updatedUsers = this.users.filter(u => u.username !== username);
            
            // Update localStorage
            this.users = updatedUsers;
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            // Show notification
            this.showNotification(`Usuário ${username} excluído com sucesso`);

            // Refresh user management view
            this.renderAdminUserManagement();
        }
    }

    handleUnexpectedError(error) {
        console.error('Unexpected error:', error);
        this.showNotification('Ocorreu um erro inesperado. Por favor, tente novamente.', 'error');
    }

    static initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                window.henriqueMail = new HenriqueMail();
            } catch (error) {
                console.error('Initialization error:', error);
            }
        });
    }
}

HenriqueMail.initialize();
