# VT4S Master Schedule Application

A web-based Master Work Schedule application for managing FES team schedules with historical tracking, approval workflows, and schedule change requests.

## Features

- **Rolling 6-Month Schedule**: Automatically generates schedules 6 months in advance
- **Historical Records**: Toggle to view past schedules while keeping them separate from current/future schedules
- **Team Management**: Add, edit, and remove FES team members with expandable settings menu
- **Fixed Schedule Patterns**: Set weekly schedule patterns for each employee (Mon-Sun)
- **Schedule Change Requests**: FES members can request time off or swap days within the same week
- **Approval Workflow**: Admins can approve/reject schedule change requests
- **Role-Based Access**: Admin and FES roles with different permissions
- **Visual Indicators**: Yellow highlighting for swapped days and approved time off

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd "VT4S Master Schedule"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Default Login

- **Username**: `admin`
- **Password**: `admin`

## Usage

### For Admins

1. **Login** with admin credentials
2. **Add Team Members**: Click the Settings (⚙️) button → Team Members tab → Add new employees
3. **Set Schedule Patterns**: Settings → Schedule Patterns tab → Select employee → Configure weekly pattern
4. **Approve Requests**: View pending approvals in the sidebar → Click to approve/reject
5. **View Historical Schedules**: Toggle "Show Historical Weeks" to see past schedules

### For FES Members

1. **Login** with your FES credentials
2. **Request Schedule Changes**: Click on any day in the schedule → Choose "Request Day Off" or "Swap with Another Day"
3. **View Your Schedule**: Browse through weeks using Previous/Next buttons

## Project Structure

```
src/
├── components/
│   ├── Auth/              # Login form
│   ├── Modals/            # Schedule change and approval modals
│   ├── Navigation/        # Historical toggle
│   ├── Schedule/          # Schedule grid and cells
│   ├── Settings/          # Team management and schedule patterns
│   └── TodoList/          # Approval todo list
├── contexts/              # React context providers
├── services/              # Business logic and data persistence
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Data Storage

All data is stored in the browser's `localStorage`. This means:
- Data persists between sessions
- Data is browser-specific (not shared across browsers/devices)
- For multi-user access, consider migrating to a cloud database

## Important Notes

- **Weeks run Saturday through Sunday** as specified
- **Schedule changes only affect future dates** - historical schedules remain unchanged
- **Fixed patterns apply to all future dates** in the rolling 6-month schedule
- **Pending requests** are visually indicated with a dashed border and hourglass icon

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

## Technologies Used

- React 19
- TypeScript
- Vite
- date-fns
- CSS Modules
