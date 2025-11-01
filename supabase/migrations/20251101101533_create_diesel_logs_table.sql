/*
  # Create TNSTC Diesel Logs Table

  1. New Tables
    - `diesel_logs`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `date_time` (timestamptz) - Date and time of fueling
      - `vehicle_no` (text) - Vehicle registration number
      - `route_no` (text) - Bus route number
      - `staff_no` (text) - Staff identification number
      - `driver_name` (text) - Name of the driver
      - `kilometers_driven` (numeric) - Kilometers driven
      - `diesel_litres` (numeric) - Volume of diesel in litres
      - `kmpl` (numeric) - Calculated kilometers per litre
      - `created_at` (timestamptz) - Timestamp of record creation

  2. Security
    - Enable RLS on `diesel_logs` table
    - Add policy for public read access (fuel station staff access)
    - Add policy for public insert access (fuel station staff can add entries)
    - Add policy for public update access (fuel station staff can edit entries)
    - Add policy for public delete access (fuel station staff can delete entries)

  3. Notes
    - All policies allow public access since this is an internal fuel station application
    - KMPL is stored as a calculated value for historical records
    - Timestamps use timestamptz for timezone awareness
*/

CREATE TABLE IF NOT EXISTS diesel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_time timestamptz NOT NULL,
  vehicle_no text NOT NULL,
  route_no text NOT NULL,
  staff_no text NOT NULL,
  driver_name text NOT NULL,
  kilometers_driven numeric NOT NULL,
  diesel_litres numeric NOT NULL,
  kmpl numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diesel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON diesel_logs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON diesel_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON diesel_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON diesel_logs FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_diesel_logs_created_at ON diesel_logs(created_at DESC);