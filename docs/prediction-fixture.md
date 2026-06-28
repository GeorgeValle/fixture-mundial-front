# Prediction Fixture

## Propósito

Prediction Fixture permite que el usuario cargue su nombre, guarde pronósticos de partidos y compare sus predicciones contra resultados confirmados cuando estén disponibles.

El backend provee partidos, estados y resultados registrados. Las predicciones del usuario se guardan localmente en el navegador.

## Ruta

```text
/predicciones
```

## Componentes principales

- `PredictionFixture`: página principal, coordina datos del backend, estado local, filtros, scoring, locking, reset e impresión.
- `PredictionUserForm`: captura y valida el nombre del participante.
- `PredictionSummary`: muestra participante, cantidad de predicciones y puntos.
- `PredictionMatchList`: lista reutilizable de cards de predicción.
- `PredictionMatchCard`: formulario por partido de fase de grupos o eliminatorias.
- `PredictionResultComparison`: muestra predicción, resultado final registrado, puntos e indicadores.
- `PredictionIndicatorList`: renderiza indicadores de acierto.
- `PredictionGroupFilter`: filtra partidos por grupo.
- `PredictionKnockoutPhaseFilter`: muestra filtro de fases eliminatorias cuando aplica.
- `PredictionDialog`: modales de ayuda y confirmación.
- `PredictionStorageResetNotice`: aviso para reset guiado si `localStorage` está corrupto.
- `SkeletonList`: loading visual.
- `FeedbackModal`: delayed loading.

## Servicios, estado local y endpoints usados

Endpoint público:

```text
GET /api/matches
```

Servicio backend:

```text
src/services/matches/matchesService.js
```

Servicio local:

```text
src/services/predictions/predictionStorageService.js
```

Schemas:

```text
src/schemas/predictionSchema.js
src/schemas/matchSchema.js
```

Claves de almacenamiento:

```text
fixtureMundial.predictions
fixtureMundial.errorLog
```

La clave principal de predicciones está definida en:

```text
src/constants/storageKeys.js
```

## Modelo local de predicciones

Las predicciones se guardan en `localStorage`.

Modelo actual:

```js
{
  version: 1,
  userName: '',
  predictions: {
    [matchId]: {
      matchId: '...',
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHomePenaltyScore: null,
      predictedAwayPenaltyScore: null,
      predictedAdvancingTeamId: null,
      updatedAt: '...'
    }
  }
}
```

Si el almacenamiento está corrupto, la UI ofrece reset guiado y evita romper la pantalla.

## Alcance actual de predicciones

### Fase de grupos

Implementado:

- listado de partidos reales de fase de grupos;
- captura de goles local/visitante;
- guardado por partido;
- filtro por grupo;
- locking por estado/fecha;
- comparación contra resultado final registrado;
- scoring;
- reset de predicciones editables;
- impresión.

### Eliminatorias

Implementado:

- listado de partidos reales de eliminatorias con ambos equipos definidos;
- filtro por fase eliminatoria;
- cards de predicción con la misma UI base de fase de grupos;
- badge de fase traducido a español (`16avos`, `Octavos`, `Cuartos`, `Semifinales`, `Tercer puesto`, `Final`);
- captura de goles normales solamente;
- si el usuario predice empate, selección visual obligatoria de quién clasifica;
- no se piden ni muestran penales en la UI pública de predicciones;
- no se permiten predicciones sobre TBD, equipos por definir, placeholders, cruces base ni cruces incompletos;
- progreso dinámico según partidos knockout reales disponibles.

## Estados manejados

### Loading

Muestra `SkeletonList` mientras carga partidos.

### Delayed loading

Si la información demora, se muestra `FeedbackModal`.

### Error

Si falla `GET /api/matches`, la página muestra un error amigable.

### Empty state

Si no hay partidos reales de fase de grupos ni eliminatorias para predecir, se informa que aparecerán cuando existan partidos con equipos definidos.

Si no hay cruces reales de eliminatorias, la sección informa que se habilitarán cuando los cruces estén definidos. Si un filtro de fase no tiene cruces reales, se muestra un empty state para esa fase.

### Datos válidos

Cuando hay partidos:

- se muestra formulario de participante;
- se muestra resumen;
- se habilitan filtros;
- se renderizan cards de predicción para fase de grupos;
- se renderizan cards de predicción para eliminatorias cuando hay cruces reales definidos.

### localStorage corrupto

Si los datos locales no se pueden parsear:

- se muestra `PredictionStorageResetNotice`;
- se permite resetear a estado seguro;
- no se pierde control de la UI.

## Reglas de locking

Una predicción se bloquea cuando:

- `status === 'PLAYING'`;
- `status === 'FINISHED'`;
- `now >= match.date`, aunque `status` siga como `PENDING`.

Si la fecha del partido es inválida, la UI no debe romperse y debe mostrar un estado seguro.

## Validación de goles

Reglas actuales:

- enteros;
- rango 0-20;
- sin negativos;
- no aceptar valores vacíos al guardar;
- no aceptar texto no numérico.

Los inputs usan texto con `inputMode="numeric"` para evitar problemas de campos numéricos nativos del navegador.

## Validación de clasificado en eliminatorias

En eliminatorias no se cargan penales.

Reglas:

