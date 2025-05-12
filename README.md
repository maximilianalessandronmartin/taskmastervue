# TaskMaster

## Project Overview
TaskMaster is a modern web application designed to enhance personal productivity and track tasks in a gamified way. The application offers an achievement system, social features, and intuitive task management.

## Technologies
- **Frontend**: Vue.js 3.5.13 with TypeScript 5.7.2
- **UI Framework**: Vuetify 3.8.3
- **State Management**: Pinia 2.1.7
- **Routing**: Vue Router 4.2.5
- **Build Tool**: Vite 6.3.1
- **Icons**: Material Design Icons (@mdi/font 7.4.47)
- **Styling**: SASS/SCSS

## Features
- **User Authentication**: Registration and login functionality
- **Task Management**: Create, edit, and organize tasks
- **Achievement System**: Rewards for completed tasks and milestones
- **Friends Area**: Share your progress and connect with others
- **Settings**: Personalize your app experience
- **Theme Switching**: Toggle between light and dark modes

## Application Structure
The application uses a modular architecture with the following main components:

### Views
- **Login/Signup**: User authentication
- **Tasks**: Main area for task management
- **Achievements**: Displays unlocked achievements and rewards
- **Friends**: Social features and connection options
- **Settings**: User preferences and configuration

### Stores
The application uses Pinia for state management with the following stores:

- **Auth Store**: Manages user authentication state and operations
- **Theme Store**: Handles theme preferences (light/dark mode)
- **Task Store**: Manages task data and operations
- **Achievement Store**: Tracks user achievements
- **Friendship Store**: Manages friend connections

### Components
- **ThemeProvider**: Synchronizes theme state between Pinia store and Vuetify
- **Task-related components**: For creating, editing, and displaying tasks
- **Achievement components**: For displaying achievements
- **Friend components**: For managing friend connections

### Router
The app uses Vue Router with the following routes:
- `/login` and `/signup` for authentication
- `/app/*` for main features (requires authentication)
    - `/app/tasks` - Task management
    - `/app/achievements` - Achievement overview
    - `/app/friends` - Friend management
    - `/app/settings` - User configuration

## Theme System
TaskMaster includes a comprehensive theme system that allows users to switch between light and dark modes. The theme preference is persisted in localStorage to maintain the user's choice across sessions.

### Implementation Details
- **Theme Store**: A Pinia store that manages the theme state
- **ThemeProvider Component**: Synchronizes the theme state with Vuetify's theming system
- **Settings View**: Provides a user interface for toggling between themes

## Installation and Development

### Option 1: Local Development
#### Prerequisites
- Node.js (latest LTS version recommended)
- npm (comes with Node.js)

#### Installation
```bash
# Install dependencies
npm install
```

#### Start Development Server
```bash
# Starts the development server with hot-reload
npm run dev
```

#### Build for Production
```bash
# Compiles and minifies for production
npm run build
```

#### Type Checking
```bash
# Runs type checking
npm run type-check
```

### Option 2: Docker Development
#### Prerequisites
- Docker
- Docker Compose

#### Environment Variables
The application uses a `.env` file for configuration. Make sure this file exists in the project root with the following variables:

```
VITE_API_BASE_URL=http://your-api-url:8080/api
VITE_API_BASE_URL_SOCKET=http://your-api-url:8080
VITE_API_BASE_URL_SOCKET_LOCAL=http://localhost:8080
```

The Docker Compose setup automatically loads these variables from the `.env` file.

#### Development with Hot-Reload
```bash
# Start the development container with hot-reload
docker-compose up app-dev
```

#### Production Build
```bash
# Build and start the production container
docker-compose up app-prod --build
```

### Docker Deployment on Raspberry Pi 4
#### Prerequisites
- Raspberry Pi 4 with Ubuntu 64 Server 24 LTS
- Docker and Docker Compose installed on the Raspberry Pi

#### Deployment Steps
1. Clone the repository on your Raspberry Pi
   ```bash
   git clone <repository-url>
   cd taskmastervue
   ```

2. Create a `.env` file in the project root with your environment variables:
   ```bash
   echo "VITE_API_BASE_URL=http://your-api-url:8080/api" > .env
   echo "VITE_API_BASE_URL_SOCKET=http://your-api-url:8080" >> .env
   echo "VITE_API_BASE_URL_SOCKET_LOCAL=http://localhost:8080" >> .env
   ```

3. Build and run the Docker container
   ```bash
   docker-compose up app-prod --build
   ```

4. Access the application at `http://<raspberry-pi-ip>:80`

#### Notes for Raspberry Pi Deployment
- The Docker images used (node:20-alpine and nginx:stable-alpine) are compatible with ARM64 architecture
- Make sure your Raspberry Pi has at least 2GB of RAM for optimal performance
- For production use, consider setting up a reverse proxy with SSL using Nginx or Traefik

## License
[MIT](https://opensource.org/licenses/MIT)
