# Guide de déploiement client

## Architecture (Option A — 1 VPS par client)

```
┌──────────────────────┐   ┌──────────────────────────────┐
│  admin.bauhem.com    │   │  client.com                  │
│  (Netlify - agence)  │   │  (Netlify - site client)     │
│  Dashboard clients   │   │                               │
└──────────────────────┘   └──────────────────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────────┐   ┌──────────────────────────────┐
│  supabase.client.com  │   │  supabase.client2.com        │
│  (VPS OVH - Client 1) │   │  (VPS OVH - Client 2)       │
│  Supabase + DB        │   │  Supabase + DB               │
└──────────────────────┘   └──────────────────────────────┘
```

Chaque client a :
- **1 VPS OVH dédié** → Supabase + PostgreSQL
- **1 site Netlify** → Ycode builder (fork du repo)
- **1 domaine admin** → `admin.client.com`
- **1 domaine Supabase** → `supabase.client.com`
- **Total revient : ~$10 CAD/mois**
- **Prix client : $49 CAD/mois** → marge ~$39 CAD/mois

L'admin agence (`admin.bauhem.com`) est un site statique / hub vers chaque client.

---

## 1. Provision VPS OVH

Créer un VPS OVH (Canada) :
- Modèle : **VPS-1** (4 vCPU, 8 GB RAM, 75 GB SSD)
- OS : **Ubuntu 24.04**
- Localisation : **Beauharnois (BHS)**

Noter l'IP du VPS.

## 2. Config initiale VPS

```bash
ssh root@<IP_DU_VPS>

apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2

adduser ubuntu
usermod -aG docker ubuntu

ufw allow 80
ufw allow 443
ufw allow 22
ufw enable
```

## 3. Installer Supabase

```bash
ssh ubuntu@<IP_DU_VPS>

git clone --depth 1 https://github.com/supabase/supabase ~/supabase
cd ~/supabase/docker
cp .env.example .env

# Éditer les valeurs de base dans .env :
#   POSTGRES_PASSWORD=<mot_de_passe_fort>
#   JWT_SECRET=<secret_fort>
#   SITE_URL=http://<IP_DU_VPS>:8000
#   API_EXTERNAL_URL=http://<IP_DU_VPS>:8000

./generate-keys.sh
docker compose up -d
```

## 4. Exposer PostgreSQL (port 5433)

Ajouter dans `~/supabase/docker/docker-compose.yml`, section `db:` :

```yaml
  db:
    container_name: supabase-db
    ports:
      - "5433:5432"
```

```bash
docker compose up -d db
```

## 5. Appliquer les migrations Ycode

```bash
# Depuis la machine locale
cd /chemin/vers/ycode
rsync -avz database/migrations/ ubuntu@<IP_VPS>:~/migrations/

# Sur le VPS
for f in ~/migrations/*.sql; do
  echo "Applying $f..."
  PGPASSWORD=<POSTGRES_PASSWORD> psql -h localhost -p 5433 \
    -U supabase_admin -d postgres -f "$f"
done
```

## 6. Configurer le domaine + SSL (VPS)

### 6.1 Ajouter le DNS

Dans Netlify DNS, ajouter :

| Name | Type | Value |
|------|------|-------|
| `supabase.client.com` | A | `<IP_DU_VPS>` |

### 6.2 Nginx + Let's Encrypt

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

