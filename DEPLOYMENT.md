# Deployment Guide - Environment Variables

This document outlines all required environment variables for deploying the Exam Proctoring System backend to Render or other cloud platforms.

## Required Environment Variables for Render Deployment

### CORS Configuration (Critical)

#### `FRONTEND_URL`
- **Description**: Comma-separated list of allowed frontend origins for CORS
- **Required**: Yes (for production)
- **Format**: Comma-separated URLs
- **Example (Single Origin)**:
  ```
  https://virtualxam-fp5e.onrender.com
  ```
- **Example (Multiple Origins)**:
  ```
  https://virtualxam-fp5e.onrender.com,http://localhost:5173
  ```
- **Default**: If not set, defaults to `['http://localhost:5173', 'https://virtualxam-fp5e.onrender.com']`
- **Usage**: Used in both Express CORS middleware and Socket.io configuration
- **Render Configuration**: 
  - Go to your Render backend service → Environment tab
  - Add `FRONTEND_URL` with your production frontend URL
  - For multiple origins, separate with commas (no spaces)

### Server Configuration

#### `PORT`
- **Description**: Port number for the server to listen on
- **Required**: No (defaults to 5000)
- **Example**: `5000`
- **Note**: Render automatically sets this, but you can override if needed

#### `NODE_ENV`
- **Description**: Environment mode (development, production, test)
- **Required**: Yes (for production)
- **Example**: `production`
- **Impact**: 
  - Enables secure cookies and HTTPS-only settings
  - Disables development logging
  - Affects error message verbosity

### Database Configuration

#### `MONGO_URI`
- **Description**: MongoDB connection string
- **Required**: Yes
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
- **Note**: Use MongoDB Atlas connection string for cloud deployment

### Authentication & Security

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Required**: Yes
- **Example**: Generate a strong random string (minimum 32 characters)
- **Security**: Use a strong, randomly generated secret. Never commit to version control.

#### `JWT_EXPIRES_IN`
- **Description**: JWT token expiration time
- **Required**: No (has default)
- **Example**: `7d`, `24h`, `1h`
- **Default**: Check auth controller for default value

#### `JWT_COOKIE_EXPIRES_IN`
- **Description**: Cookie expiration time in days
- **Required**: No (has default)
- **Example**: `7` (for 7 days)

#### `SESSION_SECRET`
- **Description**: Secret key for express-session
- **Required**: No (has default, but should be set in production)
- **Example**: Generate a strong random string (minimum 32 characters)
- **Default**: `'exam-proctoring-session-secret'` (change in production!)

### Email Configuration

Choose one of the following email configurations:

#### Option 1: SMTP Configuration (Recommended)

#### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Required**: Yes (if using SMTP)
- **Example**: `smtp.gmail.com`, `smtp.sendgrid.net`

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Required**: Yes (if using SMTP)
- **Example**: `587` (TLS), `465` (SSL)

#### `SMTP_USERNAME`
- **Description**: SMTP authentication username
- **Required**: Yes (if using SMTP)
- **Example**: `your-email@gmail.com`

#### `SMTP_PASSWORD`
- **Description**: SMTP authentication password or app-specific password
- **Required**: Yes (if using SMTP)
- **Example**: Your email password or app-specific password

#### `EMAIL_FROM`
- **Description**: Email address to send emails from
- **Required**: Yes
- **Example**: `noreply@yourdomain.com` or `"Exam Proctoring System" <noreply@yourdomain.com>`

#### `CLIENT_URL`
- **Description**: Base URL of the frontend application (for email links)
- **Required**: Yes
- **Example**: `https://virtualxam-fp5e.onrender.com`

#### Option 2: Alternative Email Configuration

#### `EMAIL_HOST`
- **Description**: Alternative email host configuration
- **Required**: If not using SMTP_* variables
- **Example**: `smtp.gmail.com`

#### `EMAIL_PORT`
- **Description**: Alternative email port configuration
- **Required**: If not using SMTP_* variables
- **Example**: `587`

