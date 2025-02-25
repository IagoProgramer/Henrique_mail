class HenriqueMail {
    constructor() {
        // Initialize users from localStorage or create an empty array
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.loggedInUser = null;
        this.initializeApp();
    }

    initializeApp() {
        // Setup authentication event listeners
        this.setupAuthEventListeners();
        
        // Check for existing login
        this.checkPreviousLogin();
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
        const messageEl = document.getElementById('auth-message');

        // Clear previous messages
        messageEl.textContent = '';
        messageEl.classList.remove('error', 'success');

        // Validate inputs
        if (!username || !password || !confirmPassword) {
            messageEl.textContent = 'Por favor, preencha todos os campos';
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
            email: `${username}@henriquemail.com`,
            profilePicture: this.generateDefaultProfilePicture(),
            theme: 'dark',
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
        // Generate a simple SVG profile picture
        const colors = ['#0078d4', '#6264a7', '#13a10e', '#ff4d4d'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="${randomColor}"><circle cx="50" cy="50" r="50"/></svg>`;
    }

    showMainApp() {
        document.getElementById('logged-username').textContent = this.loggedInUser.username;
        this.renderCaixaEntrada(); // Default view after login
        this.setupMainAppEventListeners();
        this.setupProfileHeaderInteractions();
    }

    setupMainAppEventListeners() {
        // Sidebar Navigation
        document.getElementById('compor-btn').addEventListener('click', () => this.renderComporEmail());
        document.getElementById('caixa-entrada-btn').addEventListener('click', () => this.renderCaixaEntrada());
        document.getElementById('enviados-btn').addEventListener('click', () => this.renderEmailsEnviados());
        document.getElementById('grupos-btn').addEventListener('click', () => this.renderGrupos());
        document.getElementById('perfil-btn').addEventListener('click', () => this.renderProfileSettings());
        document.getElementById('contatos-btn').addEventListener('click', () => this.renderContatos());

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
            <div class="profile-settings">
                <h2>Configurações de Perfil</h2>
                <div class="profile-header">
                    <div class="profile-picture-container">
                        <img src="${user.profilePicture}" alt="Profile Picture" class="profile-picture">
                        <input type="file" id="profile-picture-upload" accept="image/*" class="hidden">
                        <button id="change-profile-picture" class="btn-secondary">Alterar Foto</button>
                    </div>
                    <div class="profile-info">
                        <h3>${user.username}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
                <form id="profile-form">
                    <div class="form-group">
                        <label for="bio">Biografia</label>
                        <textarea id="bio" placeholder="Conte um pouco sobre você">${user.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="theme-select">Tema</label>
                        <select id="theme-select">
                            <option value="dark" ${user.theme === 'dark' ? 'selected' : ''}>Escuro</option>
                            <option value="light" ${user.theme === 'light' ? 'selected' : ''}>Claro</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">Salvar Alterações</button>
                </form>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
        
        this.setupProfileEventListeners();
    }

    setupProfileEventListeners() {
        const changeProfilePictureBtn = document.getElementById('change-profile-picture');
        const profilePictureUpload = document.getElementById('profile-picture-upload');
        const profileForm = document.getElementById('profile-form');

        // Change profile picture
        changeProfilePictureBtn.addEventListener('click', () => {
            profilePictureUpload.click();
        });

        profilePictureUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.querySelector('.profile-picture');
                    img.src = event.target.result;
                    this.loggedInUser.profilePicture = event.target.result;
                    this.updateUserInStorage();
                };
                reader.readAsDataURL(file);
            }
        });

        // Save profile changes
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bio = document.getElementById('bio').value;
            const theme = document.getElementById('theme-select').value;

            // Update user profile
            this.loggedInUser.bio = bio;
            this.loggedInUser.theme = theme;
            this.updateUserInStorage();

            // Apply theme
            this.applyTheme(theme);

            // Show success message
            this.showNotification('Perfil atualizado com sucesso!');
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
                novoContatoInput.value = '';
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

        // Find recipient
        const recipientUser = this.users.find(u => u.username === destinatario);

        if (!recipientUser) {
            this.showNotification('Usuário não encontrado');
            return;
        }

        // Create email object
        const novoEmail = {
            id: Date.now(),
            remetente: this.loggedInUser.username,
            destinatario: destinatario,
            assunto: assunto,
            corpo: corpo,
            imagem: imagemAnexada, // Add image attachment
            data: new Date().toLocaleDateString(),
            lido: false
        };

        // Add to recipient's emails
        if (!recipientUser.emails) {
            recipientUser.emails = [];
        }
        recipientUser.emails.push(novoEmail);

        // Update users in storage
        const users = this.users.map(u => 
            u.username === recipientUser.username ? recipientUser : u
        );
        localStorage.setItem('users', JSON.stringify(users));

        // Show success notification
        this.showNotification('Email enviado com sucesso!');

        // Clear form
        document.getElementById('compose-email-form').reset();
        document.getElementById('email-image-preview').classList.add('hidden');
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
                    <div class="email-item-sender">${email.remetente}</div>
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
                            <strong>De: ${email.remetente}</strong>
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
                this.renderComporEmail(email.remetente);
            });
        }
    }

    renderEmailsEnviados() {
        this.updateActiveNavButton('enviados-btn');
        const content = `
            <div class="emails-enviados">
                <h2>Emails Enviados</h2>
                <p>Nenhum email enviado</p>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
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
        localStorage.setItem('grupos', JSON.stringify(this.grupos));
    }

    carregarGrupos() {
        const grupos = localStorage.getItem('grupos');
        this.grupos = grupos ? JSON.parse(grupos) : [];
    }

    updateActiveNavButton(activeButtonId) {
        const buttons = ['compor-btn', 'caixa-entrada-btn', 'enviados-btn', 'grupos-btn', 'perfil-btn', 'contatos-btn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btnId === activeButtonId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.classList.add('notification');
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

    initAdvancedThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.innerHTML = '<i class="fas fa-adjust"></i>';
        themeToggle.classList.add('theme-toggle');
        document.querySelector('.header-actions').appendChild(themeToggle);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
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

    setupProfileHeaderInteractions() {
        const headerProfilePic = document.getElementById('header-profile-pic');
        const profileDropdown = document.querySelector('.profile-dropdown-content');
        const profileDropdownSettings = document.getElementById('profile-dropdown-settings');
        const profileDropdownLogout = document.getElementById('profile-dropdown-logout');

        // Set profile picture
        headerProfilePic.src = this.loggedInUser.profilePicture || this.generateDefaultProfilePicture();

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
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.henriqueMail = new HenriqueMail();
});
