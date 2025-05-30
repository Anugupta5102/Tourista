const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcryptjs');  // Make sure to use the correct bcrypt library
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ServerConfig } = require('../config/index');

const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
                message: 'Not all fields are filled',
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(StatusCodes.CONFLICT).json({
                message: 'User with the same email already exists',
                success: false
            });
        }

        // Generate a salt and hash the password
        const saltRounds = 12;  // Increased for better security
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name: name,
            email: email,
            role: role || "user",  // Default to "user" if no role is provided
            password: hashedPassword,
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'User created',
            success: true,
            id: newUser._id
        });

    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
                message: 'Not all fields are filled',
                success: false
            });
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'Email or password incorrect',
                success: false
            });
        }

        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
            return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
                success: false,
                message: `Account locked. Try again after ${Math.ceil((user.accountLockedUntil - Date.now())/60000)} minutes`
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            // Increment failed attempts
            user.failedLoginAttempts += 1;
            
            // Lock account after 5 failed attempts for 30 minutes
            if (user.failedLoginAttempts >= 5) {
                user.accountLockedUntil = Date.now() + 30 * 60 * 1000;
                await user.save();
                return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
                    success: false,
                    message: 'Account locked due to too many failed attempts. Try again in 30 minutes.'
                });
            }

            await user.save();
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: `Email or password incorrect. ${5 - user.failedLoginAttempts} attempts remaining`,
            });
        }

        // Reset failed attempts on successful login
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;

        const accessToken = jwt.sign({ userId: user._id }, ServerConfig.JWT_KEY, { subject: 'accessApi', expiresIn: ServerConfig.TOKEN_EXP });

        res.cookie('access_token', accessToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',  // Only send cookie over HTTPS in production
            sameSite: 'strict',  // Protect against CSRF
            maxAge: 3600000  // 1 hour
        });
        
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Login successful",
            id: user._id,
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message
        });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('access_token');
        res.status(StatusCodes.NO_CONTENT).json({
            message: "User logged out successfully"
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message
        });
    }
};

const AdminSection = async (req, res) => {
    try {
        const user = await User.findById({ _id: req.user.id });
        return res.status(StatusCodes.OK).json({
            message: "Welcome to the admin route",
            name: user.name,
            email: user.email
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message
        });
    }
};

const deleteAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {  // Ensure only admin can delete users
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'You are not authorized to perform this action.'
            });
        }
        const users = await User.deleteMany({});
        return res.status(StatusCodes.OK).json({
            message: "Deleted all the users"
        });
    } catch (err) { 
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    signup,
    login,
    logout,
    AdminSection,
    deleteAllUsers
};
