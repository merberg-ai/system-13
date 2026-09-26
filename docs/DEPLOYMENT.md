# Deployment

SYSTEM 13 is designed to run as a small localhost-only Node service behind an existing Nginx installation.

## Safety boundary

The deployment scripts own only these SYSTEM 13 resources:

- `/opt/system13`
- `/etc/system13`
- `/var/lib/system13`
- `/etc/systemd/system/system13.service`
- `/usr/local/bin/system13ctl`
- `/etc/nginx/sites-available/system13.kj6ywd.net`
- `/etc/nginx/sites-enabled/system13.kj6ywd.net`
- `/var/www/system13-acme`
- the Let's Encrypt certificate for `system13.kj6ywd.net`

They do not edit the `kj6ywd.net` vhost or unrelated Nginx/certificate configuration.

Every Nginx change is validated with `nginx -t` before Nginx is reloaded. Certbot uses `certonly --webroot`; the scripts never invoke `certbot --nginx`.

## Requirements

- Linux with systemd
- git and curl (the installer can install missing base utilities on apt-based systems)
- an existing Nginx installation using `sites-available` / `sites-enabled`
- Certbot for automatic HTTPS setup
- DNS for `system13.kj6ywd.net` pointed at the server before the HTTPS step

SYSTEM 13 requires Node.js 22+. If a suitable host `node` + `npm` installation is already available, the installer uses it. Otherwise, on x86-64 or arm64 Linux it downloads the current official Node.js `latest-v22.x` archive from `nodejs.org`, verifies the archive against Node's published SHA-256 manifest, and installs a private runtime under:

```text
/opt/system13/runtime/node
```

This does not replace or modify the server's global Node.js installation. Later SYSTEM 13 updates automatically reuse the private runtime when present.

The installer deliberately does not install, replace, or reconfigure Nginx itself.

## Development-channel install

Until the first release is merged to `main`, install the `dev` channel with:

```bash
curl -fsSL https://raw.githubusercontent.com/merberg-ai/system-13/dev/scripts/install.sh \
  | sudo env SYSTEM13_BRANCH=dev bash
```

The installer:

1. verifies/bootstraps its build runtime
2. clones the selected SYSTEM 13 branch
3. type-checks the code
4. validates scenarios
5. runs engine tests
6. builds the production bundle
7. creates the dedicated `system13` service account
8. installs an immutable release under `/opt/system13/releases`
9. switches `/opt/system13/current` atomically
10. starts the localhost daemon on `127.0.0.1:1313`
11. checks `/health`
12. creates only the SYSTEM 13 Nginx HTTP vhost
13. runs `nginx -t` before reload
14. attempts Certbot webroot issuance when Certbot/DNS are available

If DNS is not ready, the application remains installed and the SSL step fails safely without changing unrelated Nginx sites. After DNS is ready:

```bash
sudo system13ctl ssl setup
```

## Releases and rollback

`/opt/system13/current` is a symlink to one immutable release directory. Deployment switches that symlink atomically and restarts the daemon. If the new daemon fails `/health`, the previous symlink is restored automatically.

Useful commands:

```bash
system13ctl status
system13ctl health
system13ctl version
system13ctl releases
sudo system13ctl update
sudo system13ctl rollback
```

## Maintenance mode

```bash
sudo system13ctl maintenance on
sudo system13ctl maintenance off
```

Maintenance mode uses `/var/lib/system13/maintenance` and requires no daemon restart. `/health` remains available while game requests return a SYSTEM 13 maintenance message.

## Configuration

Runtime configuration lives at `/etc/system13/config.yaml` and is preserved by updates.

```bash
system13ctl config show
sudo system13ctl config edit
system13ctl config validate
```

## Backup

Browser game progress is stored in each player's browser, so there is no central player-save database to back up. Server backup currently covers SYSTEM 13 configuration and maintenance state:

```bash
sudo system13ctl backup
```

Archives are stored under `/var/lib/system13/backups`.

## Uninstall

Safe disable/preserve:

```bash
sudo system13ctl uninstall
```

This disables the service and SYSTEM 13 vhost while retaining the repo, releases, config, data, private runtime, and certificates.

Full application/config/data purge:

```bash
sudo system13ctl uninstall --purge
```

Let's Encrypt certificates are deliberately retained even during purge so uninstall cannot unexpectedly alter Certbot state used by the rest of the server.