sudo tee /etc/nginx/sites-available/supabase << EOF
server {
    listen 80;
    server_name supabase.client.com;

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

sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d supabase.client.com \
  --non-interactive --agree-tos --email admin@bauhem.com

sudo certbot renew --dry-run
```

### 6.3 Mettre à jour Supabase avec HTTPS

```bash
cd ~/supabase/docker
sed -i "s|SITE_URL=http://.*|SITE_URL=https://supabase.client.com|" .env
sed -i "s|API_EXTERNAL_URL=http://.*|API_EXTERNAL_URL=https://supabase.client.com|" .env
sed -i "s|SUPABASE_PUBLIC_URL=http://.*|SUPABASE_PUBLIC_URL=https://supabase.client.com|" .env
echo "ADDITIONAL_REDIRECT_URLS=https://admin.client.com" >> .env

docker compose down && docker compose up -d
```

## 7. Déployer Ycode sur Netlify

### 7.1 Créer le fork

1. Aller sur https://github.com/bauhem/ycode
2. Cliquer **Fork** → **Create a new fork**
3. Sélectionner l'organisation **bauhem**
4. Renommer en `ycode-client` (optionnel)

### 7.2 Configurer sur Netlify

```bash
# Créer le site Netlify
npx netlify-cli sites:create --name "client-ycode" --team "Live-Bauhem"

# Définir les variables d'environnement
npx netlify-cli env:set SUPABASE_URL "https://supabase.client.com"
npx netlify-cli env:set SUPABASE_ANON_KEY "<ANON_KEY>"
npx netlify-cli env:set SUPABASE_SERVICE_ROLE_KEY "<SERVICE_ROLE_KEY>"
npx netlify-cli env:set SUPABASE_CONNECTION_URL "postgresql://supabase_admin:<DB_PASS>@<IP_VPS>:5433/postgres"
npx netlify-cli env:set SUPABASE_DB_PASSWORD "<POSTGRES_PASSWORD>"
npx netlify-cli env:set JWT_SECRET "<JWT_SECRET>"
npx netlify-cli env:set PAGE_AUTH_SECRET "<secret_random>"
```

### 7.3 Lier GitHub + déployer

Dans Netlify Dashboard :
1. **Site settings → Build & deploy → Link to GitHub**
2. Sélectionner le fork fraîchement créé
3. Le build se lance automatiquement

### 7.4 Domaine personnalisé du Ycode admin

Ajouter un CNAME dans Netlify DNS :

| Name | Type | Value |
|------|------|-------|
| `admin` | CNAME | `client-ycode.netlify.app` |

Puis dans Netlify Dashboard :
1. **Site settings → Domain management → Custom domains**
2. **Add a domain** → `admin.client.com`

Le SSL sera automatique (Let's Encrypt).

## 8. Créer le compte admin client

```bash
ANON_KEY=<ANON_KEY>
SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

PASSWORD=$(openssl rand -base64 12 | tr -d /=+ | cut -c1-16)
echo "Password: $PASSWORD"

curl -s -X POST "https://supabase.client.com/auth/v1/admin/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@client.com\",\"password\":\"$PASSWORD\",\"email_confirm\":true}"
```

## 9. Vérification

- **Admin Ycode :** `https://admin.client.com/ycode`
- **Supabase Studio :** `https://supabase.client.com`
- **API Supabase :** `https://supabase.client.com/rest/v1/`

## Checklist par client

- [ ] VPS OVH créé (VPS-1, Ubuntu 24.04, BHS)
- [ ] Docker installé
- [ ] Supabase installé et en santé
- [ ] Port 5433 exposé (DB directe)
- [ ] Migrations Ycode appliquées
- [ ] DNS : `supabase.client.com` → IP du VPS
- [ ] Nginx + Let's Encrypt (HTTPS)
- [ ] Domaine `admin.client.com` → Netlify DNS
- [ ] Fork Ycode créé dans bauhem/
- [ ] Site Netlify créé
- [ ] Env vars configurées sur Netlify
- [ ] Build Netlify réussi
- [ ] Compte admin créé
- [ ] Connexion fonctionnelle

## Variables à stocker (coffre client)

| Variable | Source |
|----------|--------|
| IP du VPS | Console OVH |
| POSTGRES_PASSWORD | `supabase/docker/.env` |
| JWT_SECRET | `supabase/docker/.env` |
| ANON_KEY | `supabase/docker/.env` |
| SERVICE_ROLE_KEY | `supabase/docker/.env` |
| SUPABASE_URL | `https://supabase.client.com` |
| DB connection string | `postgresql://supabase_admin:<PASS>@<IP>:5433/postgres` |
| Mot de passe admin Ycode | Généré à l'étape 8 |
