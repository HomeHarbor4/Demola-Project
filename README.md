# RealEstateSync

A comprehensive real estate platform that integrates property listings with crime statistics and other relevant data.

## Features

- Property listing management
- Crime statistics integration
- User authentication and authorization
- Real-time data updates
- Advanced search and filtering
- Responsive web interface

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for data fetching
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- Drizzle ORM
- JWT authentication

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

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/RealEstateSync.git
cd RealEstateSync
```

2. Install dependencies:
```bash
# Install root dependencies
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
# Create .env file in server directory
# Update VITE_API_BASE_URL to http://localhost:5000/api
```

4. Update the environment variables with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT authentication
- `API_URL`: Backend API URL

### Database Setup

1. Create the PostgreSQL database:
```bash
createdb realestatesync
```

2. Run database migrations:
```bash
cd server
npm run db:generate
npm run db:push
```

## Running the Application

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
- Frontend: http://localhost:5173
- Backend: http://localhost:5000


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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@realestatesync.com or join our Slack channel.

## Acknowledgments

- Statistics Finland for crime data
- OpenStreetMap for mapping data
- All contributors who have helped shape this project 