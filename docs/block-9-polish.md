# Bloque 9 — Visual Polish, Accessibility and Production Readiness

## Objetivo

Bloque 9 convierte `fixture-mundial-front` en una experiencia más presentable para portfolio y producción: mejora feedback ante servidor dormido, accesibilidad básica, visual polish moderado, grupo favorito persistente, página 404, metadata social y PWA instalable liviana.

## Alcance

- Mejoras visuales moderadas en cards, contenedores de estado, paneles informativos y Home.
- Copy público más humano para carga lenta y servidor dormido.
- Botones `Reintentar` en estados de error alimentados por servidor.
- Grupo favorito persistido en `localStorage`.
- Página 404 personalizada con CTA al Home.
- Metadata, favicon original, social image y manifest básico.
- Tests de comportamiento para 404, retry, grupo favorito y accesibilidad básica con roles/labels.

## No alcance

- No service worker ni estrategia offline compleja.
- No nuevas dependencias.
- No rediseño completo de `FixtureMatchCard`.
- No assets oficiales de FIFA, World Cup, mascota, pelota oficial ni trofeo oficial.
- No cambios en endpoints ni contratos del servidor.
- No predicciones visibles de penales para eliminatorias.

## Copy aprobado

### Servidor dormido

- Título: `El servidor está despertando`
- Body: `Puede tardar hasta 30 segundos en responder. Tocá en reintentar para volver a cargar la información.`
- Botón: `Reintentar`

### Estados de carga

- Home: `Cargando partidos…`
- Group Fixtures: `Preparando el fixture…`
- Group Standings: `Buscando posiciones…`
- Knockout Stage: `Armando el cuadro…`
- Prediction Fixture: `Cargando tus predicciones…`

### 404

- Kicker: `404 · Fuera de juego`
- Title: `Te fuiste fuera de la cancha`
- Body: `La página que buscás no está en el fixture. Volvé al inicio para seguir explorando partidos, tablas y predicciones.`
- CTA: `Volver al inicio`

## Comportamiento de grupo favorito

- Storage key: `fixtureMundial.favoriteGroup`.
- Servicio: `src/services/preferences/favoriteGroupStorageService.js`.
- Componente: `src/components/FavoriteGroupToggle/FavoriteGroupToggle.jsx`.
- Se permite un único grupo favorito A-L.
- Marcar un grupo reemplaza cualquier favorito anterior.
- Desmarcar elimina el favorito guardado, pero no cambia automáticamente el grupo seleccionado en pantalla.
- `/grupos` inicia en el favorito válido si existe; si no existe, inicia en grupo `A`.
- `/posiciones` inicia en `Vista foco` cuando hay favorito válido y selecciona ese grupo si está disponible en la respuesta.
- Si el favorito guardado no está en la respuesta de standings, la UI usa un fallback seguro al primer grupo recibido.
- Valores corruptos o inválidos se descartan sin romper la UI.

## PWA y metadata checklist

- `index.html` usa `lang="es"`.
- `index.html` contiene title, meta description, `theme-color`, Open Graph y Twitter card básico.
- `public/site.webmanifest` define `name`, `short_name`, `start_url`, `scope`, `display`, `theme_color`, `background_color` e iconos.
- `public/favicon.svg` usa una copa genérica dorada, minimalista y original.
- `public/social-image.svg` funciona como preview social liviana.
- `og:image` usa ruta relativa (`/social-image.svg`) hasta conocer el dominio final; al cerrar deploy final conviene reemplazarla por URL absoluta.
- No se promete funcionamiento offline.

## Testing checklist

- 404 fallback route renderiza la página custom y CTA al Home.
- Favorite group storage carga, guarda, elimina y descarta valores inválidos.
- `/grupos` usa el favorito como selección inicial.
- `/posiciones` usa el favorito como selección inicial en `Vista foco` cuando existe en standings.
- Botones `Reintentar` vuelven a disparar requests después de error.
- Delayed loading muestra copy de servidor despertando.
- Botón favorito expone `aria-label`, `aria-pressed` y es accesible por role.
- Modales clave se pueden cerrar con Escape.

## Manual QA checklist

- [ ] Revisar `/` en mobile/tablet/desktop.
- [ ] Revisar `/grupos` con y sin grupo favorito.
- [ ] Revisar `/posiciones` con favorito disponible y no disponible.
- [ ] Revisar `/eliminatorias` en carga, error y cuadro base.
- [ ] Revisar `/predicciones` en carga, error, reset e impresión.
- [ ] Revisar ruta inexistente, por ejemplo `/ruta-inexistente`.
- [ ] Revisar foco visible con teclado.
- [ ] Revisar que no aparezcan errores técnicos crudos en UI.
- [ ] Revisar manifest e iconos en build de producción.
