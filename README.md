# 💊 CleverHub – Pharmacy Management System

CleverHub es una **aplicación profesional de gestión de farmacias (POS + ERP ligero)** diseñada para cubrir ventas, stock, clientes, proveedores, compras, reportes y asistencia inteligente en tiempo real.

El objetivo es ofrecer una experiencia **rápida, clara y segura**, adaptada al entorno farmacéutico moderno.

---

## 🚀 Funcionalidades principales

### 🛒 Ventas (POS)
- Carrito de venta en tiempo real
- Gestión de cantidades y descuentos por producto
- Descuento global (no combinable)
- Cálculo automático de totales
- Registro de ventas
- Control de stock tras la venta
- Preparado para interacciones medicamentosas

---

### 📦 Productos
- Alta / edición / eliminación de productos
- Gestión de stock
- Fecha de caducidad
- Categorización
- Precio de venta
- Productos activos / inactivos

---

### 👥 Clientes
- Registro de clientes
- Historial de compras
- Identificación rápida en ventas
- Preparado para fidelización y descuentos futuros

---

### 🏭 Proveedores
- Gestión de proveedores
- Información de contacto
- Activación / desactivación
- Relación con compras

---

### 📥 Compras
- Registro de compras a proveedores
- Entrada de stock automática
- Histórico de compras
- Control de costes

---

### 📊 Reportes (preparado)
- Ventas por periodo
- Productos más vendidos
- Stock crítico
- Ticket medio
- Rendimiento diario

---

### 🤖 Asistente CleverHub
- Sugerencias inteligentes de productos
- Simulación de interacciones medicamentosas
- Estadísticas en tiempo real
- Panel motivacional para el farmacéutico

---

## 🧱 Arquitectura del proyecto

### Backend
- Node.js
- TypeScript
- Express
- MongoDB + Mongoose
- Arquitectura por capas (routes / controllers / services / models)
- Middleware de errores y autenticación
- Diseño preparado para escalar


---

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Recharts
- Framer Motion
- Arquitectura por componentes
- UX enfocada a ventas rápidas


---

## ⚙️ Variables de entorno (.env)

Ejemplo:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cleverhub
JWT_SECRET=super_secret_key
