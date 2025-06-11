# Código para Todos - Backend API

Este es el backend de la plataforma de aprendizaje "Código para Todos", construido con FastAPI. Proporciona una API RESTful completa para gestionar usuarios, evaluaciones diagnósticas, rutas de aprendizaje y progreso del estudiante.

## 🚀 Características

- **Autenticación completa**: Login, registro, login social, recuperación de contraseña
- **Evaluación diagnóstica adaptativa**: Sistema inteligente de preguntas que se adapta al nivel del usuario
- **Rutas de aprendizaje**: Gestión de cursos, módulos y lecciones
- **Seguimiento de progreso**: Estadísticas detalladas y sistema de logros
- **Dashboard personalizado**: Datos consolidados para la experiencia del usuario
- **Documentación automática**: Swagger UI integrado
- **Datos mock**: Sistema completo de datos simulados para desarrollo

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # Aplicación FastAPI principal
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py               # Configuración de la aplicación
│   ├── models/                     # Modelos Pydantic
│   │   ├── __init__.py
│   │   ├── auth.py                 # Modelos de autenticación
│   │   ├── diagnostic.py           # Modelos de evaluación diagnóstica
│   │   ├── learning.py             # Modelos de rutas de aprendizaje
│   │   └── common.py               # Modelos comunes
│   ├── routers/                    # Endpoints de la API
│   │   ├── __init__.py
│   │   ├── auth.py                 # Endpoints de autenticación
│   │   ├── diagnostic.py           # Endpoints de evaluación
│   │   ├── learning_paths.py       # Endpoints de rutas de aprendizaje
│   │   └── home.py                 # Endpoints del dashboard
│   ├── services/                   # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── auth_service.py         # Servicio de autenticación
│   │   ├── diagnostic_service.py   # Servicio de evaluación
│   │   └── learning_service.py     # Servicio de aprendizaje
│   └── utils/
│       ├── __init__.py
│       └── mock_data.py            # Generador de datos mock
├── requirements.txt                # Dependencias
├── README.md                       # Este archivo
└── .gitignore                      # Archivos a ignorar
```

## ⚡ Instalación y Configuración

### Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Crear entorno virtual** (recomendado)
   ```bash
   python -m venv venv
   
   # En Windows
   venv\Scripts\activate
   
   # En macOS/Linux
   source venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno** (opcional)
   ```bash
   # Crear archivo .env en la raíz del proyecto
   SECRET_KEY=tu-clave-secreta-aqui
   DEBUG=True
   PORT=8000
   ```

## 🏃‍♂️ Ejecutar la Aplicación

### Modo Desarrollo

```bash
# Opción 1: Usando uvicorn directamente
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Opción 2: Ejecutando el archivo main.py
python -m app.main

# Opción 3: Desde la carpeta app
cd app
python main.py
```

### Modo Producción

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

La aplicación estará disponible en:
- **API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc

## 📚 Documentación de la API

### Endpoints Principales

#### Autenticación (`/api/auth`)
- `POST /login` - Iniciar sesión con email y contraseña
- `POST /register` - Registrar nuevo usuario
- `POST /social-login` - Login con redes sociales (Google, GitHub, Facebook)
- `POST /forgot-password` - Solicitar recuperación de contraseña
- `PUT /profile/{user_id}` - Actualizar perfil de usuario
- `PUT /change-password/{user_id}` - Cambiar contraseña
- `POST /logout` - Cerrar sesión

#### Evaluación Diagnóstica (`/api/diagnostic`)
- `POST /start-session` - Iniciar nueva sesión de evaluación
- `GET /questions` - Obtener todas las preguntas disponibles
- `GET /questions/{session_id}/adaptive` - Obtener preguntas adaptativas
- `POST /submit-answer` - Enviar respuesta y obtener siguiente pregunta
- `POST /calculate-results/{session_id}` - Calcular resultados finales
- `POST /save-results/{session_id}` - Guardar resultados en base de datos
- `GET /history/{user_id}` - Obtener historial de evaluaciones
- `GET /session/{session_id}` - Obtener detalles de sesión

