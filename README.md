# HotSpot Billing System

A comprehensive full-stack hotspot billing system with M-Pesa integration, admin panel, and MikroTik RouterOS compatibility.

## Features

### Frontend (Captive Portal)
- Beautiful, responsive captive portal interface
- Phone number-based authentication
- Internet plan selection with real-time pricing
- M-Pesa STK Push payment integration
- Payment status tracking with real-time updates
- Voucher code generation and display

### Backend API
- RESTful API built with Node.js and Express
- MongoDB database with Mongoose ODM
- M-Pesa Daraja API integration (STK Push & Callbacks)
- Unique voucher generation with expiry management
- User session management and tracking
- Transaction logging and verification

### Admin Panel
- Comprehensive dashboard with system statistics
- Plan management (CRUD operations)
- Transaction monitoring and payment logs
- Voucher management with bulk generation
- User session monitoring with real-time data usage
- System health monitoring

### MikroTik/CoovaChilli Integration
- RADIUS-compatible authentication endpoints
- Session accounting and data usage tracking
- User status monitoring
- Automatic session termination on limits

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- M-Pesa Developer Account (Safaricom Daraja API)

### Setup

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/hotspot-billing

   # M-Pesa Credentials (Sandbox)
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=your_passkey

   # Server
   PORT=5000
   BASE_URL=http://localhost:5000
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB service
   # Then seed sample data
   node server/seed.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   This starts both the frontend (Vite) and backend (Express) servers concurrently.

## Usage

### Captive Portal
- Access the captive portal at `http://localhost:5173`
- Enter phone number to authenticate
- Select an internet plan
- Complete M-Pesa payment
- Receive voucher code for internet access

### Admin Panel
- Access admin panel at `http://localhost:5173/admin`
- View dashboard statistics
- Manage internet plans
- Monitor transactions and vouchers
- Track user sessions

### MikroTik Integration

Add the following configurations to your MikroTik RouterOS:

```routeros
# RADIUS Configuration
/radius
add address=your-server-ip secret=shared-secret service=login,accounting

# Hotspot Configuration
/ip hotspot profile
set hsprof1 login-by=http-chap,http-pap radius-default-domain=""

# HTTP API for user authentication
/ip hotspot walled-garden
add dst-host=your-server-ip
```

API Endpoints for MikroTik:
- Authentication: `POST /api/mikrotik/auth`
- Accounting: `POST /api/mikrotik/accounting`
- Status Check: `GET /api/mikrotik/status/:username`

## API Documentation

### Authentication
- `POST /api/auth/login` - User login/registration

### Plans
- `GET /api/plans` - Get all active plans
- `GET /api/plans/:id` - Get specific plan

### Payments
- `POST /api/payments/mpesa/stkpush` - Initiate M-Pesa payment
- `POST /api/payments/mpesa/callback` - M-Pesa callback handler
- `GET /api/payments/status/:transactionId` - Check payment status

### Vouchers
- `POST /api/vouchers/validate` - Validate voucher code
- `POST /api/vouchers/use` - Use voucher (start session)

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/plans` - Manage plans
- `GET /api/admin/transactions` - Transaction logs
- `GET /api/admin/vouchers` - Voucher management
- `GET /api/admin/sessions` - Session monitoring

## M-Pesa Integration

### Sandbox Setup
1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create a new app and get Consumer Key & Secret
3. Configure STK Push test credentials
4. Update `.env` file with your credentials

### Production Setup
- Replace sandbox URLs with production endpoints
- Update credentials with live app credentials
- Ensure proper SSL certificate for callbacks
- Configure proper callback URLs

## Security Features

- Input validation and sanitization
- MongoDB injection protection
- Rate limiting on API endpoints
- Secure voucher code generation
- Transaction verification
- Session management with expiry

## Deployment

### Production Deployment
1. Set up MongoDB Atlas or dedicated MongoDB server
2. Configure production M-Pesa credentials
3. Set up SSL certificates
4. Configure environment variables
5. Deploy to cloud provider (AWS, DigitalOcean, etc.)

### Docker Deployment
```dockerfile
# Dockerfile included for containerized deployment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "server/index.js"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## Roadmap

- [ ] SMS notifications for voucher delivery
- [ ] Email receipt system
- [ ] Multi-currency support
- [ ] Advanced reporting and analytics
- [ ] Mobile app for admin panel
- [ ] Integration with other payment providers
- [ ] Bandwidth throttling controls
- [ ] User portal for account management