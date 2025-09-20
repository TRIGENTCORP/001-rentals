# 🆓 AWS Free Tier Deployment Guide - Juice Jockey

## 🎯 **Perfect for AWS Free Tier Users!**

Your Juice Jockey application is ideal for AWS Free Tier deployment. Here's your optimized guide:

---

## 💰 **AWS Free Tier Benefits (12 Months)**

### **What You Get for FREE:**
- **S3**: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- **CloudFront**: 1 TB data transfer, 10,000,000 HTTP requests
- **EC2**: 750 hours/month of t2.micro or t3.micro instances
- **Route 53**: 1 hosted zone, 1 million queries
- **Lambda**: 1 million requests, 400,000 GB-seconds
- **API Gateway**: 1 million API calls

---

## 🚀 **Recommended Free Tier Deployment Options**

### **Option 1: S3 + CloudFront (Static Hosting)**
- ✅ **S3**: 5GB free storage (your app is ~1MB)
- ✅ **CloudFront**: 1TB free transfer (more than enough)
- ✅ **No server maintenance**
- ✅ **Automatic scaling**
- ✅ **Global CDN included**
- ✅ **Perfect for static React apps**

### **Option 2: Docker on EC2 (Containerized)**
- ✅ **EC2**: 750 hours/month free (t2.micro)
- ✅ **Docker**: Containerized deployment
- ✅ **Full control over environment**
- ✅ **Easy scaling and updates**
- ✅ **Production-ready with Nginx**

### **Option 3: Hybrid Approach**
- ✅ **Docker**: For development and testing
- ✅ **S3 + CloudFront**: For production deployment
- ✅ **Best of both worlds**

### **Estimated Monthly Cost: $0** (within free tier limits)

---

## 📋 **Detailed Step-by-Step Free Tier Deployment**

## 🐳 **Docker Deployment on EC2 (Free Tier)**

### **Why Choose Docker on EC2?**
- **Full Control**: Complete control over your environment
- **Consistency**: Same environment across development and production
- **Scalability**: Easy to scale with load balancers
- **Security**: Container isolation and security features
- **Updates**: Simple container updates and rollbacks

### **Prerequisites for Docker Deployment**
- Docker installed on your local machine
- AWS CLI configured
- Basic understanding of Docker commands

---

### **Step 1: Prepare Your App for Deployment**

#### **1.1 Install Dependencies**
```bash
# Navigate to your project directory
cd C:\Users\Dell\Desktop\project\juice-jockey-main

# Install all dependencies (if not already done)
npm install

# Verify all packages are installed
npm list --depth=0
```

#### **1.1.1 Docker Setup (For Docker Deployment)**
```bash
# Verify Docker is installed
docker --version
docker-compose --version

# Test Docker installation
docker run hello-world

# Build your Docker image locally (test)
docker build --target production -t juice-jockey-prod .

# Test the production build locally
docker run -p 3000:3000 juice-jockey-prod

# Open browser to http://localhost:3000 to verify
```

#### **1.2 Create Production Environment File**
```bash
# Create .env.production file
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env.production
echo "VITE_SUPABASE_ANON_KEY=your-anon-key-here" >> .env.production
echo "VITE_APP_NAME=Juice Jockey" >> .env.production
echo "VITE_APP_VERSION=1.0.0" >> .env.production
echo "VITE_ENABLE_DEBUG=false" >> .env.production
echo "VITE_ENABLE_CONSOLE_LOGS=false" >> .env.production
```

#### **1.3 Build Your Application**
```bash
# Build for production
npm run build

# Check build size (should be under 5GB!)
dir dist /s
# Expected: ~1-2MB total

# Verify build files exist
dir dist
# Should see: index.html, assets folder, etc.
```

#### **1.4 Test Build Locally (Optional)**
```bash
# Install a simple HTTP server
npm install -g http-server

# Serve the build locally
http-server dist -p 3000

# Open browser to http://localhost:3000
# Test all functionality before deploying
```

---

### **Step 2: Create AWS Account & Get Credentials**

