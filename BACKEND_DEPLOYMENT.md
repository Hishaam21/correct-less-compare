## 🚀 Deployment & Production Guide

Complete guide for deploying the Less Compare backend to production.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console.error warnings
- [ ] No unhandled promise rejections
- [ ] Code reviewed for security
- [ ] Secrets not hardcoded

### Configuration
- [ ] Environment variables configured
- [ ] Database credentials set
- [ ] API keys secured
- [ ] CORS origins configured properly
- [ ] Rate limits appropriate for traffic

### Performance
- [ ] Cache TTL optimized (24h default)
- [ ] Request delays appropriate (2-4s)
- [ ] Circuit breaker thresholds tested
- [ ] Load tested at 2x expected peak

### Monitoring
- [ ] Logging set up
- [ ] Error tracking configured
- [ ] Health check endpoints working
- [ ] Alerting rules configured

### Security
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled (in production)
- [ ] Admin endpoints protected
- [ ] CORS properly configured

---

## 🐳 Docker Deployment

### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r)=>{if(r.statusCode!==200)throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server-new.js"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  less-compare-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
      - PORT=3000
    volumes:
      - ./cache:/app/.cache              # Persist cache between restarts
      - ./logs:/app/logs                 # Persist logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  cache:
  logs:
```

### Deploy

```bash
# Build image
docker build -t less-compare:1.0.0 .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY="your-key" \
  -e EMAIL_USER="your-email" \
  -e EMAIL_PASSWORD="your-pass" \
  -v cache:/app/.cache \
  less-compare:1.0.0

# Using docker-compose
docker-compose up -d

# View logs
docker-compose logs -f less-compare-api

# Stop
docker-compose down
```

---

## ☁️ Cloud Deployment

### Heroku

```bash
# Create app
heroku create less-compare-api

# Set environment variables
heroku config:set OPENAI_API_KEY="your-key"
heroku config:set EMAIL_USER="your-email"
heroku config:set EMAIL_PASSWORD="your-pass"

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=2
```

Create `Procfile`:
```
web: node server-new.js
```

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 less-compare-api

# Create environment
eb create production

# Set environment variables
eb setenv OPENAI_API_KEY="your-key"

# Deploy
eb deploy

# Monitor
eb status
eb logs
```

Create `.ebextensions/nodecommand.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "node server-new.js"
```

### Google Cloud Run

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/less-compare

# Deploy
gcloud run deploy less-compare \
  --image gcr.io/PROJECT_ID/less-compare \
  --port 3000 \
  --memory 512Mi

# Set environment variables
gcloud run deploy less-compare \
  --set-env-vars OPENAI_API_KEY="your-key"
```

---

## 🔧 PM2 Process Management

### Installation
```bash
npm install -g pm2
```

### Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'less-compare-api',
    script: './server-new.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Monitor and alert
    monitor_interval: 5000,
    max_memory_restart: '500M'
  }]
}
```

### Commands
```bash
# Start
pm2 start ecosystem.config.js

# Restart
pm2 restart less-compare-api

# Stop
pm2 stop less-compare-api

# Logs
pm2 logs less-compare-api

# Monitor
pm2 monit

# Setup auto-start on reboot
pm2 startup
pm2 save

# Status
pm2 status
```

---

## 🔐 Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/less-compare

upstream less_compare {
    server localhost:3000;
    server localhost:3001;  # Load balance across 2 instances
    keepalive 64;
}