- si los goles predichos no empatan, no se exige clasificado;
- si los goles predichos empatan, se muestra “Si empatan, ¿quién clasifica?”;
- la selección es exclusiva entre equipo local y visitante;
- `predictedAdvancingTeamId` debe coincidir con el identificador real del equipo local o visitante;
- si el usuario cambia el marcador y deja de ser empate, se limpia `predictedAdvancingTeamId`;
- fase de grupos no muestra ni valida clasificado.

## Validación del participante

Reglas actuales:

- nombre requerido;
- entre 2 y 40 caracteres;
- debe incluir letras;
- permite letras Unicode, espacios, guion medio y guion bajo.

## Scoring actual

### Fase de grupos

- 1 punto por acertar ganador.
- 2 puntos por acertar goles del ganador.
- 1 punto por acertar goles del perdedor.
- 1 punto por acertar empate.
- 1 punto por acertar cantidad exacta de goles del empate.

### Eliminatorias

- 2 puntos por acertar ganador en goles normales.
- 1 punto por acertar goles del ganador.
- 1 punto por acertar goles del perdedor.
- 1 punto por acertar empate en goles normales.
- 1 punto por acertar cantidad exacta de goles del empate.
- La selección `predictedAdvancingTeamId` no suma puntos.
- Los penales del backend pueden ayudar a mostrar quién clasificó, pero no suman puntos en predicciones públicas.

## Indicadores visibles

Cuando un partido finaliza y hay predicción guardada, la UI puede mostrar:

- `Ganador acertado`
- `Empate acertado`
- `Goles del ganador acertados`
- `Goles del perdedor acertados`
- `Goles del empate acertados`

Los indicadores tienen texto visible y no dependen solo del color.

## Filtros

### Grupo

`PredictionGroupFilter` permite:

- ver todos los grupos;
- filtrar por un grupo específico.

El filtro no borra predicciones; solo cambia visibilidad.

### Eliminatorias

`PredictionKnockoutPhaseFilter` permite seleccionar:

- todas las fases;
- 16avos;
- octavos;
- cuartos;
- semifinales;
- tercer puesto;
- final.

El filtro no borra predicciones; solo cambia visibilidad. Solo se listan cruces reales disponibles para predecir.

## Acciones de reset

Implementado:

- borrar predicciones editables del grupo seleccionado;
- borrar todas las predicciones editables;
- borrar predicciones editables de eliminatorias si existen cruces reales;
- confirmar acciones mediante modal;
- preservar predicciones bloqueadas de partidos iniciados, finalizados o cerrados por fecha.

## Impresión

La página incluye impresión mediante:

```js
window.print()
```

La impresión muestra pronósticos visibles, resumen, puntos y resultados registrados disponibles.

## Decisiones visuales y UX

- El usuario ve primero nombre y resumen.
- Los puntos tienen modales de ayuda.
- Las acciones destructivas tienen confirmación.
- El reset evita borrar predicciones bloqueadas.
- Las cards de eliminatorias reutilizan la estética clara de fase de grupos.
- El selector de clasificado en empates knockout usa botones tipo píldora y es visual/informativo para el puntaje.

## Relación con otras partes de la app

- Comparte `GET /api/matches` con `/grupos` y `/eliminatorias`.
- Usa resultados registrados del backend para scoring.
- Usa `localStorage` como estado propio del usuario.
- Usa utilidades compartidas de fechas, locking, scoring y validación.

## Limitaciones actuales

- No hay persistencia de predicciones en backend.
- No se inventan cruces futuros ni progresiones desde el frontend.
- Los cruces knockout sin ambos equipos reales no se muestran como cards predictivas.
- No hay exportación PDF nativa; la opción actual es impresión del navegador.

## Mejoras futuras

- Exportación PDF.
- Página o vista histórica de resultados de predicciones.
- Sincronización opcional si se define backend para usuarios.

## Archivos relacionados

- `src/pages/PredictionFixture/PredictionFixture.jsx`
- `src/components/PredictionUserForm/PredictionUserForm.jsx`
- `src/components/PredictionSummary/PredictionSummary.jsx`
- `src/components/PredictionMatchCard/PredictionMatchCard.jsx`
- `src/components/PredictionResultComparison/PredictionResultComparison.jsx`
- `src/components/PredictionGroupFilter/PredictionGroupFilter.jsx`
- `src/components/PredictionKnockoutPhaseFilter/PredictionKnockoutPhaseFilter.jsx`
- `src/services/predictions/predictionStorageService.js`
- `src/utils/predictionMatchEligibility.js`
- `src/utils/predictionLocking.js`
- `src/utils/predictionScoring.js`
- `src/utils/predictionValidation.js`

## Resumen de implementación por bloques

- **Bloque 7.1**: storage, schemas, locking, scoring, validación y tests unitarios.
- **Bloque 7.2**: UI base de `/predicciones`, carga de partidos, cards, comparación, estados y tests.
- **Follow-up 7.2**: filtro por grupo y ajustes de copy.
- **Bloque 7.3**: impresión con `window.print()` y estilos de print.
- **Follow-up 7.4**: reset por grupo y reset total preservando predicciones bloqueadas.
- **Follow-up 7.5**: resumen por fase, modales de ayuda, filtro de eliminatorias, confirmaciones y polish de impresión.
- **Follow-up 7.5.1**: validación robusta de scores y nombre de participante.
- **Follow-up 7.6**: predicciones de eliminatorias con cruces reales, selector visual de clasificado en empates, scoring sin penales y progreso knockout dinámico.
- **Validación manual**: Bloque 7 aprobado por el usuario.
