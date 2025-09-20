# 🚀 AWS Deployment Guide - Juice Jockey

## 📋 **Overview**

This guide provides step-by-step instructions for deploying your Juice Jockey application to AWS using multiple hosting options. Choose the option that best fits your needs and budget.

---

## 🎯 **Deployment Options**

### **Option 1: AWS S3 + CloudFront (Recommended)**
- **Cost**: $5-20/month
- **Performance**: Excellent (Global CDN)
- **Scalability**: Automatic
- **Maintenance**: Minimal

### **Option 2: AWS Amplify**
- **Cost**: $15-50/month
- **Performance**: Excellent
- **Features**: CI/CD, Custom domains, SSL
- **Maintenance**: None

### **Option 3: AWS EC2**
- **Cost**: $20-100/month
- **Performance**: Good
- **Control**: Full control
- **Maintenance**: High

---

## 🚀 **Option 1: S3 + CloudFront Deployment (Recommended)**

### **Step 1: Prepare Your Application**

```bash
# 1. Build your application for production
npm run build:prod

# 2. Verify the build
ls -la dist/
```

### **Step 2: Create S3 Bucket**

1. **Login to AWS Console**
   - Go to [AWS Console](https://console.aws.amazon.com)
   - Navigate to S3 service

2. **Create Bucket**
   ```
   Bucket name: juice-jockey-app-[your-unique-id]
   Region: us-east-1 (or your preferred region)
   Block all public access: Uncheck (we'll configure this later)
   ```

3. **Configure Bucket for Static Website Hosting**
   - Go to Properties tab
   - Scroll to "Static website hosting"
   - Enable static website hosting
   - Index document: `index.html`
   - Error document: `index.html` (for SPA routing)

### **Step 3: Upload Your Application**

```bash
# Install AWS CLI (if not already installed)
# Windows: Download from AWS website
# Mac: brew install awscli
# Linux: sudo apt-get install awscli

# Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, Region, Output format

# Upload your application
aws s3 sync dist/ s3://juice-jockey-app-[your-unique-id] --delete

# Set proper permissions
aws s3api put-bucket-policy --bucket juice-jockey-app-[your-unique-id] --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::juice-jockey-app-[your-unique-id]/*"
    }
  ]
}'
```

### **Step 4: Create CloudFront Distribution**

1. **Navigate to CloudFront**
   - Go to CloudFront service in AWS Console
   - Click "Create Distribution"

2. **Configure Distribution**
   ```
   Origin Domain: juice-jockey-app-[your-unique-id].s3-website-us-east-1.amazonaws.com
   Origin Path: (leave empty)
   Origin ID: juice-jockey-app-origin
   
   Default Cache Behavior:
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache Policy: CachingOptimized
   
   Distribution Settings:
   - Price Class: Use All Edge Locations
   - Alternate Domain Names: your-domain.com (if you have one)
   - SSL Certificate: Request or Import a Certificate
   - Default Root Object: index.html
   ```

3. **Configure Error Pages**
   - Go to Error Pages tab
   - Create custom error response:
     ```
     HTTP Error Code: 403
     Error Caching Minimum TTL: 0
     Customize Error Response: Yes
     Response Page Path: /index.html
     HTTP Response Code: 200
     ```
   - Repeat for 404 errors

### **Step 5: Configure Environment Variables**

1. **Create .env file for production**
   ```bash
   # Create production environment file
   cp env.example .env.production
   ```

2. **Update .env.production**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=Juice Jockey
   VITE_APP_VERSION=1.0.0
   VITE_ENABLE_DEBUG=false
   VITE_ENABLE_CONSOLE_LOGS=false
   ```

3. **Rebuild with production environment**
   ```bash
   npm run build:prod
   aws s3 sync dist/ s3://juice-jockey-app-[your-unique-id] --delete
   ```

---

## 🚀 **Option 2: AWS Amplify Deployment**

### **Step 1: Prepare Repository**

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/juice-jockey.git
   git push -u origin main
   ```

### **Step 2: Deploy with Amplify**

1. **Navigate to AWS Amplify**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"

2. **Connect Repository**
   ```
   Repository: GitHub (or your Git provider)
   Branch: main
   Build settings: Use default buildspec
   ```

3. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build:prod
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Set Environment Variables**
   ```
   VITE_SUPABASE_URL: https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY: your-anon-key-here
   VITE_APP_NAME: Juice Jockey
   VITE_APP_VERSION: 1.0.0
   VITE_ENABLE_DEBUG: false
   VITE_ENABLE_CONSOLE_LOGS: false
   ```

5. **Deploy**
   - Click "Save and deploy"
   - Wait for deployment to complete

---

## 🚀 **Option 3: EC2 Deployment**

### **Step 1: Launch EC2 Instance**

1. **Choose Instance Type**
   ```
   Instance Type: t3.micro (free tier) or t3.small
   AMI: Ubuntu Server 22.04 LTS
   Storage: 20 GB gp3
   Security Group: HTTP (80), HTTPS (443), SSH (22)
   ```

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### **Step 2: Install Dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

### **Step 3: Deploy Application**

```bash
# Clone your repository
git clone https://github.com/yourusername/juice-jockey.git
cd juice-jockey

# Install dependencies
npm install

# Build application
npm run build:prod

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'juice-jockey',
    script: 'serve',
    args: '-s dist -l 3000',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Install serve globally
sudo npm install -g serve

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Step 4: Configure Nginx**

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/juice-jockey

# Add configuration
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/juice-jockey /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 **SSL Certificate Setup**

### **Using AWS Certificate Manager (Recommended)**

1. **Request Certificate**
   - Go to AWS Certificate Manager
   - Request public certificate
   - Add your domain names
   - Validate domain ownership

2. **For CloudFront**
   - Certificate is automatically available in CloudFront
   - Select certificate in distribution settings

3. **For EC2 (Let's Encrypt)**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get certificate
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   
   # Auto-renewal
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

---

## 📊 **Monitoring & Logging Setup**

### **CloudWatch Setup**

1. **Create Log Groups**
   ```bash
   aws logs create-log-group --log-group-name /aws/amplify/juice-jockey
   ```

2. **Set up Alarms**
   - Go to CloudWatch → Alarms
   - Create alarms for:
     - High error rates
     - High response times
     - Low availability

### **Error Tracking (Sentry)**

1. **Install Sentry**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Configure Sentry**
   ```typescript
   // src/main.tsx
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production",
   });
   ```

---

## 🔧 **Database Setup (Supabase)**

### **Production Database Configuration**

1. **Update Supabase Settings**
   - Go to Supabase Dashboard
   - Navigate to Settings → API
   - Copy production URL and anon key

2. **Configure RLS Policies**
   - Ensure all Row Level Security policies are enabled
   - Test policies in production environment

3. **Set up Database Backups**
   - Enable automated backups in Supabase
   - Set up point-in-time recovery

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variables configured
- [ ] Production build tested
- [ ] Database schema deployed
- [ ] SSL certificate ready
- [ ] Domain configured
- [ ] Monitoring setup

### **Post-Deployment**
- [ ] Test all functionality
- [ ] Verify SSL certificate
- [ ] Check performance metrics
- [ ] Set up monitoring alerts
- [ ] Configure backups
- [ ] Update DNS records

---

## 💰 **Cost Estimation**

### **S3 + CloudFront (Recommended)**
```
S3 Storage (1GB): $0.023/month
CloudFront (1TB transfer): $85/month
Route 53 (if using custom domain): $0.50/month
Total: ~$85-100/month
```

### **Amplify**
```
Build minutes: $0.01/minute
Hosting: $0.15/GB
Data transfer: $0.15/GB
Total: ~$15-50/month
```

### **EC2**
```
t3.micro (free tier): $0/month (first 12 months)
t3.small: $15/month
Data transfer: $0.09/GB
Total: ~$15-30/month
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   npm install
   npm run build:prod
   ```

2. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Rebuild after changing variables
   - Check browser network tab for errors

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Test connection in Supabase dashboard

4. **SSL Certificate Issues**
   - Verify domain ownership
   - Check DNS propagation
   - Wait 24-48 hours for full propagation

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks**
- [ ] Weekly: Check error logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Review security settings
- [ ] Annually: Review and update SSL certificates

### **Emergency Contacts**
- AWS Support: [AWS Support Center](https://console.aws.amazon.com/support/)
- Supabase Support: [Supabase Support](https://supabase.com/support)

---

**🎉 Congratulations! Your Juice Jockey application is now ready for production deployment on AWS!**

*Last updated: $(date)*

0.............

