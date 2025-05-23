"""
Command-line interface for Project Anima.
"""

import argparse
import os
import sys
from datetime import datetime

from project_anima.core.simulation_engine import SimulationEngine


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run Project Anima simulation")
    parser.add_argument(
        "--scene",
        type=str,
        default="data/scenes/school_rooftop.yaml",
        help="Path to scene file",
    )
    parser.add_argument(
        "--characters-dir",
        type=str,
        default="data/characters",
        help="Path to characters directory",
    )
    parser.add_argument(
        "--prompts-dir",
        type=str,
        default="data/prompts",
        help="Path to prompts directory",
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=3,
        help="Maximum number of turns to simulate",
    )
    parser.add_argument(
        "--llm-model",
        type=str,
        default="gemini-1.5-flash-latest",
        help="LLM model to use",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode",
    )
    return parser.parse_args()


def main():
    """Main entry point for the application."""
    args = parse_args()

    # Check if scene file exists
    if not os.path.exists(args.scene):
        print(f"Error: Scene file '{args.scene}' not found.")
        sys.exit(1)

    # Create logs directory if it doesn't exist
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_dir = f"logs/sim_{timestamp}"
    os.makedirs(log_dir, exist_ok=True)

    # Initialize simulation engine
    engine = SimulationEngine(
        scene_file_path=args.scene,
        characters_dir=args.characters_dir,
        prompts_dir=args.prompts_dir,
        log_dir=log_dir,
        llm_model=args.llm_model,
        debug=args.debug,
    )

    # Start simulation
    print(f"Starting simulation with scene: {args.scene}")
    print(f"Maximum turns: {args.max_turns}")
    print(f"Using LLM model: {args.llm_model}")
    print(f"Logs will be saved to: {log_dir}")

    try:
        engine.start_simulation(max_turns=args.max_turns)
        print(f"\nSimulation completed successfully.")
        print(f"Logs saved to: {log_dir}")
    except KeyboardInterrupt:
        print("\nSimulation interrupted by user.")
        print(f"Partial logs saved to: {log_dir}")
    except Exception as e:
        print(f"\nError during simulation: {str(e)}")
        print(f"Partial logs may be available in: {log_dir}")
        raise


if __name__ == "__main__":
    main()
