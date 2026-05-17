# Guide de déploiement client

## Architecture

- **Ycode (admin)** → Netlify (HTTPS)
- **Supabase (base de données)** → VPS OVH (HTTPS via Let's Encrypt)
- **Domaine** → Netlify DNS

## 1. Provision VPS OVH

Créer un VPS OVH (Canada) :
- Modèle : **VPS-1** (4 vCPU, 8 GB RAM)
- OS : **Ubuntu 24.04**
- Localisation : **Beauharnois (BHS)**

Noter l'IP du VPS.

## 2. Config initiale VPS

```bash
ssh root@<IP_DU_VPS>

# Mise à jour système
apt update && apt upgrade -y

# Installer Docker + Docker Compose
apt install -y docker.io docker-compose-v2

# Créer utilisateur non-root
adduser ubuntu
usermod -aG docker ubuntu

# Activer le port 80 (Let's Encrypt)
ufw allow 80
ufw allow 443
ufw allow 22
ufw enable
```

## 3. Installer Supabase

```bash
ssh ubuntu@<IP_DU_VPS>

# Cloner Supabase
git clone --depth 1 https://github.com/supabase/supabase ~/supabase
cd ~/supabase/docker

# Copier .env et générer les clés
cp .env.example .env
cp .env.example .env
```

Éditer `.env` et configurer les valeurs de base :
```
POSTGRES_PASSWORD=<mot_de_passe_fort>
JWT_SECRET=<secret_fort>
SITE_URL=http://<IP_DU_VPS>:8000
API_EXTERNAL_URL=http://<IP_DU_VPS>:8000
```

```bash
# Générer les clés API
./generate-keys.sh

# Démarrer Supabase
docker compose up -d

# Attendre la santé (30s)
docker compose ps
```

## 4. Appliquer les migrations Ycode

```bash
# Copier le dossier database depuis le repo Ycode
# Depuis la machine locale :
cd /chemin/vers/ycode
rsync -avz database/migrations/ ubuntu@<IP_VPS>:~/migrations/

# Ou depuis le VPS, cloner le fork Ycode :
git clone https://github.com/<org>/ycode.git ~/ycode

# Exécuter les migrations via l'API Supabase Studio
# Ou manuellement via psql :
PGPASSWORD=<POSTGRES_PASSWORD> psql -h localhost -p 5433 \
  -U supabase_admin -d postgres -f migration.sql
```

## 5. Exposer PostgreSQL (port 5433)

Éditer `~/supabase/docker/docker-compose.yml` :

```yaml
  db:
    container_name: supabase-db
    ports:
      - "5433:5432"
    # ... reste identique
```

```bash
docker compose up -d db
```

## 6. Configurer le domaine + SSL

### 6.1 DNS (Netlify)

Dans la console DNS Netlify, ajouter :

| Name | Type | Value |
|------|------|-------|
| `supabase.<client>` | A | `<IP_DU_VPS>` |

### 6.2 Nginx + Let's Encrypt (sur le VPS)

```bash
# Installer Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Créer la config Nginx
sudo tee /etc/nginx/sites-available/supabase << EOF
server {
    listen 80;
    server_name supabase.<client>.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# Activer le site
sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d supabase.<client>.com \
  --non-interactive --agree-tos --email admin@<client>.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

### 6.3 Mettre à jour Supabase

```bash
cd ~/supabase/docker

# Remplacer les URLs HTTP par HTTPS
sed -i "s|SITE_URL=http://.*|SITE_URL=https://supabase.<client>.com|" .env
sed -i "s|API_EXTERNAL_URL=http://.*|API_EXTERNAL_URL=https://supabase.<client>.com|" .env
sed -i "s|SUPABASE_PUBLIC_URL=http://.*|SUPABASE_PUBLIC_URL=https://supabase.<client>.com|" .env

# Redémarrer le stack
docker compose down && docker compose up -d
```

## 7. Configurer Ycode sur Netlify

### 7.1 Forker Ycode

1. Forker `ycode/ycode` sous l'org GitHub de l'agence
2. Cloner localement

### 7.2 Créer le site Netlify

```bash
# Lier et déployer
npx netlify-cli sites:create --name "<client>-ycode" --team "<team>"
npx netlify-cli deploy --prod --build
```

### 7.3 Configurer les variables d'environnement

```bash
npx netlify-cli env:set SUPABASE_URL "https://supabase.<client>.com"
npx netlify-cli env:set SUPABASE_ANON_KEY "<ANON_KEY>"
npx netlify-cli env:set SUPABASE_SERVICE_ROLE_KEY "<SERVICE_ROLE_KEY>"
npx netlify-cli env:set SUPABASE_CONNECTION_URL "postgresql://supabase_admin:<DB_PASS>@<IP_VPS>:5433/postgres"
npx netlify-cli env:set SUPABASE_DB_PASSWORD "<POSTGRES_PASSWORD>"
npx netlify-cli env:set JWT_SECRET "<JWT_SECRET>"
npx netlify-cli env:set PAGE_AUTH_SECRET "<secret_random>"
```

### 7.4 Domaine personnalisé

Dans Netlify Dashboard :
1. **Site settings → Domain management → Custom domains**
2. Ajouter `admin.<client>.com`
3. Netlify configurera le DNS automatiquement

Ou manuellement dans Netlify DNS :

| Name | Type | Value |
|------|------|-------|
| `admin` | CNAME | `<client>-ycode.netlify.app` |

### 7.5 Connecter GitHub et déployer

1. Dans Netlify Dashboard : **Site settings → Build & deploy → Link to GitHub**
2. Sélectionner le fork
3. Le build se lance automatiquement

## 8. Créer le compte admin

```bash
# Récupérer les clés depuis supabase/docker/.env
ANON_KEY=<ANON_KEY>
SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

# Créer l'utilisateur admin
curl -s -X POST "https://supabase.<client>.com/auth/v1/admin/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@<client>.com","password":"<mot_de_passe>","email_confirm":true}'
```

## 9. Vérification

- `https://admin.<client>.com/ycode` → connexion admin
- `https://supabase.<client>.com` → Supabase Studio
- `https://supabase.<client>.com/rest/v1/` → API (HTTP 200 avec apikey)

## Variables sensibles à stocker

| Variable | Source |
|----------|--------|
| POSTGRES_PASSWORD | `supabase/docker/.env` |
| JWT_SECRET | `supabase/docker/.env` |
| ANON_KEY | `supabase/docker/.env` |
| SERVICE_ROLE_KEY | `supabase/docker/.env` |
| SUPABASE_URL | `https://supabase.<client>.com` |
| DB connection string | `postgresql://supabase_admin:<DB_PASS>@<IP>:5433/postgres` |
| IP du VPS | Console OVH |
