# HomeHarbor

*Home Harbor* is a web application that helps users make better-informed decisions when buying a home. By combining trusted open data with interactive visualizations, users can easily explore neighborhoods, view property trends, assess safety and amenities, and filter based on what matters most to them.

Built for first-time buyers, families, and real estate enthusiasts, Home Harbor simplifies the research process and empowers users to find homes that truly match their lifestyle.

## Features

- 🔍 *City/Area Search*: Explore neighborhoods based on location.
- 🗺️ *Interactive Maps*: View parks, schools, transport routes, and safety information visually.
- 📈 *Market Insights*: Analyze property price trends and living conditions.
- 🎯 *Smart Filters*: Customize your search by price, commute time, school ratings, and more.
- 📱 *Responsive Design*: Accessible from desktops, tablets, and mobile devices.


## 🛠️ Technology Stack

- *Frontend*: React.js, Tailwind CSS
- *Backend*: Node.js, Express.js
- *Database*: MongoDB
- *External Data Sources*: 
  - Oulu Open Data Portal
  - Statistics Finland
  - OECD Better Life Index
    
## 🌍 Live Demo

Access the live version here:  
🔗 [https://realestate-webapp.onrender.com/](https://realestate-webapp.onrender.com/)

---


## Project Structure

```
RealEstateSync/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   └── types/         # TypeScript type definitions
│   └── vite.config.ts     # Vite configuration
│
├── server/                 # Backend Express application
│   ├── db/                # Database configuration
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── types/             # TypeScript type definitions
│
└── shared/                # Shared code between frontend and backend
    └── schema/            # Database schema definitions
```

## 🧑‍💻 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/HomeHarbor4/Demola-Project
cd Demola-Project
```


2. Install dependencies:
```bash
# Install root dependencies
npm install --legacy-peer-deps
```

## Running the Application
First Run database migrations:
```bash
cd server
npm run db:generate
npm run db:push
```
### Development Mode
1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm run web
```

The application will be available at:
 http://localhost:5173
 


## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Properties

- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Crime Statistics

- `GET /api/crime-rate?city=:city` - Get crime statistics for a city
- `GET /api/crime-data` - Get all crime data

## Data Processing

The application includes a crime data service that:
1. Fetches data from the Statistics Finland API
2. Processes data in parallel batches
3. Stores data in the PostgreSQL database
4. Updates data every 10 minutes

### Crime Data Structure

- Monthly crime statistics
- Municipality-level data
- Crime group categorization
- Historical trends

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🧠 Future Enhancements

- Mortgage calculator integration
- Predictive analytics for market trends
- Nationwide property coverage expansion
- Rental property listings

## 👥 Team

- Anu Rawat  
- Vanshika Sanni  
- Sujata Shresta  
- Esther Fatoyinbo
  