#### `EMAIL_USER`
- **Description**: Alternative email username
- **Required**: If not using SMTP_* variables
- **Example**: `your-email@gmail.com`

#### `EMAIL_PASS`
- **Description**: Alternative email password
- **Required**: If not using SMTP_* variables
- **Example**: Your email password

### OTP Configuration (Optional)

#### `OTP_MAX_ATTEMPTS`
- **Description**: Maximum number of OTP verification attempts
- **Required**: No
- **Default**: `5`
- **Example**: `5`

#### `OTP_LENGTH`
- **Description**: Length of OTP code
- **Required**: No
- **Default**: `6`
- **Example**: `6`

#### `OTP_EXPIRY_MINUTES`
- **Description**: OTP expiration time in minutes
- **Required**: No
- **Default**: `10`
- **Example**: `10`

### Load Testing (Optional - Development Only)

#### `LOAD_TEST_BASE_URL`
- **Description**: Base URL for load testing scripts
- **Required**: No
- **Default**: `http://localhost:5000`
- **Example**: `https://your-backend.onrender.com`

#### `LOAD_TEST_DURATION_SECONDS`
- **Description**: Duration of load test in seconds
- **Required**: No
- **Default**: `300` (5 minutes)

#### `LOAD_TEST_CONCURRENCY`
- **Description**: Number of concurrent requests for load testing
- **Required**: No
- **Default**: `5`

## Render Deployment Steps

### 1. Set Environment Variables in Render

1. Navigate to your Render backend service dashboard
2. Go to the **Environment** tab
3. Add each required environment variable listed above
4. Click **Save Changes** (this will trigger a redeploy)

### 2. Critical Variables for Production

At minimum, ensure these are set:

```bash
NODE_ENV=production
FRONTEND_URL=https://virtualxam-fp5e.onrender.com
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-strong-random-secret
SESSION_SECRET=your-strong-random-secret
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=https://virtualxam-fp5e.onrender.com
```

### 3. Verify CORS Configuration

After deployment:
1. Test API requests from your frontend
2. Check browser console for CORS errors
3. Verify Socket.io connections work properly
4. If issues persist, ensure `FRONTEND_URL` matches your frontend domain exactly (including protocol: `https://`)

### 4. Testing

After setting environment variables:
1. Deploy the backend service
2. Check logs for any missing variable errors
3. Test authentication endpoints
4. Test email functionality
5. Verify Socket.io connections

## Security Best Practices

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Use strong secrets** - Generate random strings for `JWT_SECRET` and `SESSION_SECRET`
3. **Rotate secrets regularly** - Especially if compromised
4. **Use environment-specific values** - Different values for dev/staging/production
5. **Restrict database access** - Use MongoDB Atlas IP whitelisting
6. **Use app-specific passwords** - For email services like Gmail

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` includes the exact frontend URL (with `https://`)
- Check that the frontend URL matches exactly (no trailing slashes)
- Ensure Socket.io CORS is also configured (handled automatically)

### Database Connection Issues
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

### Email Not Sending
- Verify SMTP credentials are correct
- Check if your email provider requires app-specific passwords
- Test SMTP connection with a simple email client first
- Check Render logs for email-related errors

### Authentication Issues
- Verify `JWT_SECRET` is set and consistent
- Check token expiration settings
- Ensure cookies are being sent (check browser dev tools)

## Environment Variable Template

Create a `.env.example` file (do not commit actual `.env`):

```env
# Server
NODE_ENV=production
PORT=5000

# CORS (Critical for Render)
FRONTEND_URL=https://virtualxam-fp5e.onrender.com,http://localhost:5173

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your-strong-random-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
SESSION_SECRET=your-strong-random-secret-minimum-32-characters

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=https://virtualxam-fp5e.onrender.com

# OTP (Optional)
OTP_MAX_ATTEMPTS=5
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
```

## Additional Notes

- The application will use default values for optional variables if not set
- Some defaults may not be suitable for production (e.g., `SESSION_SECRET`)
- Always test in a staging environment before deploying to production
- Monitor Render logs after deployment to catch any configuration issues early

