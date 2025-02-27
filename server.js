const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');

class HenriqueMailServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.initializeMiddleware();
        this.connectDatabase();
        this.setupRoutes();
        this.setupSocketIO();
        this.configureEmailService();
    }

    initializeMiddleware() {
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    connectDatabase() {
        mongoose.connect('mongodb://localhost:27017/henriquemail', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
        db.once('open', () => {
            console.log('Connected to MongoDB');
        });
    }

    defineModels() {
        // User Model
        const UserSchema = new mongoose.Schema({
            username: { type: String, unique: true, required: true },
            email: { type: String, unique: true, required: true },
            password: { type: String, required: true },
            profile: {
                displayName: String,
                bio: String,
                profilePicture: String
            },
            role: { type: String, enum: ['user', 'admin'], default: 'user' },
            status: { type: String, enum: ['active', 'suspended'], default: 'active' },
            contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            emailPreferences: {
                theme: { type: String, default: 'dark' },
                language: { type: String, default: 'pt-BR' }
            },
            lastLogin: { type: Date }
        });

        // Email Model
        const EmailSchema = new mongoose.Schema({
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            subject: { type: String, required: true },
            body: { type: String, required: true },
            attachments: [{ 
                filename: String, 
                path: String 
            }],
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        });

        this.User = mongoose.model('User', UserSchema);
        this.Email = mongoose.model('Email', EmailSchema);
    }

    setupRoutes() {
        // Authentication Routes
        this.app.post('/api/auth/register', this.registerUser.bind(this));
        this.app.post('/api/auth/login', this.loginUser.bind(this));

        // Email Routes
        this.app.post('/api/emails/send', this.authenticateToken, this.sendEmail.bind(this));
        this.app.get('/api/emails', this.authenticateToken, this.getUserEmails.bind(this));

        // User Routes
        this.app.get('/api/users', this.authenticateToken, this.getAllUsers.bind(this));
        this.app.get('/api/users/profile', this.authenticateToken, this.getUserProfile.bind(this));
        this.app.put('/api/users/profile', this.authenticateToken, this.updateUserProfile.bind(this));

        // Admin Routes
        this.app.get('/api/admin/users', this.authenticateAdmin, this.adminGetAllUsers.bind(this));
        this.app.delete('/api/admin/users/:id', this.authenticateAdmin, this.adminDeleteUser.bind(this));
    }

    async registerUser(req, res) {
        try {
            const { username, email, password } = req.body;
            
            // Check if user already exists
            const existingUser = await this.User.findOne({ 
                $or: [{ username }, { email }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ message: 'Usuário ou email já existe' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = new this.User({
                username,
                email,
                password: hashedPassword,
                profile: {
                    displayName: username,
                    profilePicture: this.generateDefaultProfilePicture()
                },
                role: username === 'iago05' ? 'admin' : 'user'
            });

            await newUser.save();

            res.status(201).json({ message: 'Usuário registrado com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro no registro', error: error.message });
        }
    }

    async loginUser(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validate input
            if (!username || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Por favor, preencha todos os campos' 
                });
            }
            
            const user = await this.User.findOne({ username });
            
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Usuário não encontrado' 
                });
            }

            // Check if user is suspended
            if (user.status === 'suspended') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Conta suspensa. Entre em contato com o administrador.' 
                });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Senha incorreta' 
                });
            }

            // Update last login timestamp
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token with more information
            const token = jwt.sign(
                { 
                    id: user._id, 
                    username: user.username, 
                    role: user.role,
                    status: user.status
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );

            res.json({ 
                success: true,
                token, 
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profilePicture: user.profile.profilePicture
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor', 
                error: error.message 
            });
        }
    }

    configureEmailService() {
        // Configure Nodemailer for sending real emails
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Or your preferred SMTP server
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendEmail(req, res) {
        try {
            const { recipientUsername, subject, body, attachments } = req.body;
            
            // Find recipient
            const recipient = await this.User.findOne({ username: recipientUsername });
            
            if (!recipient) {
                return res.status(404).json({ message: 'Destinatário não encontrado' });
            }

            // Create email record
            const newEmail = new this.Email({
                sender: req.user.id,
                recipient: recipient._id,
                subject,
                body,
                attachments
            });

            await newEmail.save();

            // Optional: Send real email notification
            await this.transporter.sendMail({
                from: `"Henrique Mail" <${process.env.EMAIL_USER}>`,
                to: recipient.email,
                subject: subject,
                text: body
            });

            // Emit socket event to recipient
            this.io.to(recipient._id.toString()).emit('newEmail', newEmail);

            res.status(201).json({ message: 'Email enviado com sucesso', email: newEmail });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao enviar email', error: error.message });
        }
    }

    setupSocketIO() {
        this.io.use(async (socket, next) => {
            const token = socket.handshake.auth.token;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            // Join user's personal room
            socket.join(socket.user.id);

            socket.on('disconnect', () => {
                socket.leave(socket.user.id);
            });
        });
    }

    // Middleware for authenticating JWT tokens
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.sendStatus(401);

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    }

    // Admin authentication middleware
    authenticateAdmin(req, res, next) {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado' });
        }
        next();
    }

    start(port = 3000) {
        this.defineModels(); // Initialize Mongoose models
        
        this.server.listen(port, () => {
            console.log(`Henrique Mail Server running on port ${port}`);
        });
    }

    generateDefaultProfilePicture() {
        // SVG profile picture generation logic
        const colors = ['#0078d4', '#6264a7', '#13a10e', '#ff4d4d'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        
        return `data:image/svg+xml;utf8,
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="${bgColor}"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
                      fill="white" font-size="80" font-family="Arial, sans-serif">
                    HM
                </text>
            </svg>`;
    }
}

// Environment setup
require('dotenv').config();

// Initialize and start server
const server = new HenriqueMailServer();
server.start();
