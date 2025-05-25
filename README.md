# Project Anima

AI Character Simulator

## Overview

Project Anima is a system that simulates AI characters defined by users, thinking, acting, and speaking autonomously based on given contexts. Simulation results are output as text files, which users can use as material for creating entertainment content such as novels and scenarios.

This project aims to provide creators with a powerful tool to create characters with depth and generate narratives driven by realistic interactions and dynamic story developments.

## Design Philosophy

Project Anima is built on several core principles to ensure a flexible, extensible, and engaging simulation experience:

* **Modularity**: The system is designed with clear separation of concerns, with separate modules for character management, scene management, context building, LLM integration, and information updates. This improves maintainability and extensibility.
* **Data-Driven Characters**: Character personalities, backstories, and growth are driven by structured YAML data (immutable and long-term information), enabling rich and customizable character definitions.
* **Context is King: The Foundation of Character Cognition**: The quality of AI-generated responses heavily depends on the context provided. Project Anima emphasizes building rich, multifaceted contexts for each character's turn. This context consists of four main pillars of information that shape a character's "mind":
    * **Immutable Context**: The core identity of the character - forming immutable aspects like `character_id`, name, age, basic personality traits. This is the foundation upon which all other context layers are built.
    * **Long-Term Context**: This layer represents the character's accumulated experiences, evolving goals, and significant memories, all tied to their `character_id`. It allows characters to learn, grow, and change over time, letting their personal history reflect in their current actions and thoughts.
    * **Scene Context**: This defines the immediate environment and situation - `scene_id`, location, time, current situation, and other present characters (referenced by `character_id`). It acts as a dynamic filter affecting how a character's core traits and long-term information manifest in the current moment.
    * **Short-Term Context**: Captures recent interactions within the current scene (dialogues, actions, etc., associated with `character_id`). It provides conversational memory, ensuring characters respond consistently to immediate previous events.
    These four pillars are dynamically combined by the `ContextBuilder` module to create comprehensive prompts for the LLM, enabling nuanced and consistent character behavior.
* **LLM as Core Engine**: Large Language Models (LLMs) are leveraged for core simulation logic, such as generating character thoughts, actions, speech, and suggesting long-term information updates, enabling dynamic and emergent behavior.
* **User Intervention**: Simulations are not closed boxes. Users can dynamically influence the narrative by intervening in scene situations or providing "divine revelations" to characters. This adds a layer of interactivity and control.
* **Extensibility**: The architecture is designed with future extensions in mind, such as integration with frameworks like LangGraph for more complex LLM flows, or adding new types of user interventions.
* **Developer-Centric (Initial Focus)**: The initial version prioritizes robust backend logic and console-based interfaces, suitable for developers and creators familiar with this interaction model.
* **Clear Logging**: Comprehensive logging of simulation events, character thoughts, and LLM interactions is implemented, aiding in debugging, analysis, and understanding simulation flow.
* **YAML/JSON for Data**: Configuration files and logs primarily use YAML and JSON formats, balancing human readability and machine parseability.

## Key Features

* **Character Definition**: Define character immutable and long-term information using YAML files
* **Scene Setting**: Define scene situation, location, time, and participating characters using YAML files
* **Thought Generation**: Generate character thoughts, actions, and speech using LLM (Gemini/OpenAI)
* **User Intervention**: Ability to change scene situations and provide "divine revelations" to characters during simulation
* **Long-Term Information Updates**: Update character memories, goals, etc. based on events and LLM suggestions after simulation

## Technology Stack

* Python 3.9+
* Pydantic: Data structure definition and validation
* LangGraph: LLM processing flow control
* PyYAML: Configuration file loading
* Google Generative AI / OpenAI API: LLM service integration
* python-dotenv: Environment variable management (API keys, etc.)

## Installation

### Prerequisites

* Python 3.9 or higher
* pip (Python package manager)
* Virtual environment tool (venv, conda, etc.)
* Gemini API key or OpenAI API key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/project-anima.git  # Replace with the actual repository URL
cd project-anima
```

### 2. Create and Activate a Virtual Environment

```bash
# Using venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. Install Dependencies

