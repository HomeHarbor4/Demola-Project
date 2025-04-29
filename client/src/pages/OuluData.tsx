import React from 'react';
import OuluDataViewer from '../components/OuluDataViewer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function OuluData() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="py-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-800">Oulu Open Data</h1>
            <p className="text-gray-600">
              Explore property and location data from the city of Oulu, Finland
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <OuluDataViewer />
          </div>
          
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">About Oulu Open Data</h2>
            
            <p className="mb-4">
              The Oulu Open Data portal provides a wealth of information about properties, locations, 
              and city services in the Oulu region of Finland. This data can be valuable for property 
              buyers, investors, and researchers interested in the Finnish real estate market.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">How We Use This Data</h3>
            
            <p className="mb-4">
              We integrate Oulu's open datasets to provide you with:
            </p>
            
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Property price trends and historical data</li>
              <li>Neighborhood information and statistics</li>
              <li>Nearby points of interest (schools, parks, hospitals)</li>
              <li>Transportation and infrastructure data</li>
            </ul>
            
            <p className="mb-4">
              This information helps you make better-informed decisions when searching for properties
              in the Finnish market, particularly in the Oulu region.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-2">Data Sources</h3>
            
            <p className="mb-4">
              All data is sourced directly from the official{' '}
              <a 
                href="https://data.ouka.fi/data/fi/dataset/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Oulu Open Data Portal
              </a>
              . The data is updated regularly and is provided under open data licenses that allow for 
              its reuse and redistribution.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <p className="text-sm text-gray-600 italic">
                Note: Data availability may vary and is subject to updates by the City of Oulu. 
                While we strive to provide the most accurate and up-to-date information, please
                refer to the official Oulu Open Data Portal for the most current datasets.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}