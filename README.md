# Sistema de Turnos y Signos Vitales — TP Integrador Programación III

Aplicación web fullstack para la gestión de turnos médicos y el registro de signos vitales y síntomas de pacientes, pensada para centros de atención sanitaria.

**Materia:** Programación III — IES 9-023
**Tecnologías:** NestJS · MongoDB · GraphQL · React (Vite) · Docker

## Integrantes

- Rubén Ledesma
- Santiago Romano
- Rodrigo Espinosa

## 1. Problemática

En muchos centros de atención la asignación de turnos y el registro de los controles de enfermería se hacen de forma manual o dispersa. Esto genera turnos superpuestos, falta de trazabilidad (quién asignó qué turno, quién tomó los signos vitales) y poca visibilidad del historial del paciente.

## 2. Solución propuesta

Un sistema con tres roles, cada uno con su propio panel:

| Rol | Qué puede hacer |
|---|---|
| **patient** (paciente) | Registrarse, sacar y cancelar sus turnos, ver sus signos vitales, editar su perfil. |
| **nurse** (enfermero) | Registrar signos vitales y síntomas de un turno, agregar observaciones de seguimiento, ver pacientes. |
| **administrator** | Gestionar usuarios (crear, editar, desactivar), gestionar todos los turnos y cargar sobreturnos. |

Reglas de negocio destacadas:
- Un solo turno activo por fecha y hora (índice único parcial en MongoDB). Solo el administrador puede cargar **sobreturnos**.
- Los turnos cancelados liberan el horario.
- Eliminación lógica de usuarios (`is_active: false`): un usuario dado de baja no puede iniciar sesión.
- Los signos vitales se registran una vez por turno; pasada la ventana de edición solo se pueden **agregar** observaciones.
- El registro público siempre crea usuarios con rol `patient`; el rol lo fuerza el backend.

## 3. Arquitectura

```
Frontend (React, :5173)
        │
        ▼
API Gateway (NestJS, :3000)  ── proxy inverso, único punto de entrada
        │
        ├──► ms-usuarios (:3001) ──► MongoDB · base tp_usuarios
        │
        └──► ms-turnos   (:3002) ──► MongoDB · base tp_turnos
                  │
                  └──► ms-usuarios (llamada interna: valida que paciente/enfermero existan)
```

### api-gateway (puerto 3000)
Proxy inverso con `http-proxy-middleware`. No tiene lógica de negocio: recibe todas las peticiones del frontend y las reenvía según el prefijo de la ruta.

| Prefijo | Destino |
|---|---|
| `/auth`, `/usuarios`, `/graphql`, `/api/docs` | ms-usuarios |
| `/appointments`, `/signs-and-symptoms` | ms-turnos |

Ventajas: el frontend conoce una sola URL, y CORS se configura en un solo lugar. El gateway reenvía el header `Authorization`; la validación del JWT y de los roles la hace cada microservicio.

### ms-usuarios (puerto 3001)
Usuarios, autenticación y roles. Base `tp_usuarios`, colección `users`.

- `POST /auth/login` → devuelve `access_token` (JWT con `sub`, `email`, `rol`).
- `POST /auth/register` → registro público de pacientes.
- `GET/PATCH /usuarios/me` → ver y editar el perfil propio (no permite cambiar rol ni estado).
- `GET /usuarios/pacientes` → admin y enfermero.
- `GET /usuarios/dni/:dni`, `POST/GET/GET:id/PATCH:id/DELETE:id /usuarios` → solo administrador.
- GraphQL (`/graphql`): queries `usuarios(rol)` y `usuario(id)`, solo administrador.
- Contraseñas con bcrypt; un administrador no puede cambiarse el rol ni eliminarse a sí mismo.
- Seed automático de 3 usuarios de prueba al arrancar (ver sección 6).

### ms-turnos (puerto 3002)
Turnos y signos vitales. Base `tp_turnos`.

- `/appointments`: CRUD de turnos (colección `medical_appointments`), más `GET /appointments/availability` para consultar horarios ocupados y `GET /appointments/:id/signs`.
- `/signs-and-symptoms`: CRUD de signos y síntomas (colección `signs_and_symptoms`) y `POST /:id/observations`.
- GraphQL (`/graphql`): CRUD completo (queries y mutations) de `Appointment` y de `SignAndSymptom`.
- Valida el JWT con el mismo `JWT_SECRET` que ms-usuarios y consulta a ms-usuarios para verificar pacientes y enfermeros.

### Relaciones entre datos
Cada microservicio tiene su propia base. Las relaciones entre servicios se hacen por id: `Appointment.patient_id` y `assigned_by_id` apuntan a un usuario, `SignAndSymptom.medical_appointment_id` apunta a un turno (relación 1 a 1) y `nurse_id` a un enfermero.

## 4. Cómo ejecutar el proyecto

### Con Docker (recomendado)

Requisitos: Docker y Docker Compose.