During development, installing the project in editable mode is recommended. This will also install all dependencies defined in pyproject.toml.

```bash
pip install -e .
```

To install development dependencies (pytest, black, flake8, etc.):

```bash
pip install -e ".[dev]"
```

### 4. Set Up API Keys

Create a `.env` file in the project root directory and add your API keys:

```
# Gemini API Key
GOOGLE_API_KEY=your_api_key_here

# OpenAI API Key (if needed)
# OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Add the `.env` file to `.gitignore` to avoid committing your API keys.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run a Simulation

```bash
# Basic simulation
python scripts/run_simulation.py

# With custom parameters
python scripts/run_simulation.py --scene data/scenes/school_rooftop.yaml --max-turns 5 --debug

# Interactive mode
python scripts/run_interactive.py
```

### 3. Run Tests

```bash
python run_tests.py
```

## Usage

### Basic Execution

The main way to run a simulation is through `scripts/run_simulation.py`.

```bash
# Run with default settings (default scene, limited number of turns, etc.)
python scripts/run_simulation.py

# Specify a scene configuration file
python scripts/run_simulation.py --scene data/scenes/your_scene_file.yaml

# Specify maximum number of turns
python scripts/run_simulation.py --max-turns 10

# Specify the LLM model to use
python scripts/run_simulation.py --llm-model gemini-1.5-pro-latest
```

### Command Line Options

* `--scene SCENE_FILE_PATH`: Path to the scene configuration YAML file (default: data/scenes/school_rooftop.yaml)
* `--characters-dir CHARACTERS_DIR_PATH`: Path to the directory containing character configuration files (default: data/characters)
* `--prompts-dir PROMPTS_DIR_PATH`: Path to the directory containing LLM prompt templates (default: data/prompts)
* `--max-turns MAX_TURNS`: Maximum number of turns to run in the simulation (default: 3)
* `--llm-model LLM_MODEL_NAME`: Name of the LLM model to use (default: gemini-1.5-flash-latest)
* `--debug`: Enable debug mode for more detailed logging and LLM prompt/response display

### Interactive Mode

Project Anima also provides an interactive command-line interface that allows you to step through the simulation one turn at a time and intervene as needed.

```bash
# Start the interactive CLI
python scripts/run_interactive.py

# Specify a scene configuration file
python scripts/run_interactive.py --scene data/scenes/your_scene_file.yaml

# Enable debug mode to display LLM prompts and responses
python scripts/run_interactive.py --debug
```

In interactive mode, you can use the following commands:

* `start` - Start the simulation
* `next` or `n` - Execute the next turn
* `status` or `s` - Display the current simulation status
* `intervene` or `i` - Intervene in the simulation (update situation, add/remove characters, etc.)
* `update_ltm` or `ultm` - Update a character's long-term memory
* `help_interventions` - Display available intervention types
* `quit` or `q` - End the simulation and exit

Example of intervention commands:
```
intervene update_situation 突然、大きな音がした。全員が振り向いた。
intervene give_revelation char_001 あなたは相手が嘘をついていることに気づいた。
update_ltm char_001
```

When running in debug mode (`--debug`), the system will display the full prompts sent to the LLM and the raw responses received, which is useful for understanding how the system works and for troubleshooting.

## Creating Character Configuration Files

Character configurations are defined in two YAML files per character, typically placed in `data/characters/{character_id}/`.

### 1. immutable.yaml (Immutable Information)

This file contains the core, unchanging aspects of a character.

```yaml
# data/characters/{character_id}/immutable.yaml
character_id: "unique_character_identifier_001"  # Unique ID for the character
name: "Character Name"
age: 25  # Optional
occupation: "Character's Occupation"  # Optional
base_personality: |
  Detailed description of the character's basic personality traits,
  core values, and general attitudes. This should have sufficient
  richness for the LLM to understand the character's basic behavior.
