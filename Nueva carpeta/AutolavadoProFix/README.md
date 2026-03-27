# 🚿 Autolavado Pro — Expo Go

App completa de gestión de autolavado. Funciona con **Expo Go** sin necesidad de compilar.

---

## 🚀 Cómo correrla (paso a paso)

### 1. Requisitos previos
Instala lo siguiente si no lo tienes:
- [Node.js 18+](https://nodejs.org)
- [VS Code](https://code.visualstudio.com)
- App **Expo Go** en tu teléfono ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Abrir el proyecto en VS Code
1. Descomprime el ZIP en una carpeta
2. Abre VS Code → `File > Open Folder` → selecciona la carpeta `AutolavadoPro`
3. Abre la terminal integrada: **Ctrl+`** (o `Ctrl+Shift+P` → "Terminal: New Terminal")

### 3. Instalar dependencias
```bash
npm install
```
⏳ Espera 1-2 minutos mientras se instalan los paquetes.

### 4. Iniciar el servidor
```bash
npx expo start
```
Verás un **código QR** en la terminal.

### 5. Escanear con tu teléfono
- **iPhone**: Abre la cámara y apunta al QR → toca el link que aparece
- **Android**: Abre la app **Expo Go** → toca "Scan QR code" → escanea el QR

> ⚠️ Tu teléfono y computadora deben estar en la **misma red WiFi**.
> Si hay problemas de red, en la terminal presiona `t` para abrir en modo tunnel.

---

## 🔑 Cuentas de prueba

| Rol          | Usuario | Contraseña |
|:-------------|:--------|:-----------|
| 👑 Admin     | admin   | 123        |
| 👷 Empleado  | juan    | 123        |
| 👷 Empleado  | maria   | 123        |

---

## 📱 Pantallas incluidas

### Admin
- **Dashboard** — estadísticas y accesos rápidos
- **Empleados** — CRUD completo (crear, editar, eliminar)
- **Lavados** — filtros por estado, crear nuevos lavados
- **Historial** — todos los lavados finalizados
- **Detalle** — gestión completa del flujo de lavado

### Empleado
- **Mis Lavados** — lavados asignados, tabs activo/completado/cancelado
- **Historial** — mis lavados finalizados
- **Detalle** — verificar ubicación → evidencias antes → iniciar → evidencias después → finalizar

---

## 🗂 Estructura del proyecto

```
AutolavadoPro/
├── App.tsx                         ← Punto de entrada
├── src/
│   ├── context/
│   │   └── AppContext.tsx          ← Estado global (usuarios, lavados)
│   ├── navigation/
│   │   └── AppNavigator.tsx        ← Navegación (Stack + Tabs)
│   ├── components/
│   │   └── UI.tsx                  ← Componentes reutilizables
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── admin/
│       │   ├── AdminDashboard.tsx
│       │   ├── AdminEmployees.tsx
│       │   └── AdminWashes.tsx
│       ├── employee/
│       │   └── EmployeeDashboard.tsx
│       └── shared/
│           ├── HistoryScreen.tsx
│           ├── WashDetailScreen.tsx
│           └── ProfileScreen.tsx
└── package.json
```

---

## ⚡ Solución de problemas

| Problema | Solución |
|:---------|:---------|
| No carga en Expo Go | Asegúrate de estar en la misma WiFi |
| Error de red | Presiona `t` en la terminal (modo tunnel) |
| "Unable to resolve module" | Corre `npm install` otra vez |
| Pantalla en blanco | Presiona `r` en la terminal para recargar |
