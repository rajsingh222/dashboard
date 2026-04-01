import numpy as np
from obspy import read

# ==============================
# LOAD MSEED FILE
# ==============================
file_path = r"C:\Users\Sanrachna Prahari 3\OneDrive\Desktop\Raj\Z63qb_20251112_0510-0520.mseed"

st = read(file_path)

print("\n📡 FILE SUMMARY")
print(st)
print("="*50)

# ==============================
# GROUP CHANNELS BY SENSOR
# ==============================
sensors = {}

for tr in st:
    sensor_key = f"{tr.stats.network}.{tr.stats.station}"

    if sensor_key not in sensors:
        sensors[sensor_key] = []

    sensors[sensor_key].append(tr)

# ==============================
# PROCESS EACH SENSOR
# ==============================
for sensor, traces in sensors.items():
    print(f"\n🔹 SENSOR: {sensor}")
    print("-"*40)

    for tr in traces:
        data = tr.data
        start = tr.stats.starttime
        sr = tr.stats.sampling_rate
        n = len(data)

        print(f"Channel: {tr.stats.channel}")
        print(f"Start Time: {start}")
        print(f"Sampling Rate: {sr} Hz")
        print(f"Samples: {n}")

        # ==============================
        # GENERATE TIMESTAMP ARRAY
        # ==============================
        times = np.array([
            start.timestamp + i/sr for i in range(n)
        ])

        # ==============================
        # SHOW SAMPLE OUTPUT
        # ==============================
        print("First 5 Data Points:")
        for i in range(5):
            print(f"  {times[i]} -> {data[i]}")

        print()

# ==============================
# OPTIONAL: EXPORT TO CSV
# ==============================
import pandas as pd

all_rows = []

for tr in st:
    start = tr.stats.starttime
    sr = tr.stats.sampling_rate

    for i, val in enumerate(tr.data):
        ts = start.timestamp + i/sr

        all_rows.append({
            "sensor": f"{tr.stats.network}.{tr.stats.station}",
            "channel": tr.stats.channel,
            "timestamp": ts,
            "value": val
        })

df = pd.DataFrame(all_rows)

df.to_csv("mseed_output.csv", index=False)

print("\n✅ Data exported to mseed_output.csv")