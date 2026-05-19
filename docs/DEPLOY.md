# Guide de deploiement client

Ce document est le chemin de reference pour deployer Ycode avec une instance Supabase self-hosted par client. Il doit rester utilisable par un autre agent sans connaissance implicite de l'infra Bauhem.

Principes:
- 1 VPS par client pour Supabase, PostgreSQL et Kong.
- 1 site Netlify par client pour l'admin Ycode.
- L'API Supabase doit etre joignable sans Basic Auth sur les routes API.
- Les secrets ne doivent pas etre stockes dans ce repo ni dans ce document.
- Les ports ouverts doivent etre choisis explicitement: API publique, SSH, et DB directe seulement si assume.

---

## Architecture cible

```
admin.client.com              supabase-api.client.com
Netlify / Ycode admin   --->  VPS client / Supabase Kong :8000
                              Docker: db, rest, auth, storage, studio
```

Chaque client a:
- un VPS dedie, idealement Ubuntu 24.04;
- Docker + Supabase self-hosted;
- un domaine API Supabase, par exemple `supabase-api.client.com`;
- un domaine admin Ycode, par exemple `admin.client.com`;
- un coffre client contenant les secrets.

La route API Supabase (`/rest/v1`, `/auth/v1`, `/storage/v1`, `/functions/v1`) ne doit pas etre protegee par Basic Auth. Si Studio doit etre protege, le faire sur un host separe ou une route separee, pas devant Kong API.

---

## 1. Provisionner le VPS

Creer un VPS Ubuntu 24.04. Pour Bauhem, le profil historique etait OVH VPS-1, mais le guide fonctionne avec tout VPS equivalent.

Ouvrir seulement ce qui est necessaire:
- `22/tcp` pour SSH;
- `80/tcp` et `443/tcp` pour HTTP/HTTPS;
- `5433/tcp` seulement si la DB Postgres directe doit etre accessible depuis l'exterieur.

```bash
ssh root@<IP_DU_VPS>

apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx

adduser ubuntu
usermod -aG docker ubuntu

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
# Optionnel: ouvrir la DB directe seulement si c'est voulu.
# ufw allow from <IP_ADMIN_FIXE> to any port 5433 proto tcp
ufw enable
```

Copier la cle SSH admin dans `/home/ubuntu/.ssh/authorized_keys`, puis continuer avec `ubuntu`.

---

## 2. Installer Supabase self-hosted

```bash
ssh ubuntu@<IP_DU_VPS>

git clone --depth 1 https://github.com/supabase/supabase ~/supabase
cd ~/supabase/docker
cp .env.example .env
```

Configurer `~/supabase/docker/.env`:

```env
POSTGRES_PASSWORD=<mot_de_passe_fort>
JWT_SECRET=<secret_fort>
SITE_URL=https://admin.client.com
API_EXTERNAL_URL=https://supabase-api.client.com
SUPABASE_PUBLIC_URL=https://supabase-api.client.com
ADDITIONAL_REDIRECT_URLS=https://admin.client.com
```

Generer ou recuperer les cles Supabase:

