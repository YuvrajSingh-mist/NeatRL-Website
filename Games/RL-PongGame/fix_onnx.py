"""
Fix ONNX model to embed all data in a single file for browser compatibility
"""
import onnx
import sys

input_path = "frontend/pong_agent.onnx"
output_path = "frontend/pong_agent_embedded.onnx"

print(f"Loading model from {input_path}...")
model = onnx.load(input_path, load_external_data=True)

print("Converting to single-file format...")
# Save with all data embedded
onnx.save_model(
    model,
    output_path,
    save_as_external_data=False
)

import os
file_size = os.path.getsize(output_path)
print(f"✅ Model saved to {output_path}")
print(f"File size: {file_size / 1024:.2f} KB")

# Verify no external data
print("\nVerifying...")
test_model = onnx.load(output_path)
has_external = any(
    init.external_data for init in test_model.graph.initializer 
    if hasattr(init, 'external_data') and init.external_data
)
if has_external:
    print("❌ Still has external data!")
    sys.exit(1)
else:
    print("✅ All data is embedded!")
    
# Move to final location
os.replace(output_path, input_path)
print(f"✅ Replaced {input_path}")

# Clean up external data file
data_file = input_path + ".data"
if os.path.exists(data_file):
    os.remove(data_file)
    print(f"✅ Removed {data_file}")
