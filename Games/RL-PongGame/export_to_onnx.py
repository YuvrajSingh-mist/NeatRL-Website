"""
Export trained PyTorch RL model to ONNX format for browser inference
"""
import torch
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from training.model import Model
from training.agent import Agent

def export_model_to_onnx(model_path="models/latest.pt", output_path="frontend/pong_agent.onnx"):
    """
    Export the trained RL model to ONNX format
    
    Args:
        model_path: Path to the trained PyTorch model (.pt file)
        output_path: Path where ONNX model will be saved
    """
    print(f"Loading model from {model_path}...")
    
    # Create agent with same configuration as training (hidden_layer=756, frame_stack=3)
    agent = Agent(eval=True, frame_stack=3, hidden_layer=756)
    
    # Load the trained weights
    agent.model.load_the_model(filename=model_path)
    
    # Move model to CPU for ONNX export (required for compatibility)
    agent.model = agent.model.cpu()
    agent.model.eval()  # Set to evaluation mode
    
    print(f"Model loaded successfully!")
    print(f"Model architecture: {agent.model}")
    
    # Create dummy input matching the expected shape: (batch_size, frame_stack, height, width)
    # The model expects stacked grayscale frames (3 frames of 84x84)
    dummy_input = torch.randn(1, 3, 84, 84)
    
    print(f"Dummy input shape: {dummy_input.shape}")
    
    # Export to ONNX
    print(f"Exporting to ONNX format...")
    
    # Export with all data embedded in single file
    torch.onnx.export(
        agent.model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,  # Use opset 14 for better compatibility
        do_constant_folding=True,  # Optimize the model
        input_names=['input'],
        output_names=['action_logits'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'action_logits': {0: 'batch_size'}
        },
        verbose=False
    )
    
    print(f"✅ Model exported successfully to {output_path}")
    
    # Ensure no external data files are created and convert if needed
    import onnx
    model = onnx.load(output_path)
    
    # Check if external data is used
    has_external_data = any(
        init.external_data for init in model.graph.initializer 
        if hasattr(init, 'external_data') and init.external_data
    )
    
    if has_external_data:
        print("⚠️  Model has external data, converting to single file...")
        # Convert external data to embedded
        onnx.save_model(
            model, 
            output_path,
            save_as_external_data=False
        )
        print("✓ Converted to single-file format")
        # Reload to verify
        model = onnx.load(output_path)
    
    # Get file size
    file_size = os.path.getsize(output_path)
    print(f"File size: {file_size / 1024:.2f} KB")
    
    # Verify the export by loading it back
    print("\nVerifying ONNX model...")
    import onnx
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("✅ ONNX model is valid!")
    
    # Test inference with ONNX Runtime
    try:
        import onnxruntime as ort
        print("\nTesting ONNX inference...")
        sess = ort.InferenceSession(output_path)
        
        # Get input/output names
        input_name = sess.get_inputs()[0].name
        output_name = sess.get_outputs()[0].name
        
        print(f"Input name: {input_name}")
        print(f"Output name: {output_name}")
        
        # Test inference
        test_input = torch.randn(1, 3, 84, 84).numpy()
        result = sess.run([output_name], {input_name: test_input})
        print(f"Output shape: {result[0].shape}")
        print(f"Sample output: {result[0]}")
        
        # Get action from logits
        action = result[0].argmax()
        print(f"Selected action: {action}")
        print("✅ ONNX inference test passed!")
        
    except ImportError:
        print("⚠️  onnxruntime not installed. Install with: pip install onnxruntime")
        print("   (Optional - only needed for verification)")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Export PyTorch RL model to ONNX")
    parser.add_argument("--model", default="models/latest.pt", help="Path to PyTorch model")
    parser.add_argument("--output", default="frontend/pong_agent.onnx", help="Output ONNX path")
    
    args = parser.parse_args()
    
    export_model_to_onnx(args.model, args.output)