```bash
./generate-keys.sh
docker compose up -d
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

Verifier:
- `supabase-kong` healthy;
- `supabase-db` healthy;
- `supabase-rest`, `supabase-auth`, `supabase-storage` up.

---

## 3. Exposer l'API Supabase

Kong ecoute habituellement sur le port `8000` du VPS. Nginx doit proxyfier vers Kong.

```bash
sudo tee /etc/nginx/sites-available/supabase-api << 'EOF'
server {
    listen 80;
    server_name supabase-api.client.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/supabase-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d supabase-api.client.com --agree-tos --email admin@client.com
```

Important: ne pas mettre Basic Auth sur ce host si Ycode, les clients Supabase ou le MCP doivent appeler l'API.

Verifier depuis une machine externe:

```bash
curl -I https://supabase-api.client.com/rest/v1/
# Attendu sans apikey: 401 avec WWW-Authenticate: Key, pas Basic.

curl -I \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  https://supabase-api.client.com/rest/v1/
# Attendu: 200 ou une reponse PostgREST valide.
```

Si la premiere commande retourne `WWW-Authenticate: Basic`, l'API est mal exposee pour Ycode/MCP.

---

## 4. Acces PostgreSQL direct

Ycode utilise aussi des operations SQL directes via Knex. Il faut donc une URL PostgreSQL fiable.

Option A, DB exposee explicitement sur `5433`:

```yaml
# ~/supabase/docker/docker-compose.yml
services:
  db:
    ports:
      - "5433:5432"
```

```bash
cd ~/supabase/docker
docker compose up -d db
```

URL:

```text
postgresql://supabase_admin:<POSTGRES_PASSWORD>@<IP_DU_VPS>:5433/postgres
```

Option B, tunnel SSH si la DB ne doit pas etre exposee publiquement:

```bash
ssh -i ~/.ssh/<CLE_CLIENT> -L 5433:<IP_CONTAINER_DB>:5432 ubuntu@<IP_DU_VPS> -N
```

URL locale:

```text
postgresql://supabase_admin:<POSTGRES_PASSWORD>@localhost:5433/postgres
```

Pour trouver l'IP du container DB:

```bash
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' supabase-db
```

Verification:

```bash
PGPASSWORD=<POSTGRES_PASSWORD> psql \
  -h <HOST_DB> -p <PORT_DB> -U supabase_admin -d postgres \
  -c 'select current_database(), current_user;'
```

---

## 5. Appliquer les migrations Ycode

Depuis la machine locale:

```bash
cd /chemin/vers/ycode
rsync -avz database/migrations/ ubuntu@<IP_DU_VPS>:~/migrations/
```

Sur le VPS:

```bash
for f in ~/migrations/*.sql; do
  echo "Applying $f..."
  PGPASSWORD=<POSTGRES_PASSWORD> psql \
    -h localhost -p 5433 -U supabase_admin -d postgres -f "$f"
done
```

Si la DB n'est accessible que via tunnel, appliquer les migrations depuis la machine locale avec `localhost:5433`.

---

## 6. Deployer Ycode sur Netlify

Creer un fork du repo Ycode pour le client, puis creer un site Netlify.

Variables Netlify minimales:

```bash
npx netlify-cli env:set SUPABASE_URL "https://supabase-api.client.com"
npx netlify-cli env:set SUPABASE_PUBLISHABLE_KEY "<ANON_KEY>"
npx netlify-cli env:set SUPABASE_SECRET_KEY "<SERVICE_ROLE_KEY>"
npx netlify-cli env:set SUPABASE_CONNECTION_URL "postgresql://supabase_admin:<POSTGRES_PASSWORD>@<HOST_DB>:<PORT_DB>/postgres"
npx netlify-cli env:set SUPABASE_DB_PASSWORD "<POSTGRES_PASSWORD>"
npx netlify-cli env:set JWT_SECRET "<APP_JWT_SECRET>"
npx netlify-cli env:set PAGE_AUTH_SECRET "<secret_random>"
```

Notes:
- Le code actuel lit `SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY`.
- Garder `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` seulement si un autre runtime les exige.
- Ne pas commiter `.env`.

DNS admin:

| Name | Type | Value |
|------|------|-------|
| `admin` | CNAME | `<site-netlify>.netlify.app` |

---

## 7. Creer le compte admin client

```bash
ANON_KEY=<ANON_KEY>
SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
SUPABASE_URL=https://supabase-api.client.com

PASSWORD=$(openssl rand -base64 18 | tr -d /=+ | cut -c1-20)
echo "Password: $PASSWORD"

curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@client.com\",\"password\":\"$PASSWORD\",\"email_confirm\":true}"
```

Stocker le mot de passe dans le coffre client.

---

## 8. Config Codex MCP Supabase

Avant de configurer le MCP, assurez-vous que le serveur MCP Supabase est présent et compilé sur la machine locale. Si ce n'est pas le cas, clonez le dépôt MCP officiel (ou votre fork personnalisé) et compilez-le :

```bash
cd /chemin/vers/ycode
# Exemple avec le repo officiel si applicable, ou copier le dossier depuis une autre machine
git clone https://github.com/supabase-community/mcp-supabase.git
cd mcp-supabase
npm install
npm run build
```

Le MCP Supabase doit utiliser une URL API qui parle directement a Kong, sans Basic Auth.

Configuration de principe:

```toml
[mcp_servers.supabase-client]
command = "node"
args = [
  "/chemin/vers/ycode/mcp-supabase/dist/index.js",
  "--url", "https://supabase-api.client.com",
  "--anon-key", "<ANON_KEY>",
  "--service-key", "<SERVICE_ROLE_KEY>",
  "--db-url", "postgresql://supabase_admin:<POSTGRES_PASSWORD>@<HOST_DB>:<PORT_DB>/postgres",
  "--jwt-secret", "<SUPABASE_JWT_SECRET>"
]
```

Pour Bauhem localement, si `https://supabase.bauhem.com` est protege par Basic Auth, utiliser l'URL Kong directe:

```toml
"--url", "http://51.222.143.231:8000"
```

Tests attendus:

```bash
curl -I http://51.222.143.231:8000/rest/v1/
# 401 avec WWW-Authenticate: Key

curl -I https://supabase.bauhem.com/rest/v1/
# Si 401 avec WWW-Authenticate: Basic, ne pas utiliser cette URL pour le MCP.
```

Si un MCP deja charge retourne `Transport closed` apres modification de `~/.codex/config.toml`, relancer Codex/la session pour recharger le serveur MCP.

---

## 9. Checklist client

- [ ] VPS cree et accessible en SSH.
- [ ] Docker et Compose installes.
- [ ] Supabase Docker demarre et containers healthy.
- [ ] `SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL`, `SITE_URL` configures.
- [ ] DNS API Supabase pointe vers le VPS.
- [ ] HTTPS actif sur le host API.
- [ ] L'API retourne `WWW-Authenticate: Key`, pas `Basic`.
- [ ] URL PostgreSQL directe ou tunnel SSH valide.
- [ ] Migrations Ycode appliquees.
- [ ] Fork Ycode cree.
- [ ] Site Netlify cree.
- [ ] Variables Netlify configurees.
- [ ] Build Netlify reussi.
- [ ] Domaine admin configure.
- [ ] Compte admin cree.
- [ ] Connexion admin testee.
- [ ] MCP Supabase teste si un agent doit operer la DB.

---

## 10. Variables a stocker dans le coffre client

| Variable | Source |
|----------|--------|
| IP du VPS | Console hebergeur |
| SSH user | Provision VPS |
| SSH key name | Machine admin |
| POSTGRES_PASSWORD | `~/supabase/docker/.env` |
| JWT_SECRET Supabase | `~/supabase/docker/.env` |
| ANON_KEY | `~/supabase/docker/.env` apres `generate-keys.sh` |
| SERVICE_ROLE_KEY | `~/supabase/docker/.env` apres `generate-keys.sh` |
| SUPABASE_URL | Domaine API Supabase |
| SUPABASE_CONNECTION_URL | URL Postgres directe ou tunnel |
| Mot de passe admin Ycode | Etape 7 |

Ne pas mettre ces valeurs dans Git, dans ce document, ni dans un ticket non securise.

---

## Bauhem actuel

Etat verifie le 2026-05-19:

- VPS: `51.222.143.231`.
- Host SSH fonctionnel: `ubuntu@51.222.143.231`.
- Cle locale fonctionnelle: `~/.ssh/vps_ycode`.
- Docker Supabase tourne sur le VPS.
- Kong API direct: `http://51.222.143.231:8000`.
- Domaine public: `https://supabase.bauhem.com`.
- Attention: `https://supabase.bauhem.com` retourne une Basic Auth et ne doit pas etre utilise comme URL MCP tant que cette protection couvre l'API.
- URL MCP Supabase locale recommandee pour l'instant: `http://51.222.143.231:8000`.
- DB directe verifiee: `51.222.143.231:5433` avec user `supabase_admin`.

Containers observes:

```text
supabase-edge-functions
supabase-kong
supabase-studio
supabase-storage
supabase-analytics
supabase-meta
supabase-pooler
supabase-auth
realtime-dev.supabase-realtime
supabase-rest
supabase-db
supabase-vector
supabase-imgproxy
```

Commandes utiles:

```bash
# Verifier les containers
ssh -i ~/.ssh/vps_ycode ubuntu@51.222.143.231 \
  'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Verifier Kong direct
curl -I http://51.222.143.231:8000/rest/v1/

# Verifier que le domaine public n'est pas adapte au MCP s'il reste en Basic Auth
curl -I https://supabase.bauhem.com/rest/v1/

# Dev local Ycode
npm run dev
```

Contexte Ycode Bauhem:
- Serveur local habituel: `http://localhost:3002`.
- Locale FR par defaut, EN secondaire.
- Design system: Inter, noir/blanc, rouge `#d0311e`, neutres `#eae9e6`, `#676767`, `#171717`.
- Le composant Navigation historique doit etre alimente par les vraies pages Ycode, pas par une collection CMS `Navigation`.