server {
    listen 80;
    server_name api.lesscompare.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.lesscompare.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.lesscompare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lesscompare.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting at Nginx level (additional layer)
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy configuration
    location / {
        proxy_pass http://less_compare;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Cache static content
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache API responses
    location /api/search {
        proxy_pass http://less_compare;
        
        # Cache successful responses for 24h
        proxy_cache_valid 200 24h;
        proxy_cache_use_stale error timeout invalid_header updating;
        
        # Add cache status header
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/less-compare /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 📊 Monitoring & Alerts

### Health Checks

Setup monitoring script (`monitor.sh`):
```bash
#!/bin/bash

while true; do
  # Check API health
  health=$(curl -s http://localhost:3000/api/health)
  
  if [ $? -ne 0 ]; then
    echo "❌ API DOWN at $(date)" | mail -s "Alert" admin@lesscompare.com
  fi

  # Check circuit breakers
  circuit=$(curl -s http://localhost:3000/api/search/health)
  open_count=$(echo $circuit | jq '.stores | map(select(.state=="OPEN")) | length')
  
  if [ "$open_count" -gt 2 ]; then
    echo "⚠️ Multiple circuit breakers open: $circuit" | mail -s "Alert" admin@lesscompare.com
  fi

  sleep 60
done
```

### Datadog Integration

```javascript
// In server-new.js
const StatsD = require('node-statsd').StatsD
const dogstatsd = new StatsD()

app.get('/api/search', async (req, res) => {
  const start = Date.now()
  
  // ... search logic ...
  
  const duration = Date.now() - start
  dogstatsd.timing('api.search.duration', duration)
  dogstatsd.increment('api.search.requests')
  
  if (cached) {
    dogstatsd.increment('cache.hits')
  } else {
    dogstatsd.increment('cache.misses')
  }
})
```

### Prometheus Metrics

```javascript
// metrics.js
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits'
})

export { httpRequestDuration, cacheHits }
```

Register metrics endpoint:
```javascript
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(promClient.register.metrics())
})
```

---

## 🚨 Error Handling in Production

### Sentry Integration

```bash
npm install @sentry/node
```

```javascript
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
})

app.use(Sentry.Handlers.errorHandler())

// Capture errors
try {
  await searchFunction()
} catch (error) {
  Sentry.captureException(error)
}
```

### Email Alerts

```javascript
// alert.js
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_PASSWORD
  }
})

export async function alertError(subject, message) {
  if (process.env.NODE_ENV === 'production') {
    await transporter.sendMail({
      from: process.env.ALERT_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 ${subject}`,
      html: `<p>${message}</p><p>Time: ${new Date().toISOString()}</p>`
    })
  }
}
```

---

## 🔄 Backup & Recovery

### Cache Backup
```bash
# Daily backup
0 2 * * * tar -czf /backups/cache-$(date +\%Y\%m\%d).tar.gz /app/.cache/

# Keep last 30 days
find /backups -name "cache-*.tar.gz" -mtime +30 -delete
```

### Database Backup
```bash
# Full backup before deployment
pg_dump less_compare > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
psql less_compare < backup-20250114-100000.sql
```

### Rollback Procedure
```bash
# Keep previous version running
pm2 start server-old.js --name "less-compare-backup"

# Switch traffic if needed
# Update ecosystem.config.js, then:
pm2 reload ecosystem.config.js
```

---

## 🎯 Performance Optimization

### Caching Layers

**1. Application Cache (24 hours)**
- Built-in, enabled by default
- Cache hits: <100ms response

**2. Redis Cache (optional, for horizontal scaling)**
```javascript
import redis from 'redis'

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
})

// Check Redis before local cache
const cached = await client.get(query)
```

**3. CDN Cache (if applicable)**
- Cache GET endpoints at CDN level
- Set Cache-Control headers

### Database Connection Pooling
```javascript
// postgres pool example
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})
```

### Request Compression
```javascript
import compression from 'compression'

app.use(compression())
```

---

## 📈 Scaling Strategy

### Vertical Scaling (Single Server)
- Increase CPU/RAM
- Adjust PM2 instances to max
- Monitor memory usage
- Works for ~1000 req/min

### Horizontal Scaling (Multiple Servers)
```bash
# Load balancer (Nginx/HAProxy) fronts multiple instances
Server 1 (port 3000)
Server 2 (port 3000)  ← Load Balancer → Nginx
Server 3 (port 3000)
```

Shared Redis cache:
```javascript
// All instances share same Redis cache
// Ensures cache consistency
```

---

## 🚀 Deployment Steps

```bash
# 1. Prepare
git checkout -b deploy/prod
npm run build  # if build step exists
npm test

# 2. Version
npm version patch  # v1.0.1
git tag v1.0.1
git push origin --tags

# 3. Deploy
git push origin deploy/prod
# CI/CD triggers tests and deployment

# 4. Verify
curl https://api.lesscompare.com/api/health

# 5. Monitor
pm2 logs less-compare-api
curl https://api.lesscompare.com/api/search/health

# 6. Rollback if needed
git rollback v1.0.0
pm2 restart less-compare-api
```

---

## 📊 Expected Production Metrics

- **Uptime:** 99.9%+
- **Response time (cached):** <50ms
- **Response time (fresh):** 15-25 seconds
- **Request latency (p50):** 100ms
- **Request latency (p95):** 2000ms (slow scrapes)
- **Error rate:** <0.1%
- **Cache hit rate:** 80-90%

---

**Last Updated:** January 14, 2025
**Version:** 1.0.0 Production Ready
