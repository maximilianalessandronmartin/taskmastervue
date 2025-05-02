## Projektübersicht
TaskMaster ist eine moderne Web-Anwendung, die entwickelt wurde, um die persönliche Produktivität zu steigern und Aufgaben auf eine spielerische Weise zu verfolgen. Die Anwendung bietet ein Achievement-System, soziale Funktionen und ein intuitives Aufgabenmanagement.
## Technologien
- **Frontend**: Vue.js 3.5.13 mit TypeScript 5.7.2
- **UI Framework**: Vuetify 3.8.3
- **State Management**: Pinia 2.1.7
- **Routing**: Vue Router 4.2.5
- **Build-Tool**: Vite 6.3.1
- **Icons**: Material Design Icons (@mdi/font 7.4.47)
- **Styling**: SASS/SCSS

## Funktionen
- **Benutzerauthentifizierung**: Registrierung und Login
- **Aufgabenverwaltung**: Erstellen, Bearbeiten und Organisieren von Aufgaben
- **Achievement-System**: Belohnungen für erledigte Aufgaben und Meilensteine
- **Freundesbereich**: Teilen Sie Ihre Fortschritte und verbinden Sie sich mit anderen
- **Einstellungen**: Personalisieren Sie Ihre App-Erfahrung

## Anwendungsstruktur
Die Anwendung verwendet einen modularen Aufbau mit folgenden Hauptkomponenten:
### Ansichten
- **Login/Signup**: Benutzerauthentifizierung
- **Aufgaben**: Hauptbereich für das Aufgabenmanagement
- **Achievements**: Zeigt freigeschaltete Erfolge und Belohnungen
- **Freunde**: Soziale Funktionen und Verbindungsmöglichkeiten
- **Einstellungen**: Benutzerpräferenzen und Konfiguration

### Router
Die App verwendet Vue Router mit folgenden Routen:
- `/login` und `/signup` für die Authentifizierung
- `/app/*` für die Hauptfunktionen (erfordert Authentifizierung)
    - `/app/tasks` - Aufgabenverwaltung
    - `/app/achievements` - Erfolgsübersicht
    - `/app/friends` - Freundesverwaltung
    - `/app/settings` - Benutzerkonfiguration

## Installation und Entwicklung
### Voraussetzungen
- Node.js (aktuelle LTS-Version empfohlen)
- npm (wird mit Node.js installiert)

### Installation
``` bash
# Abhängigkeiten installieren
npm install
```
### Entwicklungsserver starten
``` bash
# Startet den Entwicklungsserver mit Hot-Reload
npm run dev
```
### Für Produktion bauen
``` bash
# Kompiliert und minimiert für die Produktion
npm run build
```
### Typenüberprüfung
``` bash
# Führt die Typenüberprüfung durch
npm run type-check
```
## Lizenz
[MIT](https://opensource.org/licenses/MIT)
