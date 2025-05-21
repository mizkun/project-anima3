from setuptools import setup, find_packages

setup(
    name="project-anima",
    version="0.1.0",
    description="AIキャラクターシミュレーター",
    author="Project Anima Team",
    packages=["core", "characters", "scenes", "logs", "prompts", "utils"],
    install_requires=[
        "pydantic>=2.0.0",
        "langgraph>=0.0.15",
        "pyyaml>=6.0.1",
        "google-generativeai>=0.3.0",
        "openai>=1.0.0",
    ],
    python_requires=">=3.9",
) 