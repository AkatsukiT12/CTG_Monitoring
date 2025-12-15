import wfdb
import pandas as pd
import numpy as np

def download_and_convert():
    print("Downloading Record 1001 from PhysioNet (CTU-UHB Database)...")
    
    try:
        # Read record '1001' directly from the PhysioNet cloud
        # This dataset is open access.
        record = wfdb.rdrecord('1001', pn_dir='ctu-uhb-ctgdb')
        
        # Extract signals
        # Signal 0 is usually FHR (Fetal Heart Rate)
        # Signal 1 is usually UC (Uterine Contractions)
        data = record.p_signal
        sampling_rate = record.fs # Should be 4Hz
        
        print(f"Data acquired. Length: {len(data)} points. Sampling Rate: {sampling_rate}Hz")

        # Create DataFrame
        df = pd.DataFrame(data, columns=['fhr', 'uc'])
        
        # Clean the data (PhysioNet data often has 0s or NaNs for signal loss)
        # We replace 0s with NaN, then interpolate to make the graph look smooth
        df['fhr'] = df['fhr'].replace(0, np.nan).interpolate()
        df['uc'] = df['uc'].replace(0, np.nan).interpolate()
        
        # Add a seconds column
        df['seconds'] = df.index / sampling_rate
        
        # Save to the CSV file your app looks for
        output_file = 'ctg_data.csv'
        df.to_csv(output_file, index=False)
        print(f"Success! Saved real medical data to '{output_file}'")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure you have internet access and 'wfdb' installed.")

if __name__ == "__main__":
    download_and_convert()