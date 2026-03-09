# 🏡 Sistema de Gestión Inmobiliaria

Aplicación web para **administrar terrenos, clientes y cobros** en proyectos inmobiliarios.
Permite registrar lotes, controlar pagos, gestionar usuarios y generar reportes.

El sistema está dividido en dos partes:

* **Frontend:** React + Vite
* **Backend:** Node.js + Express + MySQL

---

# 📦 Tecnologías utilizadas

## Frontend

* React 18
* Vite
* Redux Toolkit
* React Redux
* React Router DOM
* Axios
* Bootstrap Icons

## Backend

* Node.js
* Express
* MySQL
* JWT (autenticación)
* Bcrypt (encriptación de contraseñas)
* Nodemailer (envío de correos)
* PDFKit (generación de PDFs)
* Excel4Node (exportación a Excel)
* QRCode

## Herramientas de desarrollo

* Nodemon
* ESLint
* Concurrently

---

# 📂 Estructura del proyecto

```
inmobiliaria/
│
├── app/                # Frontend React
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/             # Backend Node.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── package.json
│
└── package.json        # Script para ejecutar ambos proyectos
```

---

# ⚙️ Instalación

Clonar el repositorio:

```bash
git clone https://github.com/luissince/Inmobiliaria.git
cd inmobiliaria
```

Instalar dependencias del proyecto principal:

```bash
npm install
```

Instalar dependencias del frontend:

```bash
cd app
npm install
```

Instalar dependencias del backend:

```bash
cd ../server
npm install
```

---

# 🚀 Ejecutar la aplicación

Desde la carpeta raíz del proyecto:

```bash
npm run dev
```

Este comando ejecutará simultáneamente:

* **Frontend:** Vite
* **Backend:** Node con Nodemon

Gracias al paquete **concurrently**.

---

# 🔐 Variables de entorno

Crear un archivo `.env` dentro de la carpeta `server`.

Ejemplo:

```
PORT=4000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=inmobiliaria

JWT_SECRET=clave_secreta
EMAIL_USER=correo@gmail.com
EMAIL_PASSWORD=contraseña
```

---

# 📊 Funcionalidades principales

### 🏘 Gestión de terrenos

* Registro de lotes
* Ubicación y estado del terreno
* Control de disponibilidad

### 👤 Gestión de clientes

* Registro de compradores
* Historial de compras
* Información de contacto

### 💰 Control de pagos

* Registro de cuotas
* Historial de pagos
* Control de deudas

### 📄 Reportes

* Exportación a **PDF**
* Exportación a **Excel**
* Reportes de pagos

### 🔐 Seguridad

* Autenticación con **JWT**
* Contraseñas encriptadas con **bcrypt**

---

# 🧠 Arquitectura

El sistema sigue una arquitectura **cliente-servidor**:

```
React (Frontend)
        │
        │ HTTP / Axios
        ▼
Node.js + Express (API REST)
        │
        ▼
MySQL (Base de datos)
```

---

# 🛠 Scripts disponibles

En la raíz del proyecto:

```json
"scripts": {
  "dev": "concurrently \"npm run dev --prefix app\" \"npm run dev --prefix server\""
}
```

Esto permite iniciar **frontend y backend con un solo comando**.

---

# 📌 Mejoras futuras

* Panel de estadísticas
* Mapa de terrenos
* Notificaciones de pago
* Firma digital de contratos
* Integración con pasarela de pagos

---

Si quieres, también puedo hacerte un **README mucho más profesional tipo GitHub top** con:

* badges
* screenshots
* arquitectura más clara
* API endpoints documentados
* base de datos (tablas)
* diagrama del sistema

que haría que tu proyecto se vea **mucho más serio para portafolio o empresa**.
