# SignalPro Deployment Guide

## Quick Start (Docker Compose)

```bash
# 1. Clone and setup
cp .env.example .env
# Edit .env with your secrets

# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker-compose exec nextjs npx prisma migrate deploy

# 4. Seed admin user
docker-compose exec nextjs node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12).then(hash =>
  prisma.user.create({ data: {
    email: process.env.ADMIN_EMAIL || 'admin@signal.pro',
    username: process.env.ADMIN_USERNAME || 'signal_admin',
    passwordHash: hash,
    role: 'ADMIN',
    bio: 'Official SignalPro analyst.'
  }})
).then(u => console.log('Admin created:', u.username)).finally(() => prisma.\$disconnect());
"
```

## Manual Migration

```bash
# Install deps
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (requires running PostgreSQL)
DATABASE_URL=postgresql://... npx prisma migrate deploy
```

## EMQX Configuration

EMQX Dashboard: http://localhost:18083
- Default user: admin / admin123

### Configure Authentication
1. Go to Access Control → Authentication
2. Add HTTP authentication pointing to your app
3. Or use username/password auth with the configured credentials

### ACL (Topic Authorization)
The `emqx/acl.conf` file configures topic permissions:
- Server can publish to all topics
- Clients can only subscribe (not publish)
- Client topics: signals/#, comments/#, profiles/#, notifications/#

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| REDIS_URL | Redis connection string | Yes |
| JWT_SECRET | JWT signing secret (min 32 chars) | Yes |
| EMQX_WS_URL | EMQX WebSocket URL (server-side) | Yes |
| EMQX_MQTT_USERNAME | Server MQTT username | Yes |
| EMQX_MQTT_PASSWORD | Server MQTT password | Yes |
| NEXT_PUBLIC_EMQX_WS_URL | EMQX WebSocket URL (client-side) | Yes |
| NEXT_PUBLIC_MQTT_USERNAME | Client MQTT username | Yes |
| NEXT_PUBLIC_MQTT_PASSWORD | Client MQTT password | Yes |
| ADMIN_EMAIL | Initial admin email | Optional |
| ADMIN_PASSWORD | Initial admin password | Optional |

## Scaling

### Horizontal Scaling (Next.js)
- All state in PostgreSQL/Redis — stateless app servers
- Run multiple Next.js instances behind load balancer
- MQTT publishing happens via EMQX REST API (no direct connections from app)

### EMQX Clustering
```yaml
# Add to docker-compose for clustering
emqx2:
  image: emqx/emqx:5.7.0
  environment:
    EMQX_CLUSTER__DISCOVERY_STRATEGY: static
    EMQX_CLUSTER__STATIC__SEEDS: "emqx@emqx1"
```

### Redis
- Use Redis Cluster or Redis Sentinel for HA
- Current config: single instance with LRU eviction

### Performance Targets
- 1000+ concurrent WebSocket connections: EMQX handles this natively
- Query performance: all hot paths indexed, Redis caches 30-120s TTL
- Connection pooling: pg adapter uses connection pool by default

## Security Checklist

- [ ] Change JWT_SECRET to random 64-char string
- [ ] Change all default passwords
- [ ] Enable TLS on EMQX (port 8084 for WSS)
- [ ] Set EMQX ACL to restrict client publishing
- [ ] Enable EMQX authentication (not anonymous)
- [ ] Use HTTPS in production (reverse proxy)
- [ ] Set secure cookie flag (auto-enabled when NODE_ENV=production)
