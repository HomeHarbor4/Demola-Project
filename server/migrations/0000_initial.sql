-- Create crime_data table
CREATE TABLE IF NOT EXISTS crime_data (
    id SERIAL PRIMARY KEY,
    month VARCHAR(7) NOT NULL,
    municipality_code VARCHAR(10) NOT NULL,
    municipality_name VARCHAR(100) NOT NULL,
    crime_group_code VARCHAR(20) NOT NULL,
    crime_group_name VARCHAR(200) NOT NULL,
    crime_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, municipality_code, crime_group_code)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_crime_data_month ON crime_data(month);
CREATE INDEX IF NOT EXISTS idx_crime_data_municipality ON crime_data(municipality_code);
CREATE INDEX IF NOT EXISTS idx_crime_data_crime_group ON crime_data(crime_group_code); 