# Additional custom immutable fields can be added as needed
```

### 2. long_term.yaml (Long-Term Information)

This file contains information that evolves as the character experiences simulations.

```yaml
# data/characters/{character_id}/long_term.yaml
character_id: "unique_character_identifier_001"  # Must match immutable.yaml
experiences:
  - event: "A significant past event that shaped the character."
    importance: 8  # Scale of 1-10
  - event: "Another important experience."
    importance: 6
goals:  # Character's desires and wishes
  - goal: "A major long-term ambition."
    importance: 9
  - goal: "A more immediate, everyday wish."
    importance: 3
memories:
  - memory: "A specific memory of an event, including dialogue and sensory details."
    scene_id_of_memory: "S00X"  # Scene_ID where this memory was formed or became significant
    related_character_ids: ["other_char_id_002"]  # List of Character_IDs involved, if any
# These lists will be updated by the system based on LLM suggestions
```

## Creating Scene Configuration Files

Scene configurations are defined in YAML files, typically placed in `data/scenes/`. The filename itself serves as the scene_id (e.g., S001.yaml).

```yaml
# data/scenes/{scene_id}.yaml (e.g., data/scenes/S001.yaml)
scene_id: "S001"  # Unique ID for the scene, should match the filename
location: "Specific location, e.g., 'A busy downtown cafe' or 'A quiet corner of the library'"  # Optional
time: "Time of day or specific date, e.g., 'Late afternoon' or '2025-05-22 15:00'"  # Optional
situation: |
  Detailed description of the current scene setting, atmosphere, ongoing events,
  and relevant environmental details. This sets the stage for character interactions.
participant_character_ids:
  - "participant_1_character_id"
  - "participant_2_character_id"
  # Add more character_ids as needed
previous_scene_log_reference: "scene_S000.json"  # Optional: filename of previous scene's log for context continuity
```

## Checking Simulation Results

Simulation logs are stored in the `logs/` directory, typically in timestamp-named subfolders for each simulation run:
`logs/sim_{timestamp}/scene_{scene_id}.json`

## Development Guide

### Running Tests

This project uses pytest for unit testing.

```bash
# Run all tests
pytest

# Run tests in a specific file
pytest tests/test_your_module.py

# Run a specific test case
pytest tests/test_your_module.py::test_your_function
```

(Make sure pytest is installed, usually via `pip install -e ".[dev]"`)

### Code Formatting

This project uses Black for code formatting and isort for sorting imports.

```bash
# Format all files
black .
isort .
```

It's recommended to configure your editor to format on save using these tools.

## Project Structure

```
project-anima/
├── src/                  # Source code
│   └── project_anima/    # Main package
│       ├── core/         # Core application logic
│       │   ├── character_manager.py
│       │   ├── context_builder.py
│       │   ├── data_models.py
│       │   ├── information_updater.py
│       │   ├── llm_adapter.py
│       │   ├── scene_manager.py
│       │   └── simulation_engine.py
│       ├── utils/        # Utility modules
│       │   └── file_handler.py
│       ├── cli.py        # Command line interface
│       └── interactive_cli.py  # Interactive CLI
├── data/                 # Data files
│   ├── characters/       # Character configuration files (YAML)
│   │   └── {character_id}/
│   │       ├── immutable.yaml
│   │       └── long_term.yaml
│   ├── scenes/           # Scene configuration files (YAML)
│   │   └── {scene_id}.yaml
│   └── prompts/          # LLM prompt templates (.txt)
│       ├── think_generate.txt
│       └── long_term_update.txt
├── scripts/              # Execution scripts
│   ├── run_simulation.py
│   └── run_interactive.py
├── tests/                # Unit tests and integration tests
│   ├── test_character_manager.py
│   └── ...
├── examples/             # Example files and manual tests
├── docs/                 # Project documentation
├── issues/               # Issue tracking files
│   └── closed/
├── logs/                 # Simulation output logs
│   └── sim_{timestamp}/
│       └── scene_{scene_id}.json
├── config/               # Configuration files
├── tools/                # Development and management tools
├── .env.example          # Example environment file (API keys)
├── .gitignore
├── setup.py              # Package setup
├── pyproject.toml        # Project metadata and dependencies
├── requirements.txt      # Dependencies
└── README.md             # This file
```