#### Rutas de Aprendizaje (`/api/learning-paths`)
- `GET /` - Obtener todas las rutas de aprendizaje
- `GET /by-difficulty?difficulty={level}` - Filtrar por dificultad
- `GET /recommended/{user_id}` - Obtener recomendaciones personalizadas
- `POST /enroll` - Inscribirse en una ruta de aprendizaje
- `PUT /progress` - Actualizar progreso del usuario
- `GET /{path_id}/content` - Obtener contenido detallado del curso
- `GET /{path_id}/progress/{user_id}` - Obtener progreso del curso
- `GET /lessons/{lesson_id}` - Obtener contenido de lección específica
- `PUT /lessons/complete` - Marcar lección como completada

#### Dashboard y Estadísticas (`/api/home`)
- `GET /achievements/{user_id}/recent` - Obtener logros recientes
- `GET /achievements/{user_id}` - Obtener todos los logros
- `GET /stats/{user_id}` - Obtener estadísticas del usuario
- `GET /daily-tip` - Obtener consejo diario
- `GET /dashboard/{user_id}` - Obtener datos consolidados del dashboard
- `GET /progress/{user_id}` - Obtener progreso en todas las rutas

### Ejemplos de Uso

#### Registro de Usuario
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Juan",
       "last_name": "Pérez",
       "email": "juan@ejemplo.com",
       "password": "miPassword123"
     }'
```

#### Iniciar Evaluación Diagnóstica
```bash
curl -X POST "http://localhost:8000/api/diagnostic/start-session" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "1"}'
```

#### Obtener Rutas Recomendadas
```bash
curl "http://localhost:8000/api/learning-paths/recommended/1?evaluation_level=basic"
```

## 🧪 Datos Mock para Desarrollo

El sistema incluye un generador completo de datos mock para facilitar el desarrollo:

### Usuarios Predefinidos
- **Estudiante**: `juan@email.com` (contraseña: cualquier texto de 6+ caracteres)
- **Estudiante**: `maria@email.com` (contraseña: cualquier texto de 6+ caracteres)  
- **Admin**: `admin@email.com` (contraseña: cualquier texto de 6+ caracteres)

### Contenido de Prueba
- **8 rutas de aprendizaje** completas con diferentes niveles de dificultad
- **Curso completo de "Fundamentos de Programación"** con 8 módulos y 30+ lecciones
- **6 preguntas** para evaluación diagnóstica adaptativa
- **Logros y estadísticas** simulados para cada usuario
- **Consejos diarios** rotativos para motivación

### Configuración de Mock Data
Los datos mock se pueden configurar en `app/core/config.py`:

```python
# Habilitar/deshabilitar datos mock
ENABLE_MOCK_DATA: bool = True

# Simular delays de red (segundos)
MOCK_DELAY_SECONDS: float = 0.5
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Puedes configurar la aplicación usando un archivo `.env`:

```env
# Configuración del servidor
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Seguridad
SECRET_KEY=tu-clave-secreta-muy-segura
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=["http://localhost:4200", "http://localhost:3000"]

# Mock Data
ENABLE_MOCK_DATA=True
MOCK_DELAY_SECONDS=0.5
```

### Personalización de CORS

Para conectar con diferentes frontends, modifica `ALLOWED_ORIGINS` en `config.py` o usa variables de entorno:

```python
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:4200",  # Angular
    "http://localhost:3000",  # React
    "https://tu-dominio.com"  # Producción
]
```

## 🚀 Escalabilidad y Producción

### Preparación para Base de Datos Real

El código está estructurado para facilitar la migración a una base de datos real:

1. **Servicios separados**: La lógica de negocio está separada de los controladores
2. **Modelos Pydantic**: Listos para integrar con ORMs como SQLAlchemy
3. **Inyección de dependencias**: Fácil intercambio de servicios mock por reales
4. **Estructura de capas**: Separación clara entre routers, services y models

### Próximos Pasos para Producción

- [ ] Implementar base de datos (PostgreSQL/MySQL)
- [ ] Agregar autenticación JWT real
- [ ] Implementar cache con Redis
- [ ] Agregar logging estructurado
- [ ] Configurar monitoreo y métricas
- [ ] Implementar tests unitarios y de integración
- [ ] Agregar validación de schemas OpenAPI
- [ ] Configurar CI/CD

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- 📧 Email: soporte@codigoparatodos.com
- 📱 GitHub Issues: [Crear issue](https://github.com/Johann-28/codigo-para-todos/issues)
- 📖 Documentación: http://localhost:8000/docs (cuando el servidor esté corriendo)

---

Desarrollado con ❤️ para la comunidad de programadores hispanohablantes.