#### **2.1 Create AWS Account**
1. **Go to**: https://aws.amazon.com/free/
2. **Click**: "Create Free Account"
3. **Fill out**: Email, password, account name
4. **Verify**: Email address
5. **Choose**: Personal account type
6. **Add**: Credit card (won't be charged within free tier)
7. **Verify**: Phone number

#### **2.2 Create IAM User (Security Best Practice)**
1. **AWS Console** → **IAM** → **Users** → **Create User**
2. **User name**: `juice-jockey-deployer`
3. **Access type**: ✅ Programmatic access
4. **Permissions**: Attach policies directly
5. **Policy**: `AmazonS3FullAccess` + `CloudFrontFullAccess`
6. **Review**: Create user
7. **IMPORTANT**: Download CSV with Access Key ID and Secret Access Key

#### **2.3 Install AWS CLI**
**Windows:**
```bash
# Download from: https://aws.amazon.com/cli/
# Run installer as administrator
# Or use PowerShell:
winget install Amazon.AWSCLI
```

**Mac:**
```bash
# Using Homebrew
brew install awscli

# Or using pip
pip install awscli
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install awscli

# CentOS/RHEL
sudo yum install awscli
```

#### **2.4 Configure AWS CLI**
```bash
# Configure with your credentials
aws configure

# Enter the following when prompted:
AWS Access Key ID: [Your Access Key ID from CSV]
AWS Secret Access Key: [Your Secret Access Key from CSV]
Default region name: us-east-1
Default output format: json

# Test configuration
aws sts get-caller-identity
# Should return your user information
```

---

### **Step 3: Create S3 Bucket (FREE)**

#### **3.1 Create S3 Bucket via AWS Console**
1. **AWS Console** → **S3** → **Create Bucket**
2. **Bucket name**: `juice-jockey-[your-name]-[random-number]`
   - Example: `juice-jockey-john-12345`
   - Must be globally unique
   - Use lowercase letters, numbers, hyphens only
3. **Region**: `US East (N. Virginia) us-east-1`
   - Cheapest region for CloudFront
4. **Object Ownership**: ACLs disabled (recommended)
5. **Block Public Access**: ✅ **UNCHECK ALL BOXES**
   - We need public access for website hosting
6. **Bucket Versioning**: Disable (saves money)
7. **Default encryption**: Disable (optional for free tier)
8. **Advanced settings**: Leave default
9. **Click**: Create Bucket

#### **3.2 Enable Static Website Hosting**
1. **Select your bucket** → **Properties** tab
2. **Scroll down** → **Static website hosting**
3. **Click**: Edit
4. **Enable**: Static website hosting
5. **Hosting type**: Host a static website
6. **Index document**: `index.html`
7. **Error document**: `index.html`
8. **Click**: Save changes

#### **3.3 Set Bucket Policy for Public Access**
1. **Select your bucket** → **Permissions** tab
2. **Scroll down** → **Bucket policy**
3. **Click**: Edit
4. **Paste this policy** (replace `your-bucket-name`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```
5. **Click**: Save changes

#### **3.4 Verify Bucket Configuration**
```bash
# Test bucket access
aws s3 ls s3://your-bucket-name
# Should return empty (no files yet)

# Test bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
# Should return the policy we just set
```

---

### **Step 4: Upload Your App to S3 (FREE)**

#### **4.1 Upload Files via AWS CLI**
```bash
# Navigate to your project directory
cd C:\Users\Dell\Desktop\project\juice-jockey-main

# Upload all files from dist/ to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Verify upload
aws s3 ls s3://your-bucket-name --recursive
# Should show all your files

# Check file sizes
aws s3 ls s3://your-bucket-name --recursive --human-readable
```

#### **4.2 Set Proper Content Types**
```bash
# Set correct MIME types for different file types
aws s3 cp dist/index.html s3://your-bucket-name/index.html --content-type "text/html"
aws s3 cp dist/assets/ s3://your-bucket-name/assets/ --recursive --content-type "application/javascript"
aws s3 cp dist/assets/ s3://your-bucket-name/assets/ --recursive --content-type "text/css"
```

#### **4.3 Test Website Access**
1. **Go to**: S3 → Your bucket → Properties → Static website hosting
2. **Copy**: Bucket website endpoint URL
3. **Open**: URL in browser
4. **Verify**: Your app loads correctly

#### **4.4 Troubleshooting Upload Issues**
```bash
# If upload fails, check permissions
aws s3api get-bucket-policy --bucket your-bucket-name

# If files don't show, check sync command
aws s3 sync dist/ s3://your-bucket-name --delete --dryrun
# This shows what would be uploaded without actually doing it

# If access denied, check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
```

---

### **Step 5: Create CloudFront Distribution (FREE)**

#### **5.1 Create CloudFront Distribution**
1. **AWS Console** → **CloudFront** → **Create Distribution**
2. **Origin Domain**: Select your S3 bucket website endpoint
   - Should be: `your-bucket-name.s3-website-us-east-1.amazonaws.com`
   - **NOT** the regular S3 bucket URL
3. **Origin Path**: Leave empty
4. **Origin Access**: Public
5. **Viewer Protocol Policy**: Redirect HTTP to HTTPS
6. **Allowed HTTP Methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
7. **Cache Policy**: CachingDisabled (for development)
8. **Default Root Object**: `index.html`
9. **Price Class**: Use All Edge Locations (Best Performance)
10. **Alternate Domain Names**: Leave empty for now
11. **SSL Certificate**: Default CloudFront Certificate
12. **Click**: Create Distribution

#### **5.2 Configure Error Pages (Critical for React Router)**
1. **Select your distribution** → **Error Pages** tab
2. **Click**: Create Custom Error Response
3. **HTTP Error Code**: 403
4. **Error Caching Minimum TTL**: 0
5. **Customize Error Response**: Yes
6. **Response Page Path**: `/index.html`
7. **HTTP Response Code**: 200
8. **Click**: Create Custom Error Response
9. **Repeat for 404 errors**:
   - HTTP Error Code: 404
   - Error Caching Minimum TTL: 0
   - Customize Error Response: Yes
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

#### **5.3 Wait for Distribution Deployment**
- **Status**: In Progress → Deployed
- **Time**: 15-20 minutes
- **Monitor**: CloudFront console for status updates

#### **5.4 Test CloudFront Distribution**
1. **Copy**: CloudFront domain name (e.g., `d1234567890.cloudfront.net`)
2. **Open**: URL in browser
3. **Verify**: Your app loads correctly
4. **Test**: Navigation between pages (React Router)

#### **5.5 Troubleshooting CloudFront Issues**
```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# If changes aren't visible, invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# Check if distribution is deployed
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --query "Distribution.Status"
```

---

### **Step 6: Set Up Custom Domain (Optional - FREE with Route 53)**

#### **6.1 Buy Domain (if you don't have one)**
**Option A: Route 53 (AWS)**
1. **AWS Console** → **Route 53** → **Registered Domains**
2. **Click**: Register Domain
3. **Search**: Available domain names
4. **Select**: Domain and add to cart
5. **Complete**: Registration process
6. **Cost**: ~$10-15/year

**Option B: External Provider**
- GoDaddy, Namecheap, Google Domains, etc.
- Cost: ~$10-15/year

#### **6.2 Create Hosted Zone in Route 53**
1. **AWS Console** → **Route 53** → **Hosted Zones**
2. **Click**: Create Hosted Zone
3. **Domain name**: `yourdomain.com`
4. **Type**: Public hosted zone
5. **Click**: Create Hosted Zone

#### **6.3 Update Nameservers**
1. **Route 53** → **Hosted Zones** → **Your domain**
2. **Copy**: All 4 nameservers (e.g., `ns-123.awsdns-12.com`)
3. **Go to**: Your domain registrar
4. **Update**: Nameservers to Route 53 nameservers
5. **Wait**: 24-48 hours for propagation

#### **6.4 Create SSL Certificate**
1. **AWS Console** → **Certificate Manager**
2. **Click**: Request a certificate
3. **Certificate type**: Request a public certificate
4. **Domain names**: `yourdomain.com` and `*.yourdomain.com`
5. **Validation method**: DNS validation
6. **Click**: Request
7. **Add DNS records**: Copy CNAME records to Route 53
8. **Wait**: 5-30 minutes for validation

#### **6.5 Update CloudFront Distribution**
1. **CloudFront** → **Your distribution** → **Settings**
2. **Click**: Edit
3. **Alternate Domain Names**: Add `yourdomain.com`
4. **SSL Certificate**: Select your custom certificate
5. **Click**: Save changes
6. **Wait**: 15-20 minutes for deployment

#### **6.6 Create DNS Records**
1. **Route 53** → **Hosted Zones** → **Your domain**
2. **Click**: Create Record
3. **Record name**: Leave empty (for root domain)
4. **Record type**: A
5. **Alias**: Yes
6. **Route traffic to**: Alias to CloudFront distribution
7. **Select**: Your CloudFront distribution
8. **Click**: Create Records

#### **6.7 Test Custom Domain**
1. **Wait**: 24-48 hours for DNS propagation
2. **Open**: `https://yourdomain.com`
3. **Verify**: SSL certificate is valid
4. **Test**: All app functionality

---

### **Step 7: Set Up Monitoring & Alerts (FREE)**

#### **7.1 Set Up Billing Alerts**
1. **AWS Console** → **Billing** → **Billing Preferences**
2. **Click**: Edit
3. **Set up alerts**:
   - **$1.00**: Warning (first alert)
   - **$5.00**: Critical (approaching free tier limit)
   - **$10.00**: Emergency (exceeded free tier)
4. **Email notifications**: Add your email
5. **Click**: Save preferences

#### **7.2 Monitor Usage in CloudWatch**
1. **AWS Console** → **CloudWatch** → **Metrics**
2. **S3 Metrics**: Monitor storage and request usage
3. **CloudFront Metrics**: Monitor data transfer and requests
4. **Set up dashboards**: Track free tier usage

#### **7.3 Check Free Tier Usage**
1. **AWS Console** → **Billing** → **Free Tier**
2. **Monitor**: Monthly usage against limits
3. **Track**: S3, CloudFront, Route 53 usage
4. **Alert**: If approaching limits

---

### **Step 8: Final Testing & Verification**

#### **8.1 Test All Functionality**
1. **Open**: Your CloudFront URL or custom domain
2. **Test**: User registration and login
3. **Test**: Password recovery functionality
4. **Test**: Admin dashboard access
5. **Test**: Power bank booking flow
6. **Test**: Payment processing
7. **Test**: Mobile responsiveness

#### **8.2 Performance Testing**
1. **Test**: Page load speeds
2. **Test**: Image loading
3. **Test**: API response times
4. **Test**: Database queries

#### **8.3 Security Testing**
1. **Verify**: HTTPS is working
2. **Test**: Authentication flows
3. **Verify**: Admin access restrictions
4. **Test**: Input validation

---

## 🐳 **Docker Deployment on EC2 - Complete Guide**

### **Step D1: Create EC2 Instance (FREE)**

#### **D1.1 Launch EC2 Instance**
1. **AWS Console** → **EC2** → **Launch Instance**
2. **Name**: `juice-jockey-docker`
3. **AMI**: Amazon Linux 2023 (Free tier eligible)
4. **Instance Type**: t2.micro (Free tier eligible)
5. **Key Pair**: Create new or select existing
6. **Security Group**: Create new with these rules:
   - **SSH (22)**: Your IP
   - **HTTP (80)**: 0.0.0.0/0
   - **HTTPS (443)**: 0.0.0.0/0
   - **Custom (3000)**: 0.0.0.0/0 (for Docker app)
7. **Storage**: 8 GB gp3 (Free tier eligible)
8. **Click**: Launch Instance

#### **D1.2 Connect to EC2 Instance**
```bash
# Replace with your key file and instance IP
ssh -i "your-key.pem" ec2-user@your-instance-ip

# Update system
sudo yum update -y
```

#### **D1.3 Install Docker on EC2**
```bash
# Install Docker
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
sudo usermod -a -G docker ec2-user

# Log out and back in, or run:
newgrp docker

# Verify Docker installation
docker --version
docker run hello-world
```

### **Step D2: Deploy Your Docker App**

#### **D2.1 Upload Your Code to EC2**
**Option A: Using SCP**
```bash
# From your local machine
scp -i "your-key.pem" -r . ec2-user@your-instance-ip:/home/ec2-user/juice-jockey/
```

**Option B: Using Git**
```bash
# On EC2 instance
sudo yum install -y git
git clone https://github.com/your-username/juice-jockey.git
cd juice-jockey
```

#### **D2.2 Configure Environment**
```bash
# Create environment file
nano docker.env

# Add your environment variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Juice Jockey
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_CONSOLE_LOGS=false
NODE_ENV=production
PORT=3000
```

#### **D2.3 Build and Run Docker Container**
```bash
# Build the Docker image
docker build --target production -t juice-jockey-prod .

# Run the container
docker run -d \
  --name juice-jockey-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file docker.env \
  juice-jockey-prod

# Check if container is running
docker ps

# View logs
docker logs juice-jockey-app
```

#### **D2.4 Set Up Nginx Reverse Proxy (Optional)**
```bash
# Install Nginx
sudo yum install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/juice-jockey.conf
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP

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
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### **Step D3: Set Up SSL Certificate (Optional)**

#### **D3.1 Install Certbot**
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### **Step D4: Set Up Auto-Deployment**

#### **D4.1 Create Deployment Script**
```bash
# Create deployment script
nano deploy.sh
```

**Deployment Script:**
```bash
#!/bin/bash
# Save as deploy.sh

echo "Starting deployment..."

# Pull latest changes (if using Git)
git pull origin main

# Stop existing container
docker stop juice-jockey-app || true
docker rm juice-jockey-app || true

# Build new image
docker build --target production -t juice-jockey-prod .

# Run new container
docker run -d \
  --name juice-jockey-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file docker.env \
  juice-jockey-prod

echo "Deployment complete!"
docker ps
```

```bash
# Make script executable
chmod +x deploy.sh

# Test deployment
./deploy.sh
```

#### **D4.2 Set Up GitHub Actions (Optional)**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /home/ec2-user/juice-jockey
          ./deploy.sh
```

### **Step D5: Monitoring and Maintenance**

#### **D5.1 Set Up Monitoring**
```bash
# Install monitoring tools
sudo yum install -y htop

# Create monitoring script
nano monitor.sh
```

**Monitoring Script:**
```bash
#!/bin/bash
echo "=== Docker Container Status ==="
docker ps

echo "=== Container Logs (last 20 lines) ==="
docker logs --tail 20 juice-jockey-app

echo "=== System Resources ==="
free -h
df -h

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager
```

```bash
# Make executable
chmod +x monitor.sh

# Run monitoring
./monitor.sh
```

#### **D5.2 Set Up Log Rotation**
```bash
# Create log rotation script
sudo nano /etc/logrotate.d/docker-containers
```

**Log Rotation Config:**
```
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

### **Step D6: Backup Strategy**

#### **D6.1 Create Backup Script**
```bash
# Create backup script
nano backup.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/juice-jockey-$DATE.tar.gz /home/ec2-user/juice-jockey

# Backup Docker images
docker save juice-jockey-prod | gzip > $BACKUP_DIR/juice-jockey-image-$DATE.tar.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

```bash
# Make executable
chmod +x backup.sh

# Set up cron job for daily backups
crontab -e
# Add this line:
# 0 2 * * * /home/ec2-user/juice-jockey/backup.sh
```

---

### **Step 9: Maintenance & Updates**

#### **9.1 Deploy Updates**
```bash
# When you make changes to your app:

# 1. Build updated version
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 3. Invalidate CloudFront cache (if needed)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# 4. Test the updated version
```

#### **9.2 Backup Strategy**
1. **S3 Versioning**: Enable if needed (costs extra)
2. **Local Backups**: Keep copies of your code
3. **Database Backups**: Supabase handles this automatically

#### **9.3 Monitoring & Maintenance**
1. **Weekly**: Check usage against free tier limits
2. **Monthly**: Review costs and optimize
3. **Quarterly**: Update dependencies and security patches

---

## 💡 **Free Tier Optimization Tips**

### **1. Minimize S3 Costs**
```bash
# Your app is already optimized, but check:
ls -la dist/
# Should be under 5MB total
```

### **2. Optimize CloudFront Caching**
- Set appropriate cache headers
- Use versioned filenames for cache busting
- Enable compression

### **3. Monitor Usage**
- Set up billing alerts at $1, $5, $10
- Monitor S3 and CloudFront usage in AWS Console

---

## 📊 **Free Tier Usage Monitoring**

### **Expected Monthly Usage:**
```
S3 Storage: ~1MB (well under 5GB limit)
S3 Requests: ~1,000 (well under 20,000 limit)
CloudFront Transfer: ~100MB (well under 1TB limit)
CloudFront Requests: ~10,000 (well under 10M limit)
```

### **Set Up Billing Alerts:**
1. **AWS Console → Billing → Billing Preferences**
2. **Set up alerts:**
   - $1.00 (warning)
   - $5.00 (critical)
   - $10.00 (emergency)

---

## 🔧 **Environment Variables for Free Tier**

### **Create .env.production:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Juice Jockey
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_CONSOLE_LOGS=false
```

### **Rebuild and Deploy:**
```bash
npm run build:prod
aws s3 sync dist/ s3://juice-jockey-[your-name]-[random] --delete
```

---

## 🚨 **Free Tier Limits & Warnings**

### **What Could Cost Money:**
- **Exceeding S3 limits**: $0.023/GB/month for storage over 5GB
- **Exceeding CloudFront limits**: $0.085/GB for transfer over 1TB
- **Route 53 queries**: $0.40/million queries over 1M
- **Data transfer out**: $0.09/GB after free tier

### **How to Stay Free:**
- Monitor usage monthly
- Set up billing alerts
- Use CloudWatch to track metrics
- Optimize images and assets

---

## 🆘 **Comprehensive Troubleshooting Guide**

### **Common Problems & Solutions:**

#### **1. "Access Denied" Errors**

**Problem**: Getting 403 Forbidden when accessing your website

**Solutions**:
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# If no policy exists, set it:
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket-name/*"
  }]
}'

# Check bucket public access settings
aws s3api get-public-access-block --bucket your-bucket-name

# If blocked, remove restrictions:
aws s3api delete-public-access-block --bucket your-bucket-name
```

#### **2. CloudFront Not Updating**

**Problem**: Changes not visible after deployment

**Solutions**:
```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --query "Distribution.Status"

# Invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# Wait 15-20 minutes for propagation
# Check CloudFront console for invalidation status
```

#### **3. SSL Certificate Issues**

**Problem**: Certificate not validating or HTTPS not working

**Solutions**:
- **Wait**: 24-48 hours for validation
- **Check DNS**: Ensure CNAME records are correct
- **Verify**: Certificate status in Certificate Manager
- **Test**: SSL Labs SSL Test (https://www.ssllabs.com/ssltest/)

#### **4. React Router Not Working**

**Problem**: Getting 404 errors on page refresh

**Solutions**:
1. **Check Error Pages**: Ensure 403 and 404 errors redirect to `/index.html`
2. **Verify CloudFront**: Check error page configuration
3. **Test**: Navigate to different routes and refresh

#### **5. AWS CLI Authentication Issues**

**Problem**: "Unable to locate credentials" error

**Solutions**:
```bash
# Check current configuration
aws configure list

# Reconfigure if needed
aws configure

# Test with a simple command
aws sts get-caller-identity

# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

#### **6. S3 Upload Failures**

**Problem**: Files not uploading or upload incomplete

**Solutions**:
```bash
# Check permissions
aws s3api get-bucket-policy --bucket your-bucket-name

# Test with dry run
aws s3 sync dist/ s3://your-bucket-name --delete --dryrun

# Check file sizes
ls -la dist/

# Upload individual files if needed
aws s3 cp dist/index.html s3://your-bucket-name/index.html
```

#### **7. Domain Not Resolving**

**Problem**: Custom domain not working

**Solutions**:
- **Check DNS**: Verify nameservers are correct
- **Wait**: 24-48 hours for propagation
- **Test**: Use online DNS checker tools
- **Verify**: Route 53 hosted zone configuration

#### **8. High Costs (Exceeding Free Tier)**

**Problem**: Unexpected charges

**Solutions**:
```bash
# Check current usage
aws cloudwatch get-metric-statistics --namespace AWS/S3 --metric-name BucketSizeBytes --dimensions Name=BucketName,Value=your-bucket-name --start-time 2024-01-01T00:00:00Z --end-time 2024-01-31T23:59:59Z --period 86400 --statistics Average

# Set up billing alerts
# Monitor CloudWatch metrics
# Review S3 and CloudFront usage
```

#### **9. Build Failures**

**Problem**: `npm run build` fails

**Solutions**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build 2>&1 | grep -i error

# Check environment variables
cat .env.production
```

#### **10. Performance Issues**

**Problem**: Slow loading times

**Solutions**:
- **Enable Compression**: CloudFront → Behaviors → Edit
- **Optimize Images**: Use WebP format, compress images
- **Check Cache Headers**: Set appropriate TTL values
- **Monitor**: CloudWatch metrics for performance

#### **11. Docker Container Issues**

**Problem**: Container won't start or crashes

**Solutions**:
```bash
# Check container logs
docker logs juice-jockey-app

# Check container status
docker ps -a

# Restart container
docker restart juice-jockey-app

# Check system resources
free -h
df -h

# Check Docker daemon
sudo systemctl status docker
```

#### **12. Docker Build Failures**

**Problem**: Docker build fails

**Solutions**:
```bash
# Check Dockerfile syntax
docker build --no-cache --target production -t juice-jockey-prod .

# Check available disk space
df -h

# Clean up Docker system
docker system prune -a

# Check for syntax errors in Dockerfile
docker build --target production -t juice-jockey-prod . 2>&1 | grep -i error
```

#### **13. EC2 Connection Issues**

**Problem**: Can't connect to EC2 instance

**Solutions**:
```bash
# Check security group rules
# Ensure SSH (22) is open for your IP

# Check instance status
aws ec2 describe-instances --instance-ids i-your-instance-id

# Check if instance is running
aws ec2 describe-instance-status --instance-ids i-your-instance-id

# Test SSH connection
ssh -i "your-key.pem" -v ec2-user@your-instance-ip
```

#### **14. Nginx Proxy Issues**

**Problem**: Nginx not proxying to Docker container

**Solutions**:
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check if container is running on port 3000
docker ps
netstat -tlnp | grep 3000

# Test direct container access
curl http://localhost:3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### **Debug Commands**

```bash
# Check AWS CLI version
aws --version

# Check S3 bucket contents
aws s3 ls s3://your-bucket-name --recursive

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID

# Check certificate status
aws acm describe-certificate --certificate-arn YOUR_CERTIFICATE_ARN

# Docker Debug Commands
docker --version
docker-compose --version
docker ps -a
docker images
docker logs juice-jockey-app
docker exec -it juice-jockey-app sh
docker system df
docker system prune -a

# EC2 Debug Commands
ssh -i "your-key.pem" ec2-user@your-instance-ip
sudo systemctl status docker
sudo systemctl status nginx
sudo journalctl -u docker -f
sudo journalctl -u nginx -f
```

### **Getting Help**

1. **AWS Documentation**: https://docs.aws.amazon.com/
2. **AWS Support**: Free tier includes basic support
3. **Community Forums**: AWS re:Post, Stack Overflow
4. **Check Logs**: CloudWatch Logs for detailed error information

---

## 📈 **Scaling Beyond Free Tier**

### **When You Outgrow Free Tier:**
- **S3**: Still very cheap (~$0.023/GB/month)
- **CloudFront**: $0.085/GB for additional transfer
- **Consider**: AWS Amplify for easier management

### **Upgrade Path:**
1. **Stay with S3 + CloudFront** (still very cheap)
2. **Move to AWS Amplify** (easier management)
3. **Consider Vercel/Netlify** (alternative platforms)

---

## 🎯 **Quick Start Commands for Free Tier**

## 📊 **Deployment Method Comparison**

| Feature | S3 + CloudFront | Docker on EC2 |
|---------|----------------|---------------|
| **Setup Complexity** | Easy | Medium |
| **Cost** | $0/month | $0/month (free tier) |
| **Scalability** | Automatic | Manual scaling |
| **Updates** | Simple upload | Container rebuild |
| **SSL** | CloudFront handles | Manual setup |
| **Monitoring** | CloudWatch | Manual setup |
| **Backup** | S3 versioning | Manual scripts |
| **Performance** | Global CDN | Single region |
| **Maintenance** | Minimal | Regular updates |

### **Choose Your Deployment Method:**

**Choose S3 + CloudFront if:**
- You want minimal maintenance
- You need global performance
- You prefer serverless architecture
- You want automatic scaling

**Choose Docker on EC2 if:**
- You need full control over environment
- You want to learn DevOps practices
- You plan to add backend services later
- You prefer containerized deployments

---

### **S3 + CloudFront Deployment Script**
```bash
#!/bin/bash
# Save this as deploy-s3.sh and run: chmod +x deploy-s3.sh && ./deploy-s3.sh

# 1. Build your app
echo "Building application..."
npm run build

# 2. Check build size
echo "Checking build size..."
du -sh dist/

# 3. Upload to S3 (replace with your bucket name)
echo "Uploading to S3..."
aws s3 sync dist/ s3://your-bucket-name --delete

# 4. Set bucket policy for public access
echo "Setting bucket policy..."
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket-name/*"
  }]
}'

# 5. Invalidate CloudFront cache (replace with your distribution ID)
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "S3 + CloudFront deployment complete! Your app should be live in 15-20 minutes."
```

### **Docker on EC2 Deployment Script**
```bash
#!/bin/bash
# Save this as deploy-docker.sh and run: chmod +x deploy-docker.sh && ./deploy-docker.sh

echo "Starting Docker deployment..."

# 1. Build Docker image
echo "Building Docker image..."
docker build --target production -t juice-jockey-prod .

# 2. Stop existing container
echo "Stopping existing container..."
docker stop juice-jockey-app || true
docker rm juice-jockey-app || true

# 3. Run new container
echo "Starting new container..."
docker run -d \
  --name juice-jockey-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file docker.env \
  juice-jockey-prod

# 4. Check container status
echo "Checking container status..."
docker ps

# 5. Show logs
echo "Container logs:"
docker logs juice-jockey-app

echo "Docker deployment complete! Your app should be live at http://your-ec2-ip:3000"
```

### **Manual Commands**
```bash
# 1. Build your app
npm run build

# 2. Upload your app
aws s3 sync dist/ s3://your-bucket-name --delete

# 3. Make bucket public
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket-name/*"
  }]
}'

# 4. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 🏆 **Free Tier Success Checklist**

### **S3 + CloudFront Deployment:**
- [ ] S3 bucket created and configured
- [ ] App uploaded to S3
- [ ] Bucket policy set for public access
- [ ] CloudFront distribution created
- [ ] Error pages configured for SPA routing
- [ ] SSL certificate requested (if using custom domain)
- [ ] Billing alerts set up
- [ ] Usage monitoring enabled
- [ ] App tested and working

### **Docker on EC2 Deployment:**
- [ ] EC2 instance created (t2.micro)
- [ ] Docker installed on EC2
- [ ] Security groups configured
- [ ] App code uploaded to EC2
- [ ] Environment variables configured
- [ ] Docker image built successfully
- [ ] Container running and accessible
- [ ] Nginx reverse proxy set up (optional)
- [ ] SSL certificate configured (optional)
- [ ] Monitoring and backup scripts created
- [ ] App tested and working

---

## 💰 **Total Cost: $0/month** (within free tier)

**Your Juice Jockey app is perfect for AWS Free Tier!** 

The static nature of your React app means you'll likely never exceed the free tier limits, making this an excellent choice for hosting your application.

---

*This guide is specifically optimized for AWS Free Tier users. Your app will run completely free for 12 months!*

