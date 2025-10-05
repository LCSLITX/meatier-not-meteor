# 🛡️ Asteroid Defense Simulator

An interactive asteroid impact simulator inspired by [jsOrrery](https://mgvez.github.io/jsorrery/), designed to educate about planetary defense and cosmic impact consequences.

## ✨ Features

### 🎯 Main Functionality
- **Parametric Simulation**: Configure asteroid size, velocity, angle, and composition
- **Mitigation Strategies**: 4 deflection methods (Kinetic Impactor, Gravity Tractor, Nuclear Deflection)
- **Scientific Calculations**: Impact energy, crater size, seismic magnitude, tsunami height, casualties, and economic damage
- **3D Visualization**: Complete solar system with jsOrrery-style camera controls
- **2D Impact Map**: Global impact visualization with seismic waves and tsunami zones
- **Advanced Interface**: Collapsible sidebar with organized controls and real-time statistics
- **API Integration**: Connect to NASA NEO, Sentry, and custom APIs for real asteroid data
- **Splash Screen**: Professional loading screen with logo support

### 🎨 Design e UX
- **Jornada Guiada**: Fluxo claro em 3 etapas (Configurar → Simular → Analisar)
- **Feedback Imediato**: Sliders responsivos com prévia em tempo real
- **Linguagem Acessível**: Termos científicos traduzidos para conceitos compreensíveis
- **Gamificação**: Feedback de sucesso/falha na defesa planetária
- **Design Responsivo**: Interface adaptável para desktop e mobile

## 🚀 How to Use

1. **Configure Parameters**: Adjust asteroid size, velocity, angle, and composition
2. **Choose Strategy**: Select a mitigation method (optional)
3. **Select Data Source**: Choose between manual input or real-time NASA/Sentry data
4. **Configure Visualization**: Switch between 3D visualization and 2D impact map
5. **Simulate**: Click "Simulate" and observe the animation
6. **Analyze**: View detailed statistics and impact effects

## 📊 Simulation Parameters

### Asteroid
- **Size**: 10m to 1km diameter
- **Velocity**: 5 to 50 km/s
- **Impact Angle**: 15° to 90°
- **Composition**: Rocky, Metallic, Icy, Mixed

### Data Sources
- **Manual Input**: Custom asteroid parameters
- **NASA NEO Database**: Real-time Near Earth Objects
- **Sentry Risk Table**: Potentially hazardous asteroids
- **Custom API**: Your own asteroid data endpoints

### Mitigation Strategies
- **No Action**: Direct impact without intervention
- **Kinetic Impactor**: Controlled impact deflection
- **Gravity Tractor**: Gradual gravitational deflection
- **Nuclear Deflection**: Explosion-based deflection

### Calculated Results
- **Impact Energy**: TNT equivalent in megatons
- **Crater Size**: Diameter in kilometers
- **Seismic Magnitude**: Richter scale
- **Tsunami Height**: Maximum wave height
- **Estimated Casualties**: Number of people affected
- **Economic Damage**: Value in billions USD

## 🛠️ Technologies Used

- **HTML5**: Semantic and accessible structure
- **CSS3**: Modern design with CSS variables and animations
- **JavaScript ES6+**: Interactive logic and state management
- **Three.js**: 3D orbital trajectory visualization
- **Font Awesome**: Icons for better UX
- **Google Fonts**: Inter typography for readability
- **NASA APIs**: Real-time asteroid and NEO data
- **USGS APIs**: Geological and seismic data

## 📁 Project Structure

```
├── index.html          # Main application page
├── styles.css          # Styles and animations
├── script.js           # Application logic
├── api-config.js       # API configuration and helpers
└── README.md          # Documentation
```

## 🎮 Controls and Shortcuts

### Keyboard
- **Enter**: Start simulation
- **Escape**: Reset simulation
- **E**: Export results

### Mouse
- **Scroll**: Zoom in/out (free camera)
- **Drag**: Rotate camera (free camera)
- **Sliders**: Adjust parameters in real-time

### Visualization
- **3D/2D**: Switch between visualizations
- **Camera View**: Earth, Sun, Asteroid, Free Camera
- **Scale**: Adjust planet size (1x to 100x)
- **Speed**: Control animation (0% to 100%)

### Sidebar
- **Toggle**: Click hamburger menu or outside to close
- **API Data**: Load real asteroid data from NASA/Sentry
- **Collapsible**: Sidebar can be hidden for full-screen view

## 📈 Fórmulas de Cálculo (Mockadas)

### Energia de Impacto
```
Energia = 0.5 × massa × velocidade²
Equivalente TNT = Energia / (4.184 × 10⁹)
```

### Tamanho da Cratera
```
Diâmetro = (Energia_TNT / 10⁶)^0.294 × 1000 metros
```

### Magnitude Sísmica
```
Magnitude = log₁₀(Energia_TNT) × 0.67 + 4.4
```

### Altura do Tsunami
```
Altura = (Energia_TNT / 10⁶)^0.4 × 50 metros
```

## 🔮 Próximas Funcionalidades

- [ ] Integração com APIs da NASA NEO e USGS
- [ ] Mais estratégias de mitigação
- [ ] Histórico de simulações
- [ ] Modo educativo com explicações científicas
- [ ] Exportação de relatórios em PDF
- [ ] Simulação de múltiplos asteroides

## 🤝 Contribuição

Este projeto foi desenvolvido como parte do NASA Space Apps Challenge, baseado no excelente trabalho do [jsOrrery](https://github.com/mgvez/jsorrery) por [mgvez](https://github.com/mgvez).

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🎯 Objetivo Educacional

Este simulador tem como objetivo educar sobre:
- Física de impactos cósmicos
- Estratégias de defesa planetária
- Consequências ambientais de impactos
- Importância da detecção precoce de asteroides

---

**Desenvolvido com ❤️ para a defesa planetária**
