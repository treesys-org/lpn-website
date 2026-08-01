# Linux para noobs

Sitio guía de [Linux para noobs](https://www.linuxparanoobs.com) (español neutro).

Este repositorio es la fuente de **[www.linuxparanoobs.com](https://www.linuxparanoobs.com)** (GitHub Pages).

## Cómo se lee la página

1. **Guía** — asistente con tarjetas visuales (máx. 3 opciones)
2. **Temas** — carpetas claras; al tocar una, filtra los videos
3. **Videos** — catálogo del tema elegido + búsqueda

## Vista previa

```bash
cd lpn-website
python3 -m http.server 8080
```

Abre [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Datos

- `data/videos.json` — catálogo y categorías
- `js/quiz.js` — flujo del asistente
- `assets/favicon.png` — mascota sola (sin texto ni emoji)
- `assets/room-*.png` — fondos de la guía: inicio, empezar, elegir, problemas
- `assets/mascota-guia.png` — mascota del asistente

## Deploy

Push a `main` en GitHub. Con **Settings → Pages → Source: GitHub Actions**, el workflow `lpn-pages.yml` publica el sitio.

Tras el primer deploy, apunta el DNS de `www.linuxparanoobs.com` a GitHub Pages.

## License

- **Código** del sitio (HTML/CSS/JS): [GPL-3.0-or-later](LICENSE)
- **Mascota, logo y marca** (`assets/` de marca): **todos los derechos reservados** — ver [NOTICE](NOTICE)

La mascota no se licencia con el código: usarla en otro canal o producto sin permiso no está permitido.
