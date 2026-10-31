# ☁️ CloudLab: System Architecture & Workflow Guide

An interactive, multi-tenant cloud infrastructure simulation platform engineered for teaching and demonstrating Cloud Architecture, Resource Provisioning, Security Operations, and Role-Based Administration.

---

## 📑 Table of Contents
1. [High-Level Architecture & Tech Stack](#1-high-level-architecture--tech-stack)
2. [Data Flow & Communication Model](#2-data-flow--communication-model)
3. [Authentication & Role-Based Access Control (RBAC)](#3-authentication--role-based-access-control-rbac)
4. [Page-by-Page Workflow & Feature Guide](#4-page-by-page-workflow--feature-guide)
   - [4.1 User Login (`/login`) & Registration (`/register`)](#41-user-login-login--registration-register)
   - [4.2 Administrator Portal (`/admin/login`)](#42-administrator-portal-adminlogin)
   - [4.3 Global Navigation & Header (TopNav & Sidebar)](#43-global-navigation--header-topnav--sidebar)
   - [4.4 Main Dashboard (`/`)](#44-main-dashboard-)
   - [4.5 Architecture Designer (`/designer`)](#45-architecture-designer-designer)
   - [4.6 Virtual Instances Manager (`/instances`)](#46-virtual-instances-manager-instances)
   - [4.7 Network & Load Simulator (`/network`)](#47-network--load-simulator-network)
   - [4.8 Security Center (`/security`)](#48-security-center-security)
   - [4.9 Platform Settings (`/settings`)](#49-platform-settings-settings)
   - [4.10 User Management Admin Panel (`/users`)](#410-user-management-admin-panel-users)
5. [Database Schema Reference](#5-database-schema-reference)
6. [API Route Directory](#6-api-route-directory)

---

## 1. High-Level Architecture & Tech Stack

CloudLab is constructed as a decoupled **Single Page Application (SPA) + REST API** architecture:

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|  React 19 + TypeScript + Vite + TailwindCSS + React Flow + Recharts     |
+------------------------------------+------------------------------------+
                                     |  HTTP REST / JSON / JWT Bearer
                                     v
+-------------------------------------------------------------------------+
|                              BACKEND                                    |
|  Python 3 + Flask REST API + Flask-JWT-Extended + Flask-CORS + Werkzeug |
+------------------------------------+------------------------------------+
                                     |  SQLAlchemy ORM
                                     v
+-------------------------------------------------------------------------+
|                              DATABASE                                   |
|  SQLite 3 (`backend/instance/cloudlab.db`)                              |
+-------------------------------------------------------------------------+
```

### Key Libraries:
- **Frontend UI / Styling**: `TailwindCSS` with custom glassmorphism design (`backdrop-blur`, dark slate surfaces, glowing accent borders), `lucide-react` for cloud iconography, `framer-motion` for fluid card transitions.
- **Diagramming Engine**: `@xyflow/react` (React Flow) for interactive cloud infrastructure topology mapping.
- **Analytics & Charting**: `recharts` for live CPU & RAM area graphs.
- **Routing & State**: `react-router-dom` v7 with nested layouts, `localStorage` session management, and `axios` API interceptors.
- **Backend Framework**: `Flask` application factory pattern with blueprint separation (`routes.py`), modular config (`config.py`), and SQLAlchemy models (`models.py`).

---

## 2. Data Flow & Communication Model

```
   [Browser Client]
          |
          | 1. Form Submission / Navigation
          v
   [Axios Client Service (`src/services/api.ts`)]
          |
          | 2. Attach Authorization: Bearer <JWT>
          v
   [Flask REST Endpoints (`backend/routes.py`)]
          |
          | 3. Authenticate JWT Identity & Role Check
          v
   [SQLAlchemy Models (`backend/models.py`)]
          |
          | 4. Query / Commit to SQLite Database
          v
   [JSON Response to Client]
          |
          | 5. Update React State & Trigger Re-renders
          v
   [Real-Time UI Refresh]
```

- **Authentication Interceptor**: All outgoing requests from `api.ts` automatically append the stored JWT token from `localStorage`. If an endpoint returns `401 Unauthorized`, the interceptor clears credentials and cleanly redirects the browser to `/login`.
- **Live Metric Polling**: The Dashboard polls `/api/dashboard/stats` every 5 seconds, updating resource cards and the live utilization chart in real time.
- **Real-Time Warning Polling**: The TopNav polls `/api/notifications` every 10 seconds to discover any newly dispatched administrator warnings.

---

## 3. Authentication & Role-Based Access Control (RBAC)

CloudLab separates users into two distinct security tiers:

| Role | Access Scope | Login Gateway | Visible Capabilities |
| :--- | :--- | :--- | :--- |
| **User** | Tenant / Developer | `/login` | Infrastructure Dashboard, Architecture Canvas, Virtual Instances, Network Simulator, Security Monitor, Personal Settings, Notification Feed. |
| **Administrator** | Cloud Operations / Superuser | `/admin/login` | **All User capabilities** + Exclusive **User Management Panel** (`/users`), Account Deletion, and System Warning Dispatcher. |

### Security Boundaries:
1. **Frontend Gatekeeping**:
   - `<ProtectedRoute>`: Enforces active JWT authentication for all internal pages.
   - `<AdminRoute>`: Inspects stored user role; non-admins attempting to access `/users` are immediately bounced back to `/`.
   - **Dynamic Sidebar**: The "User Management" nav item is conditionally injected into the navigation menu only if the authenticated user possesses the `Administrator` role.
2. **Backend Gatekeeping**:
   - Custom `@admin_required` decorator validates the JWT identity against the `User` database record. Unauthorized calls return `HTTP 403 Forbidden`.
   - Dedicated portal validation: Attempting to log into `/login` with an Administrator account or `/admin/login` with a standard User account returns an explicit redirection rejection.

---

## 4. Page-by-Page Workflow & Feature Guide

### 4.1 User Login (`/login`) & Registration (`/register`)
- **Workflow**:
  1. Regular users access `http://localhost:5173/login`.
  2. Flexible identifier support: Users can sign in using **either their Username or Email Address**.
  3. New users click **"Create one"** (`/register`), fill out Username, Email, and Password, which creates the account and automatically logs them into the dashboard.
  4. Administrators seeing this page can click the bottom link: *"Are you an administrator? Sign in here."* to navigate to `/admin/login`.

---

### 4.2 Administrator Portal (`/admin/login`)
- **Workflow**:
  1. Administrators navigate to `http://localhost:5173/admin/login`.
  2. Features a distinct amber/gold-accented security portal with shield branding.
  3. Authenticates using Admin ID (e.g. `admin`) and Passcode (e.g. `password`).
  4. Backend verifies `role == 'Administrator'` and returns an admin session token.

---

### 4.3 Global Navigation & Header (TopNav & Sidebar)
- **Top Navigation Bar (`src/components/TopNav.tsx`)**:
  - **Global Search Input**: Type any VM name, tier, or provider (e.g. `t3.micro`, `AWS`) and press Enter to instantly jump to the Virtual Instances workspace with active search filters.
  - **`+ Add Resource` Quick Button**: Opens the VM launch modal from anywhere in the application.
  - **Notification Bell**: Shows a pulsing red indicator when admin warnings are pending. Clicking reveals a dropdown of messages with a **checkmark (dismiss)** button to mark them as read.
  - **User Profile Pill**: Displays dynamic user avatar initials (e.g. `AD`, `JD`), username, and role badge.
- **Sidebar (`src/components/Sidebar.tsx`)**:
  - Contains navigation links with active state highlighting.
  - Dynamically includes the **User Management** tab when logged in as an Administrator.
  - Features the **Logout** action at the bottom, destroying the JWT session and routing back to login.

---

### 4.4 Main Dashboard (`/`)
- **Workflow & Features**:
  - **Metric Cards (4x)**: Displays Total Virtual Servers, Aggregated Storage (GB), Simulated Network Traffic (TB), and Dynamic Monthly Cost ($) computed directly from active database records.
  - **Live Resource Utilization**: Animated Recharts Area Graph charting CPU % (Blue) and RAM % (Purple) over time.
  - **`+ Simulate VM Creation` Button**: Quick action allowing instant creation of a test instance to demonstrate live metric recalculation and graph spikes.
  - **Activity Feed**: Displays recent system audit events and health check confirmations.

---

### 4.5 Architecture Designer (`/designer`)
- **Workflow & Features**:
  - **Interactive Canvas**: Drag, reposition, and link cloud components on an infinite dark-mode grid canvas powered by `@xyflow/react`.
  - **Component Palette**: Click buttons on the left toolbar to spawn:
    - 🟣 **Virtual Machine** nodes
    - 🔵 **Load Balancer** nodes
    - 🔷 **Database** nodes
  - **Connection Handles**: Click and drag lines between node connection handles to visually design load-balanced 3-tier topologies.
  - **MiniMap & Controls**: Built-in zoom, pan, and mini-map overview controls.

---

### 4.6 Virtual Instances Manager (`/instances`)
- **Workflow & Features**:
  - **Multi-Cloud Inventory Table**: Lists all provisioned instances with instance name, cloud vendor tag (AWS / Azure / GCP), status indicator, hardware specs, monthly pricing, and actions.
  - **URL-Aware Filtering**: Responds to `?search=<query>` query parameters from the TopNav search bar.
  - **Launch Instance Modal (`+ Launch Instance`)**:
    - **Instance Name**: Custom hostname input.
    - **Cloud Vendor**: Select from AWS, Azure, or GCP.
    - **Operating System**: Choose from Ubuntu 22.04 LTS, Amazon Linux 2023, or Windows Server 2022.
    - **Tiered Instance Presets & Pricing**:
      - `t3.micro`: 2 vCPU, 1 GB RAM, 20 GB Disk ($8.50/mo)
      - `m5.large`: 4 vCPU, 16 GB RAM, 50 GB Disk ($45.00/mo)
      - `c5.xlarge`: 8 vCPU, 16 GB RAM, 100 GB Disk ($95.50/mo)
      - `r5.2xlarge`: 8 vCPU, 64 GB RAM, 200 GB Disk ($180.00/mo)
  - **Termination (`🗑 Delete`)**: Deletes the instance from the database and recalculates global infrastructure costs.

---

### 4.7 Network & Load Simulator (`/network`)
- **Workflow & Features**:
  - **Load Balancer Metrics**: Live simulated throughput statistics showing current requests per second (e.g. 1,402 Req/Sec), 99.9% uptime, and 42ms response latency.
  - **VPC Subnet Architecture**: Visual breakdown of active Public and Private subnets with CIDR blocks (`10.0.1.0/24`, `10.0.2.0/24`) and operational health indicators.

---

### 4.8 Security Center (`/security`)
- **Workflow & Features**:
  - **Incident Log Feed**: Simulated real-time security events such as blocked SSH brute-force attacks (`192.168.1.45`) and anomalous geographic logins.
  - **Inbound Firewall Rules Table**: Live inspection of active security group rules (Port 80/443 HTTP/S Allowed, Port 22 SSH restricted to VPC CIDR, default Deny All).

---

### 4.9 Platform Settings (`/settings`)
- **Workflow & Features**:
  - **Profile Management**: Inspect user identity, role, and registered email address.
  - **API Token Generator**: Simulated programmatic access key provisioning.
  - **Notification Preferences**: Toggles for automated billing threshold alerts ($500/mo) and security incident notifications.

---

### 4.10 User Management Admin Panel (`/users`)
- **Workflow & Features**:
  - *Restricted to Administrator accounts only.*
  - **Tenant Table**: Lists all registered platform users with their internal User IDs, Username, Email, and Access Role.
  - **Dispatch Warning (`Warn` Button)**:
    1. Clicking opens a warning modal targeted to that specific user.
    2. Admin types a message (e.g. *"Excessive CPU utilization detected. Please resize your instances."*).
    3. Backend creates a `WarningNotification` record linked to the user.
    4. The user immediately receives a red pulsing badge on their TopNav notification bell.
  - **Account Termination (`Delete` Button)**:
    1. Admin confirms deletion via confirmation prompt.
    2. Backend cascades deletion across the user account, all associated virtual machines, and all notifications.

---

## 5. Database Schema Reference

### `User` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `username` | String(80) | Unique, Not Null | User login name |
| `email` | String(120) | Unique, Not Null | Email address |
| `password_hash` | String(256) | Not Null | Werkzeug-generated password hash |
| `role` | String(20) | Default: `'User'` | `'User'` or `'Administrator'` |

### `VirtualMachine` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `name` | String(80) | Not Null | Hostname of instance |
| `instance_type` | String(50) | Default: `'t3.micro'` | Selected hardware tier |
| `monthly_cost` | Float | Default: `14.50` | Monthly estimated billing |
| `cpu_cores` | Integer | Default: `2` | Number of virtual cores |
| `ram_gb` | Integer | Default: `4` | RAM in Gigabytes |
| `storage_gb` | Integer | Default: `20` | Root volume storage size |
| `os` | String(50) | Default: `'Ubuntu 22.04'` | OS distribution |
| `region` | String(50) | Default: `'us-east-1'` | Geographic cloud region |
| `vendor` | String(50) | Default: `'AWS'` | Cloud provider (`AWS`, `Azure`, `GCP`) |
| `status` | String(20) | Default: `'Running'` | Lifecycle status |
| `ip_address` | String(20) | Nullable | Assigned private IPv4 address |
| `user_id` | Integer | Foreign Key (`user.id`) | Owning user account |
| `created_at` | DateTime | Default: `UTC Now` | Timestamp of creation |

### `WarningNotification` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique identifier |
| `user_id` | Integer | Foreign Key (`user.id`), Not Null | Target user recipient |
| `message` | Text | Not Null | Text content of admin warning |
| `is_read` | Boolean | Default: `False` | Read status |
| `created_at` | DateTime | Default: `UTC Now` | Timestamp of dispatch |

---

## 6. API Route Directory

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new standard User account |
| `POST` | `/api/auth/login` | Public | Authenticates credentials (username/email) and checks portal type |
| `GET` | `/api/auth/me` | JWT Required | Returns current authenticated user profile |
| `GET` | `/api/dashboard/stats` | Public / Optional JWT | Aggregates VM counts, storage, bandwidth, and cost totals |
| `GET` | `/api/vms` | Public / Optional JWT | Lists all simulated virtual machines |
| `POST` | `/api/vms` | Public / Optional JWT | Launches and persists a new virtual machine |
| `DELETE` | `/api/vms/<id>` | Public / Optional JWT | Terminates and removes a virtual machine |
| `GET` | `/api/users` | **Admin Only** | Returns all registered user accounts |
| `DELETE` | `/api/users/<id>` | **Admin Only** | Deletes a user account and all attached resources |
| `POST` | `/api/users/<id>/warnings`| **Admin Only** | Dispatches a warning notification to a user |
| `GET` | `/api/notifications` | JWT Required | Fetches unread warning notifications for current user |
| `PUT` | `/api/notifications/<id>/read` | JWT Required | Marks a specific notification as read/dismissed |