```bash
git clone <url-del-repositorio>
cd tp-integrador-salud
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| Swagger ms-usuarios | http://localhost:3000/api/docs (vía gateway) o http://localhost:3001/api/docs |
| Swagger ms-turnos | http://localhost:3002/api/docs |
| GraphQL usuarios / turnos | http://localhost:3001/graphql · http://localhost:3002/graphql |

Opcional: definir `JWT_SECRET` en un archivo `.env` junto al `docker-compose.yml` (si no, se usa una clave de desarrollo).

### Docker en detalle

Todos los servicios están contenerizados y se orquestan desde el [docker-compose.yml](docker-compose.yml) de la raíz. Se levantan 5 contenedores:

| Contenedor | Imagen | Puerto | Depende de |
|---|---|---|---|
| `tp-mongo` | `mongo:7` (imagen oficial) | 27017 | – |
| `tp-ms-usuarios` | build de `./ms-usuarios` | 3001 | mongo |
| `tp-ms-turnos` | build de `./ms-turnos` | 3002 | mongo, ms-usuarios |
| `tp-api-gateway` | build de `./api-gateway` | 3000 | ms-usuarios, ms-turnos |
| `tp-frontend` | build de `./frontend` (Nginx) | 5173 → 80 | api-gateway |

**Cómo se construyen las imágenes**
- **Backend y gateway (NestJS):** cada uno tiene su `Dockerfile` basado en `node:22-slim`. Primero se copian los `package*.json` y se hace `npm ci` (así Docker reutiliza la caché si las dependencias no cambiaron), después se copia el código, se compila con `npm run build` y se arranca con `node dist/main`.
- **Frontend (multi-stage):** la etapa 1 compila la app React con Node; la etapa 2 copia solo la carpeta `dist` a una imagen liviana de `nginx:alpine`. El `nginx.conf` devuelve `index.html` para cualquier ruta, así React Router funciona al recargar en `/admin`, `/perfil`, etc.
- Cada carpeta tiene su `.dockerignore` (excluye `node_modules`, `dist` y `.env`).

**Configuración**
- Las variables de entorno de cada servicio se definen en el `docker-compose.yml` (sección `environment`), no hace falta crear archivos `.env`.
- Dentro de la red de Docker los servicios se encuentran por nombre: por ejemplo el gateway usa `http://ms-usuarios:3001` y los microservicios usan `mongodb://mongo:27017/...`.
- Una sola instancia de MongoDB aloja dos bases separadas: `tp_usuarios` y `tp_turnos`.
- El frontend se compila con `VITE_API_USUARIOS_URL` y `VITE_API_TURNOS_URL` apuntando al gateway (`http://localhost:3000`). Estas variables de Vite se graban al **compilar**, por eso se pasan como `args` del build.
- Los datos de Mongo persisten en el volumen `mongo-data`.
- La base se inicializa sola: ms-usuarios carga los usuarios de prueba al arrancar (sección 6) y los índices de las colecciones los crea Mongoose.

**Comandos útiles**

```bash
docker compose up --build        # construir y levantar todo
docker compose up -d --build     # lo mismo, en segundo plano
docker compose logs -f ms-usuarios   # ver logs de un servicio
docker compose ps                # estado de los contenedores
docker compose down              # detener y quitar los contenedores (conserva los datos)
docker compose down -v           # además borra el volumen: la base queda vacía
docker compose build frontend    # reconstruir un solo servicio
```

### Sin Docker (desarrollo)

Requisitos: Node 22 y una instancia de MongoDB.

```bash
# en cada carpeta: ms-usuarios, ms-turnos, api-gateway
cp .env.example .env     # completar PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN
npm install
npm run start:dev
```

```bash
# frontend
cd frontend
npm install
npm run dev
```

Variables de entorno principales:

| Variable | Servicio | Descripción |
|---|---|---|
| `PORT` | todos | Puerto del servicio |
| `MONGODB_URI` | ms-usuarios, ms-turnos | Cadena de conexión a MongoDB |
| `JWT_SECRET` | ms-usuarios, ms-turnos | Clave de firma del JWT (debe ser la misma en ambos) |
| `JWT_EXPIRES_IN` | ms-usuarios | Duración del token (ej. `24h`) |
| `MS_USUARIOS_URL` | api-gateway, ms-turnos | URL de ms-usuarios |
| `MS_TURNOS_URL` | api-gateway | URL de ms-turnos |
| `SEED_USERS` | ms-usuarios | `false` para desactivar el seed |

## 5. Tests

```bash
# Backend (en ms-usuarios y en ms-turnos)
npm run test        # tests unitarios
npm run test:e2e    # tests end-to-end

# Frontend
cd frontend && npm test
```

- **Unitarios:** servicios de usuarios, auth, turnos y signos (creación de entidades, error por email/DNI duplicado, horarios ocupados).
- **E2E:** flujos de turnos y de signos y síntomas contra la API.
- **Frontend:** Vitest + React Testing Library (formulario de turno, tabla de turnos, ruta protegida y utilidades).

## 6. Usuarios de prueba (seed)

Se crean automáticamente al iniciar ms-usuarios (idempotente, no duplica):

| Rol | Email | Contraseña |
|---|---|---|
| administrator | ruben.admin@test.com | Password123! |
| nurse | santiago.enfermero@test.com | Password123! |
| patient | rodrigo.paciente@test.com | Password123! |

> Son solo para desarrollo. En un entorno real hay que desactivar el seed con `SEED_USERS=false`.

## 7. Decisiones de diseño

- **Microservicios con base propia** por servicio, para que usuarios y turnos evolucionen de forma independiente.
- **API Gateway** como único punto de entrada para simplificar el frontend y centralizar CORS.
- **JWT compartido:** ms-turnos valida el token sin llamar al login; solo consulta a ms-usuarios para verificar la existencia de pacientes y enfermeros.
- **Roles en el backend** con guards (`JwtAuthGuard` + `RolesGuard` + decorador `@Roles`); el frontend solo oculta opciones.
- **Validación global de DTOs** con `class-validator` (`whitelist` y `forbidNonWhitelisted`).
- **Eliminación lógica** de usuarios para conservar el historial de turnos y signos.
- **Documentación** de la API con Swagger y de GraphQL con su playground.
